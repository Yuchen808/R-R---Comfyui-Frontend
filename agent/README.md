# Agent — workflow runner

Single-file Python script that:

1. Loads a sanitized template from `../workflows/`
2. Hydrates the placeholders (`__PROMPT_POSITIVE__`, `__INPUT_IMAGE__`, ...) with real user inputs
3. Either prints the result (dry-run) or POSTs to a real ComfyUI HTTP API and polls for output

## Setup

```bash
cd agent
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

## Mode 1 — Dry-run (no network, no ComfyUI needed)

Verifies your hydration logic. Produces a JSON file you can drop onto Zak's ComfyUI canvas.

```bash
python agent.py instruct-image \
  --prompt "swap the marble fireplace for travertine, relight as evening" \
  --image main=./samples/room.png \
  --image reference=./samples/evening_lighting.jpg \
  --param steps=4 --param cfg=1 \
  --dry-run \
  --output hydrated.json
```

```bash
python agent.py image-to-video \
  --prompt "slow camera dolly forward, ambient daylight, soft fabric drift" \
  --image main=./samples/render.png \
  --param duration=5 --param frame_rate=24 \
  --dry-run \
  --output hydrated.json
```

Then:
1. Open ComfyUI in your browser
2. Drag `hydrated.json` onto the canvas
3. Click **Queue Prompt**
4. If it renders → your agent's hydration is correct ✅

## Mode 2 — Real run (requires reachable ComfyUI)

Actually submits and downloads the result.

```bash
python agent.py instruct-image \
  --prompt "..." \
  --image main=./samples/room.png \
  --image reference=./samples/evening.jpg \
  --comfy-url http://zak-workstation.tail-scale.ts.net:8188 \
  --output result.png \
  --timeout 300
```

For local testing if you've installed ComfyUI yourself:
```bash
--comfy-url http://localhost:8188
```

## Workflow configs

| Workflow | Required image slots | Tunable params |
|---|---|---|
| `image-to-video` | `main` | `duration`, `frame_rate`, `loop`, `width`, `height` |
| `instruct-image` | `main`, `reference` | `steps`, `cfg`, `lora_strength`, `color_match_strength`, `seed`, `input_megapixels` |

The full node mappings live in `WORKFLOW_CONFIGS` at the top of `agent.py` — update them when the workflow JSONs change.

## What this is NOT (yet)

- A long-running daemon — it's a one-shot CLI
- A folder watcher (the Egnyte folder-watch loop is a separate component still to build)
- An HTTP server the frontend can hit (next step: wrap this script in a tiny FastAPI server so the frontend can POST jobs to it)

## Troubleshooting

- **"Missing required image input"** — check the `--image slot=path` keys match the workflow's slot names (`main`, `reference`)
- **"Workflow template not found"** — run from inside `agent/` with the `workflows/` directory at `../workflows/`
- **/prompt returns 400** — your hydrated JSON is invalid. Run `--dry-run` first and load it manually in ComfyUI to see the actual error
- **Timeout** — increase `--timeout`, or check if ComfyUI is OOM (FLUX 2 9B + Wan 2.2 14B both want >16GB VRAM)
