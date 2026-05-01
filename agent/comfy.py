"""Shared workflow hydration + ComfyUI client logic.

Used by:
- agent.py (one-shot CLI)
- watcher.py (long-running daemon on the render box)
- (future) the Cloudflare Worker port
"""

from __future__ import annotations

import json
import time
import uuid
from pathlib import Path
from typing import Any

import requests


# Per-workflow node-mapping config. Keep in sync with workflows/*.json _meta blocks.
WORKFLOW_CONFIGS: dict[str, dict] = {
    "image-to-video": {
        "file": "01-image-to-video.json",
        "image_inputs": {
            "main": {"node": "113", "field": "image"},
        },
        "prompt_node": {"node": "112", "field": "text"},
        "params": {
            "duration": {"node": "205", "field": "value"},
            "frame_rate": {"node": "122", "field": "frame_rate"},
            "loop": {"node": "122", "field": "pingpong"},
            "width": {"node": "203", "field": "value"},
            "height": {"node": "204", "field": "value"},
        },
        "output_node": "122",
        "output_kind": "video",
        "output_field": "gifs",
    },
    "instruct-image": {
        "file": "02-instruct-image.json",
        "image_inputs": {
            "main": {"node": "149", "field": "image"},
            "reference": {"node": "147", "field": "image"},
        },
        "prompt_node": {"node": "108", "field": "text"},
        "params": {
            "steps": {"node": "101", "field": "steps"},
            "cfg": {"node": "102", "field": "cfg"},
            "lora_strength": {"node": "161", "field": "strength_model"},
            "color_match_strength": {"node": "153", "field": "strength"},
            "seed": {"node": "105", "field": "noise_seed"},
            "input_megapixels": {"node": "126", "field": "megapixels"},
        },
        "output_node": "118",
        "output_kind": "image",
        "output_field": "images",
    },
}

WORKFLOWS_DIR = Path(__file__).resolve().parent.parent / "workflows"


def load_template(workflow_name: str) -> dict:
    config = WORKFLOW_CONFIGS[workflow_name]
    path = WORKFLOWS_DIR / config["file"]
    if not path.exists():
        raise FileNotFoundError(f"Workflow template not found: {path}")
    template = json.loads(path.read_text(encoding="utf-8"))
    template.pop("_meta", None)
    return template


def upload_image(comfy_url: str, image_path: Path | str) -> str:
    """Upload to ComfyUI's input folder. Returns the server-side filename."""
    p = Path(image_path)
    if not p.exists():
        raise FileNotFoundError(f"Image not found: {p}")
    mime = "image/png"
    ext = p.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        mime = "image/jpeg"
    elif ext == ".webp":
        mime = "image/webp"
    with open(p, "rb") as f:
        resp = requests.post(
            f"{comfy_url}/upload/image",
            files={"image": (p.name, f, mime)},
            data={"overwrite": "true", "subfolder": ""},
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("name") or p.name


def coerce(value: str) -> Any:
    try:
        return int(value)
    except (TypeError, ValueError):
        pass
    try:
        return float(value)
    except (TypeError, ValueError):
        pass
    if isinstance(value, str) and value.lower() in ("true", "false"):
        return value.lower() == "true"
    return value


def hydrate_workflow(
    workflow_name: str,
    *,
    prompt: str,
    image_paths: dict[str, str | Path],
    params: dict[str, Any],
    comfy_url: str | None = None,
    dry_run: bool = False,
) -> dict:
    config = WORKFLOW_CONFIGS[workflow_name]
    template = load_template(workflow_name)

    # 1. Prompt
    p_map = config["prompt_node"]
    template[p_map["node"]]["inputs"][p_map["field"]] = prompt

    # 2. Image inputs
    for slot_id, mapping in config["image_inputs"].items():
        if slot_id not in image_paths:
            raise ValueError(f"Missing required image input '{slot_id}'")
        if dry_run:
            filename = Path(image_paths[slot_id]).name
        else:
            assert comfy_url, "comfy_url required when dry_run=False"
            filename = upload_image(comfy_url, image_paths[slot_id])
        template[mapping["node"]]["inputs"][mapping["field"]] = filename

    # 3. Params
    for param_id, value in params.items():
        if param_id not in config["params"]:
            continue
        mapping = config["params"][param_id]
        template[mapping["node"]]["inputs"][mapping["field"]] = value

    return template


def submit_prompt(comfy_url: str, hydrated: dict, client_id: str | None = None) -> str:
    if client_id is None:
        client_id = str(uuid.uuid4())
    resp = requests.post(
        f"{comfy_url}/prompt",
        json={"prompt": hydrated, "client_id": client_id},
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    return body["prompt_id"]


def poll_until_done(
    comfy_url: str,
    prompt_id: str,
    *,
    timeout: int = 600,
    poll_interval: float = 2.0,
    on_progress=None,
) -> dict:
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.get(f"{comfy_url}/history/{prompt_id}", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if prompt_id in data:
                entry = data[prompt_id]
                outputs = entry.get("outputs") or {}
                status = entry.get("status") or {}
                if outputs and status.get("completed"):
                    return entry
                if status.get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI reported error: {status}")
        if on_progress:
            on_progress(int(time.time() - start))
        time.sleep(poll_interval)
    raise TimeoutError(f"Render did not complete within {timeout}s")


def fetch_output(
    comfy_url: str,
    history: dict,
    output_node: str,
    output_field: str,
    output_path: Path | str,
) -> Path:
    outputs = history.get("outputs", {})
    node_outputs = outputs.get(output_node)
    if not node_outputs:
        raise ValueError(
            f"No outputs at node {output_node}. Available: {list(outputs.keys())}"
        )
    items = (
        node_outputs.get(output_field)
        or node_outputs.get("images")
        or node_outputs.get("gifs")
        or []
    )
    if not items:
        raise ValueError(f"Node {output_node} produced no items")

    item = items[0]
    params = {
        "filename": item["filename"],
        "type": item.get("type", "output"),
        "subfolder": item.get("subfolder", ""),
    }
    resp = requests.get(f"{comfy_url}/view", params=params, timeout=120)
    resp.raise_for_status()
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(resp.content)
    return out


def run_workflow(
    workflow_name: str,
    *,
    prompt: str,
    image_paths: dict[str, str | Path],
    params: dict[str, Any],
    comfy_url: str,
    output_path: Path | str,
    timeout: int = 600,
    on_progress=None,
) -> Path:
    """End-to-end: hydrate → submit → wait → fetch result. Returns output path."""
    hydrated = hydrate_workflow(
        workflow_name,
        prompt=prompt,
        image_paths=image_paths,
        params=params,
        comfy_url=comfy_url,
        dry_run=False,
    )
    prompt_id = submit_prompt(comfy_url, hydrated)
    history = poll_until_done(
        comfy_url,
        prompt_id,
        timeout=timeout,
        on_progress=on_progress,
    )
    config = WORKFLOW_CONFIGS[workflow_name]
    return fetch_output(
        comfy_url,
        history,
        config["output_node"],
        config["output_field"],
        output_path,
    )
