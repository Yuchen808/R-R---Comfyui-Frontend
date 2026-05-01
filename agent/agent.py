"""R&R ComfyUI workflow agent — one-shot CLI.

For long-running daemon mode (Egnyte folder watcher), see watcher.py.

Dry-run mode:
  python agent.py instruct-image \\
      --prompt "swap the marble fireplace for travertine" \\
      --image main=test_input.png --image reference=test_ref.jpg \\
      --param steps=4 --param cfg=1 \\
      --dry-run --output hydrated.json

Real run:
  python agent.py instruct-image --prompt "..." \\
      --image main=foo.png --image reference=bar.jpg \\
      --comfy-url http://localhost:8188 --output result.png
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from comfy import (
    WORKFLOW_CONFIGS,
    coerce,
    fetch_output,
    hydrate_workflow,
    poll_until_done,
    submit_prompt,
)


def run(args) -> int:
    params: dict = {}
    for kv in args.param or []:
        if "=" in kv:
            k, v = kv.split("=", 1)
            params[k] = coerce(v)

    image_paths: dict = {}
    for spec in args.image or []:
        if "=" in spec:
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
        print(f"[dry-run] Drag this onto Zak's ComfyUI canvas to verify it runs.")
        return 0

    import uuid
    client_id = str(uuid.uuid4())
    print(f"[agent] target={args.comfy_url} client_id={client_id}")
    prompt_id = submit_prompt(args.comfy_url, hydrated, client_id)
    print(f"[agent] prompt_id={prompt_id}, polling…")

    def progress(elapsed):
        sys.stdout.write(f"\r[agent] waiting {elapsed}s")
        sys.stdout.flush()

    history = poll_until_done(args.comfy_url, prompt_id, timeout=args.timeout, on_progress=progress)
    print()

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
    print(f"[agent] done → {final}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("workflow", choices=list(WORKFLOW_CONFIGS.keys()))
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--image", action="append", default=[], metavar="slot=path")
    parser.add_argument("--param", action="append", default=[], metavar="key=value")
    parser.add_argument("--comfy-url", default="http://localhost:8188")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--output")
    parser.add_argument("--timeout", type=int, default=600)
    args = parser.parse_args()

    try:
        return run(args)
    except FileNotFoundError as e:
        print(f"[error] {e}", file=sys.stderr)
        return 2
    except (ValueError, RuntimeError, TimeoutError) as e:
        print(f"[error] {e}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    sys.exit(main())
