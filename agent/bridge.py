"""Local HTTP bridge — what the frontend talks to.

Receives multipart uploads from the browser, drops them into the Egnyte input
folder as `<INPUT_DIR>/<job_id>/`, and exposes status/result endpoints that
read from `<OUTPUT_DIR>/<job_id>/`.

Run:
  python bridge.py
  # listens on http://localhost:8000

Endpoints:
  POST /api/render        — multipart: workflow, prompt, params (json string), preset_id?, image_<slot>...
                            returns { job_id, status_url }
  GET  /api/job/<id>/status   — JSON status block
  GET  /api/job/<id>/result   — binary result file (png/mp4)
  GET  /api/health        — { input_dir, output_dir, watcher_alive }

Env:
  AI_LAB_INPUT  default: R:\\24 - AI Lab\\Input
  AI_LAB_OUTPUT default: R:\\24 - AI Lab\\Output
  BRIDGE_PORT   default: 8000
"""

from __future__ import annotations

import json
import os
import sys
import time
import uuid
from pathlib import Path

try:
    from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse
    import uvicorn
except ImportError:
    print(
        "Missing deps. Run: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)


INPUT_DIR = Path(os.environ.get("AI_LAB_INPUT", r"R:\24 - AI Lab\Input"))
OUTPUT_DIR = Path(os.environ.get("AI_LAB_OUTPUT", r"R:\24 - AI Lab\Output"))
BRIDGE_PORT = int(os.environ.get("BRIDGE_PORT", "8000"))


app = FastAPI(title="R&R ComfyUI bridge", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def slug_to_ext(filename: str) -> str:
    p = Path(filename)
    return p.suffix.lower() or ".png"


@app.get("/api/health")
def health():
    heartbeat_path = OUTPUT_DIR / "_heartbeat.json"
    alive = False
    age_seconds = None
    if heartbeat_path.exists():
        try:
            hb = json.loads(heartbeat_path.read_text(encoding="utf-8"))
            age_seconds = round(time.time() - hb.get("alive_at", 0))
            alive = age_seconds < 180  # 3 min
        except Exception:
            pass
    return {
        "input_dir": str(INPUT_DIR),
        "output_dir": str(OUTPUT_DIR),
        "input_exists": INPUT_DIR.exists(),
        "output_exists": OUTPUT_DIR.exists(),
        "watcher_alive": alive,
        "watcher_age_seconds": age_seconds,
    }


@app.post("/api/render")
async def render(request: Request):
    form = await request.form()
    workflow = form.get("workflow")
    prompt = form.get("prompt", "")
    preset_id = form.get("preset_id") or None
    params_str = form.get("params", "{}")

    if not workflow:
        raise HTTPException(400, "workflow is required")
    try:
        params = json.loads(params_str) if isinstance(params_str, str) else {}
    except json.JSONDecodeError:
        raise HTTPException(400, "params must be valid JSON")

    # Collect image slots: any field starting with image_<slot>
    image_slots: dict[str, UploadFile] = {}
    for key in form.keys():
        if not key.startswith("image_"):
            continue
        value = form[key]
        if hasattr(value, "filename") and hasattr(value, "read"):
            slot_id = key[len("image_"):]
            image_slots[slot_id] = value  # type: ignore[assignment]

    if not image_slots:
        # Debug aid: list what we did receive
        keys = list(form.keys())
        types = {k: type(form[k]).__name__ for k in keys}
        raise HTTPException(
            400,
            f"no image_<slot> fields provided. fields received: {types}",
        )

    # Make job folder
    if not INPUT_DIR.exists():
        raise HTTPException(500, f"INPUT_DIR not accessible: {INPUT_DIR}")

    job_id = f"job_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
    job_dir = INPUT_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=False)

    # Save images first (manifest last so the watcher trigger is reliable)
    inputs_map: dict[str, str] = {}
    for slot_id, upload in image_slots.items():
        ext = slug_to_ext(upload.filename or f"{slot_id}.png")
        target_name = f"{slot_id}{ext}"
        target = job_dir / target_name
        with open(target, "wb") as f:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        inputs_map[slot_id] = target_name

    manifest = {
        "job_id": job_id,
        "workflow": workflow,
        "preset_id": preset_id,
        "prompt": prompt,
        "params": params,
        "inputs": inputs_map,
        "submitted_at": time.time(),
    }
    (job_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )

    # Seed initial status
    out_dir = OUTPUT_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "status.json").write_text(
        json.dumps(
            {
                "job_id": job_id,
                "status": "queued",
                "progress": 0,
                "submitted_at": time.time(),
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    return {
        "job_id": job_id,
        "status_url": f"/api/job/{job_id}/status",
        "result_url": f"/api/job/{job_id}/result",
    }


@app.get("/api/job/{job_id}/status")
def status(job_id: str):
    status_path = OUTPUT_DIR / job_id / "status.json"
    if not status_path.exists():
        # Fallback: input exists but no output yet
        if (INPUT_DIR / job_id / "manifest.json").exists():
            return {"job_id": job_id, "status": "queued", "progress": 0}
        raise HTTPException(404, "job not found")
    try:
        return json.loads(status_path.read_text(encoding="utf-8"))
    except Exception as e:
        raise HTTPException(500, f"could not read status: {e}")


@app.get("/api/job/{job_id}/result")
def result(job_id: str):
    out_dir = OUTPUT_DIR / job_id
    if not out_dir.exists():
        raise HTTPException(404, "job output not found")
    for ext in ("png", "jpg", "jpeg", "webp", "mp4"):
        path = out_dir / f"result.{ext}"
        if path.exists():
            return FileResponse(path, filename=f"{job_id}.{ext}")
    raise HTTPException(404, "result file not produced")


@app.get("/")
def root():
    return JSONResponse(
        {
            "name": "R&R ComfyUI bridge",
            "endpoints": [
                "POST /api/render",
                "GET /api/job/<id>/status",
                "GET /api/job/<id>/result",
                "GET /api/health",
            ],
        }
    )


def main() -> int:
    print(f"[bridge] listening on http://localhost:{BRIDGE_PORT}")
    print(f"[bridge] INPUT  = {INPUT_DIR}")
    print(f"[bridge] OUTPUT = {OUTPUT_DIR}")
    if not INPUT_DIR.exists():
        print(f"[bridge] WARNING: INPUT_DIR not accessible — uploads will fail")
    uvicorn.run(app, host="0.0.0.0", port=BRIDGE_PORT, log_level="info")
    return 0


if __name__ == "__main__":
    sys.exit(main())
