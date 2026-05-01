# Agent — bridge + watcher

Two long-running services + a one-shot CLI:

| File | What | Where it runs |
|---|---|---|
| `bridge.py` | HTTP server the **frontend** talks to. Receives uploads, writes to Egnyte input folder, exposes status/result endpoints. | Anyone on the studio network (initially Yuchen's laptop; later: Cloudflare Worker port). |
| `watcher.py` | Long-running daemon that watches the Egnyte input folder, calls ComfyUI, writes to the output folder. | **Zak's render box.** Single instance. |
| `agent.py` | One-shot CLI. Hydrate + submit a single workflow. Useful for smoke tests and verifying JSON correctness. | Wherever. |
| `comfy.py` | Shared logic — workflow configs, hydration, ComfyUI HTTP client. | Imported by the others. |

## Folder contract

Both services use these env-configurable paths (defaults are the Z: share):

```
AI_LAB_INPUT  = R:\24 - AI Lab\Input
AI_LAB_OUTPUT = R:\24 - AI Lab\Output
```

Each render is one `<job_id>` subfolder under each:

```
Input/job_1714583200000_abc123/
├── manifest.json     ← workflow, prompt, params, file mapping
├── main.png          ← the user's primary upload
└── reference.jpg     ← only for instruct-image

Output/job_1714583200000_abc123/
├── status.json       ← progressively written; the bridge polls this
├── result.png        ← or result.mp4 once complete
└── error.log         ← if failed
```

A heartbeat file lives at `Output/_heartbeat.json` (updated every 60s by the watcher).

## Setup (one time)

```bash
cd agent
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

## Run — local mock (no ComfyUI needed)

This proves the entire frontend → bridge → folder → watcher → folder → bridge → frontend
loop works on a single machine, even without a real render box.

**Terminal 1 — bridge** (handles uploads from the browser):
```bash
python bridge.py
# listening on http://localhost:8000
```

**Terminal 2 — watcher in dry-run mode** (fakes the render):
```bash
# Windows PowerShell
$env:DRY_RUN="true"; python watcher.py

# Or bash
DRY_RUN=true python watcher.py
```

**Terminal 3 — frontend** (point at the bridge):
```bash
cd ..   # back to project root
echo VITE_BRIDGE_URL=http://localhost:8000 > .env.local
npm run dev
# open http://localhost:5173
```

Drop two images into Instruct Image, click **Render**. The bridge writes a job folder
to `Z:\...\Input\<job_id>\`, the watcher picks it up, simulates a 6-second render
(progress bar + status updates), copies the input to output, and the frontend's
output panel shows the "result" with a Download button.

## Run — real ComfyUI on Zak's box

Only step 2 changes — the watcher actually calls ComfyUI:

```bash
$env:COMFY_URL="http://localhost:8188"; python watcher.py
```

The bridge stays where it is (Yuchen's laptop or wherever the frontend reaches).
The watcher runs on Zak's machine. Both see the same Z: paths because Egnyte
syncs the folders.

## CLI smoke test (no bridge, no watcher)

```bash
python agent.py instruct-image \
  --prompt "swap the marble fireplace for travertine" \
  --image main=./samples/room.png \
  --image reference=./samples/evening.jpg \
  --param steps=4 --param cfg=1 \
  --dry-run --output hydrated.json
```

The dry-run just writes a hydrated JSON file you can drag onto Zak's ComfyUI
canvas to verify the agent's hydration logic produces a valid workflow.

## Endpoints (bridge)

```
POST /api/render
  multipart fields:
    workflow:    "image-to-video" | "instruct-image"
    prompt:      string
    params:      JSON-string of { [param_id]: value }
    preset_id:   optional string
    image_main:  file
    image_reference: file (Instruct Image only)
  →  { job_id, status_url, result_url }

GET /api/job/{id}/status   →  { status, progress, eta_seconds?, error_message? }
GET /api/job/{id}/result   →  binary result file
GET /api/health            →  { input_dir, output_dir, watcher_alive, watcher_age_seconds }
```

## Production path (later)

- `bridge.py` stays as the source of truth for the API contract; port to a Cloudflare
  Worker that uses Egnyte REST API to write to the same `/Shared/Rigby Cloud/24 - AI Lab/`
  paths (Egnyte syncs to Zak's Z:).
- `watcher.py` stays exactly the same on Zak's machine.
- Frontend `VITE_BRIDGE_URL` flips to `https://ai.rigbyandrigby.com/api`.

## Drive layout

R:\ is the studio's Rigby Cloud share — IT maps it on every workstation. On
a non-IT-setup machine (e.g. Yuchen's home desktop) you have Z:\Shared\Rigby Cloud
instead — run `agent\deploy\map-r-drive.ps1` once to alias R: → Z:\Shared\Rigby Cloud.
