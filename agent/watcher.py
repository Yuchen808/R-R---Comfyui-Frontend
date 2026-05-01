"""Watchdog daemon — runs on Zak's render box (or anywhere with the Z: share mounted).

Watches `<INPUT_DIR>/<job_id>/manifest.json`, processes the job through ComfyUI
(or a dry-run simulator), and writes results to `<OUTPUT_DIR>/<job_id>/`.

Folder contract (per job):

  Input/<job_id>/
    ├── manifest.json     # workflow, prompt, params, file mapping
    ├── main.png          # always
    └── reference.jpg     # if instruct-image

  Output/<job_id>/
    ├── status.json       # progressively updated
    ├── result.png        # or .mp4
    └── error.log         # if failed

Run:
  # Real ComfyUI:
  COMFY_URL=http://localhost:8188 python watcher.py

  # Dry-run (no ComfyUI needed; copies main input to output as fake result):
  DRY_RUN=true python watcher.py

Env vars:
  AI_LAB_INPUT  default: Z:\\Shared\\Rigby Cloud\\24 - AI Lab\\Input
  AI_LAB_OUTPUT default: Z:\\Shared\\Rigby Cloud\\24 - AI Lab\\Output
  COMFY_URL     default: http://localhost:8188
  DRY_RUN       default: false
  POLL_SCAN_SEC default: 5  (re-scan input dir every N seconds even without events)
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import time
import traceback
from pathlib import Path

try:
    from watchdog.events import FileSystemEventHandler
    from watchdog.observers import Observer
except ImportError:
    print("Missing dependency: watchdog. Run: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

from comfy import WORKFLOW_CONFIGS, run_workflow


INPUT_DIR = Path(os.environ.get("AI_LAB_INPUT", r"Z:\Shared\Rigby Cloud\24 - AI Lab\Input"))
OUTPUT_DIR = Path(os.environ.get("AI_LAB_OUTPUT", r"Z:\Shared\Rigby Cloud\24 - AI Lab\Output"))
COMFY_URL = os.environ.get("COMFY_URL", "http://localhost:8188")
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"
POLL_SCAN_SEC = int(os.environ.get("POLL_SCAN_SEC", "5"))
HEARTBEAT_INTERVAL = 60  # seconds

PROCESSED_MARKER = ".processing"  # marker file to claim a job


def log(msg: str) -> None:
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def write_status(job_id: str, **fields) -> None:
    out_dir = OUTPUT_DIR / job_id
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "status.json"
    existing = {}
    if path.exists():
        try:
            existing = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            existing = {}
    existing.update(fields)
    existing["updated_at"] = time.time()
    existing["job_id"] = job_id
    path.write_text(json.dumps(existing, indent=2), encoding="utf-8")


def is_file_stable(path: Path, *, settle_seconds: float = 1.5) -> bool:
    """Return True if the file hasn't changed size in the last `settle_seconds`."""
    if not path.exists():
        return False
    try:
        s1 = path.stat().st_size
        time.sleep(settle_seconds)
        s2 = path.stat().st_size
    except OSError:
        return False
    return s1 == s2 and s1 > 0


def claim_job(job_dir: Path) -> bool:
    """Atomically mark a job as being processed by this watcher. Returns False if already claimed."""
    marker = job_dir / PROCESSED_MARKER
    if marker.exists():
        return False
    try:
        marker.write_text(f"{os.getpid()}\n{time.time()}\n", encoding="utf-8")
        return True
    except OSError:
        return False


