"""R&R ComfyUI workflow agent — CLI for hydrating and submitting workflow JSONs.

Two modes:

  Dry-run (no network)
    python agent.py instruct-image \\
        --prompt "swap the marble fireplace for travertine" \\
        --image main=test_input.png --image reference=test_ref.jpg \\
        --param steps=4 --param cfg=1 \\
        --dry-run --output hydrated.json
    -> writes hydrated.json that you can Load into ComfyUI directly.

  Real run (requires ComfyUI reachable)
    python agent.py instruct-image \\
        --prompt "..." \\
        --image main=foo.png --image reference=bar.jpg \\
        --comfy-url http://localhost:8188 \\
        --output result.png
    -> uploads inputs, submits, polls, downloads the result.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import uuid
from pathlib import Path

try:
    import requests
except ImportError:
    print("Missing dependency: requests. Run `pip install -r requirements.txt`", file=sys.stderr)
    sys.exit(1)


WORKFLOWS_DIR = Path(__file__).resolve().parent.parent / "workflows"

# Per-workflow node-mapping config. Mirrors the _meta block in each JSON.
WORKFLOW_CONFIGS = {
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
        "output_field": "gifs",  # VHS_VideoCombine writes to 'gifs' even for mp4
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
        "output_node": "118",  # color-matched preview by default
        "output_kind": "image",
        "output_field": "images",
    },
}


def load_template(workflow_name: str) -> dict:
    config = WORKFLOW_CONFIGS[workflow_name]
    path = WORKFLOWS_DIR / config["file"]
    if not path.exists():
        raise FileNotFoundError(f"Workflow template not found: {path}")
    template = json.loads(path.read_text(encoding="utf-8"))
    template.pop("_meta", None)
    return template


def upload_image(comfy_url: str, image_path: str) -> str:
    """Upload an image to ComfyUI's input folder. Returns the server-side filename."""
    p = Path(image_path)
    if not p.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")
    mime = "image/png"
    if p.suffix.lower() in (".jpg", ".jpeg"):
        mime = "image/jpeg"
    elif p.suffix.lower() == ".webp":
        mime = "image/webp"
    with open(p, "rb") as f:
        files = {"image": (p.name, f, mime)}
        data = {"overwrite": "true", "subfolder": ""}
        resp = requests.post(f"{comfy_url}/upload/image", files=files, data=data, timeout=60)
        resp.raise_for_status()
        result = resp.json()
        return result.get("name") or p.name


def coerce(value: str):
    """Best-effort string -> int/float/bool coercion for CLI param values."""
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        pass
    if value.lower() in ("true", "false"):
        return value.lower() == "true"
    return value