def process_job(job_dir: Path) -> None:
    job_id = job_dir.name
    log(f"job {job_id} — claimed")
    write_status(job_id, status="syncing", progress=0, started_at=time.time())

    try:
        manifest_path = job_dir / "manifest.json"
        if not is_file_stable(manifest_path):
            log(f"job {job_id} — manifest still syncing, will retry")
            return
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        workflow_name = manifest["workflow"]
        prompt = manifest.get("prompt") or ""
        params = manifest.get("params") or {}
        inputs = manifest.get("inputs") or {}

        config = WORKFLOW_CONFIGS.get(workflow_name)
        if not config:
            raise ValueError(f"Unknown workflow: {workflow_name}")

        # Resolve input file paths and verify they're stable
        image_paths: dict[str, Path] = {}
        for slot_id in config["image_inputs"]:
            filename = inputs.get(slot_id)
            if not filename:
                raise ValueError(f"Manifest missing input slot '{slot_id}'")
            p = job_dir / filename
            if not is_file_stable(p):
                log(f"job {job_id} — input '{slot_id}' still syncing, will retry")
                return
            image_paths[slot_id] = p

        write_status(job_id, status="processing", progress=5)

        out_dir = OUTPUT_DIR / job_id
        ext = "mp4" if config["output_kind"] == "video" else "png"
        result_path = out_dir / f"result.{ext}"

        if DRY_RUN:
            log(f"job {job_id} — DRY_RUN: simulating render")
            simulate_render(job_id, image_paths.get("main"), result_path)
        else:
            log(f"job {job_id} — calling ComfyUI at {COMFY_URL}")

            def progress_cb(elapsed: int):
                # Rough estimate; ComfyUI's history API doesn't expose mid-render progress
                pct = min(95, 10 + int(elapsed * 1.5))
                write_status(job_id, progress=pct)

            run_workflow(
                workflow_name,
                prompt=prompt,
                image_paths=image_paths,
                params=params,
                comfy_url=COMFY_URL,
                output_path=result_path,
                on_progress=progress_cb,
            )

        write_status(
            job_id,
            status="complete",
            progress=100,
            result_file=f"result.{ext}",
            completed_at=time.time(),
        )
        log(f"job {job_id} — complete → {result_path}")

    except Exception as e:  # noqa: BLE001
        log(f"job {job_id} — FAILED: {e}")
        traceback.print_exc()
        out_dir = OUTPUT_DIR / job_id
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "error.log").write_text(
            f"{type(e).__name__}: {e}\n\n{traceback.format_exc()}",
            encoding="utf-8",
        )
        write_status(
            job_id,
            status="failed",
            error_message=f"{type(e).__name__}: {e}",
            failed_at=time.time(),
        )


def simulate_render(job_id: str, main_input: Path | None, output_path: Path) -> None:
    """Dry-run render: simulate progress, then copy input to output as fake result."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    for pct in (15, 35, 60, 80, 95):
        write_status(job_id, status="processing", progress=pct)
        time.sleep(1.2)
    if main_input and main_input.exists():
        shutil.copyfile(main_input, output_path)
    else:
        output_path.write_bytes(b"")


def scan_pending() -> None:
    """Look for any jobs in INPUT_DIR that don't have a corresponding completed status."""
    if not INPUT_DIR.exists():
        return
    for job_dir in sorted(INPUT_DIR.iterdir()):
        if not job_dir.is_dir():
            continue
        manifest = job_dir / "manifest.json"
        if not manifest.exists():
            continue

        # Skip if already complete
        status_path = OUTPUT_DIR / job_dir.name / "status.json"
        if status_path.exists():
            try:
                st = json.loads(status_path.read_text(encoding="utf-8"))
                if st.get("status") in ("complete", "failed"):
                    continue
            except Exception:
                pass

        if not claim_job(job_dir):
            continue
        process_job(job_dir)


class JobEventHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        path = Path(event.src_path)
        if path.name != "manifest.json":
            return
        time.sleep(0.5)  # let the file settle
        job_dir = path.parent
        if claim_job(job_dir):
            process_job(job_dir)


def write_heartbeat() -> None:
    out = OUTPUT_DIR / "_heartbeat.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        json.dumps(
            {
                "alive_at": time.time(),
                "comfy_url": COMFY_URL,
                "dry_run": DRY_RUN,
                "pid": os.getpid(),
            },
            indent=2,
        ),
        encoding="utf-8",
    )


def main() -> int:
    log(f"watcher starting")
    log(f"  INPUT  = {INPUT_DIR}")
    log(f"  OUTPUT = {OUTPUT_DIR}")
    log(f"  COMFY  = {COMFY_URL}  (DRY_RUN={DRY_RUN})")

    if not INPUT_DIR.exists():
        log(f"ERROR: input folder does not exist. Is the Z: share mounted?")
        return 2
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # First pass: pick up any jobs already sitting in input
    scan_pending()

    observer = Observer()
    observer.schedule(JobEventHandler(), str(INPUT_DIR), recursive=True)
    observer.start()
    log("watching for new jobs…")

    last_heartbeat = 0
    last_scan = 0
    try:
        while True:
            time.sleep(1)
            now = time.time()
            if now - last_heartbeat > HEARTBEAT_INTERVAL:
                write_heartbeat()
                last_heartbeat = now
            if now - last_scan > POLL_SCAN_SEC:
                # Belt and braces — Egnyte sync may not fire local watchdog events reliably
                scan_pending()
                last_scan = now
    except KeyboardInterrupt:
        log("shutting down")
    finally:
        observer.stop()
        observer.join()
    return 0


if __name__ == "__main__":
    sys.exit(main())