def hydrate_workflow(
    workflow_name: str,
    *,
    prompt: str,
    image_paths: dict[str, str],
    params: dict[str, object],
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
            raise ValueError(
                f"Missing required image input '{slot_id}' for workflow '{workflow_name}'"
            )
        if dry_run:
            filename = Path(image_paths[slot_id]).name
        else:
            assert comfy_url is not None
            filename = upload_image(comfy_url, image_paths[slot_id])
        template[mapping["node"]]["inputs"][mapping["field"]] = filename

    # 3. Params
    for param_id, value in params.items():
        if param_id not in config["params"]:
            print(f"[warn] Unknown param '{param_id}' for {workflow_name}, ignoring", file=sys.stderr)
            continue
        mapping = config["params"][param_id]
        template[mapping["node"]]["inputs"][mapping["field"]] = value

    return template


def submit_prompt(comfy_url: str, hydrated: dict, client_id: str) -> str:
    resp = requests.post(
        f"{comfy_url}/prompt",
        json={"prompt": hydrated, "client_id": client_id},
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"[error] /prompt returned {resp.status_code}: {resp.text}", file=sys.stderr)
        resp.raise_for_status()
    body = resp.json()
    if body.get("node_errors"):
        print(f"[warn] node_errors in response: {body['node_errors']}", file=sys.stderr)
    return body["prompt_id"]


def wait_for_completion(comfy_url: str, prompt_id: str, *, timeout: int = 600, poll: float = 2.0):
    """Poll /history/<prompt_id> until outputs appear or timeout."""
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
        elapsed = int(time.time() - start)
        sys.stdout.write(f"\r[agent] waiting... {elapsed}s")
        sys.stdout.flush()
        time.sleep(poll)
    print()
    raise TimeoutError(f"Render did not complete within {timeout}s")


def fetch_output(comfy_url: str, history: dict, output_node: str, output_field: str, output_path: str) -> str:
    outputs = history.get("outputs", {})
    node_outputs = outputs.get(output_node)
    if not node_outputs:
        raise ValueError(
            f"No outputs at node {output_node}. Available: {list(outputs.keys())}"
        )
    items = node_outputs.get(output_field) or node_outputs.get("images") or node_outputs.get("gifs") or []
    if not items:
        raise ValueError(f"Node {output_node} produced no items in any of: images/gifs/{output_field}")

    item = items[0]
    params = {
        "filename": item["filename"],
        "type": item.get("type", "output"),
        "subfolder": item.get("subfolder", ""),
    }
    resp = requests.get(f"{comfy_url}/view", params=params, timeout=120)
    resp.raise_for_status()
    Path(output_path).write_bytes(resp.content)
    return output_path


def run(args) -> int:
    # Parse --param key=value
    params: dict[str, object] = {}
    for kv in args.param or []:
        if "=" not in kv:
            print(f"[warn] Bad --param '{kv}', expected key=value", file=sys.stderr)
            continue
        k, v = kv.split("=", 1)
        params[k] = coerce(v)

    # Parse --image slot=path
    image_paths: dict[str, str] = {}
    for spec in args.image or []:
        if "=" not in spec:
            print(f"[warn] Bad --image '{spec}', expected slot=path", file=sys.stderr)
            continue
        slot, path = spec.split("=", 1)
        image_paths[slot] = path

    print(f"[agent] workflow={args.workflow}")
    print(f"[agent] prompt={args.prompt[:80]}{'...' if len(args.prompt) > 80 else ''}")
    print(f"[agent] images={image_paths}")
    print(f"[agent] params={params}")

    hydrated = hydrate_workflow(
        args.workflow,
        prompt=args.prompt,
        image_paths=image_paths,
        params=params,
        comfy_url=args.comfy_url if not args.dry_run else None,
        dry_run=args.dry_run,
    )

    if args.dry_run:
        out_path = args.output or f"{args.workflow}-hydrated.json"
        Path(out_path).write_text(json.dumps(hydrated, indent=2), encoding="utf-8")
        print(f"\n[dry-run] Wrote hydrated workflow → {out_path}")
        print(f"[dry-run] Next: open Zak's ComfyUI, drag this file onto the canvas, click Queue Prompt.")
        print(f"[dry-run] If it runs cleanly there, the agent's hydration logic is correct.")
        return 0

    # Real mode
    client_id = str(uuid.uuid4())
    print(f"[agent] target={args.comfy_url} client_id={client_id}")
    print(f"[agent] uploading inputs + submitting prompt...")
    prompt_id = submit_prompt(args.comfy_url, hydrated, client_id)
    print(f"[agent] prompt_id={prompt_id}")
    history = wait_for_completion(args.comfy_url, prompt_id, timeout=args.timeout)

    config = WORKFLOW_CONFIGS[args.workflow]
    ext = "mp4" if config["output_kind"] == "video" else "png"
    out_path = args.output or f"{args.workflow}-result.{ext}"
    final = fetch_output(
        args.comfy_url,
        history,
        config["output_node"],
        config["output_field"],
        out_path,
    )
    print(f"\n[agent] done → {final}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("workflow", choices=list(WORKFLOW_CONFIGS.keys()))
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--image", action="append", default=[], metavar="slot=path")
    parser.add_argument("--param", action="append", default=[], metavar="key=value")
    parser.add_argument("--comfy-url", default="http://localhost:8188")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print hydrated JSON without uploading or submitting")
    parser.add_argument("--output", help="Output file path")
    parser.add_argument("--timeout", type=int, default=600, help="Poll timeout (seconds)")
    args = parser.parse_args()
    try:
        return run(args)
    except FileNotFoundError as e:
        print(f"[error] {e}", file=sys.stderr)
        return 2
    except (ValueError, RuntimeError, TimeoutError) as e:
        print(f"[error] {e}", file=sys.stderr)
        return 3
    except requests.RequestException as e:
        print(f"[error] HTTP error: {e}", file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())
