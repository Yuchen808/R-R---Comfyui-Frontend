# Render-box deployment — Zak's setup

Three Python services + a tunnel run on Zak's workstation. Other employees access them via a public Cloudflare URL.

```
[employee browser]  →  https://xxx.trycloudflare.com  →  Zak's machine: bridge :8000 → watcher → ComfyUI :8188
                                  ▲
                                  └── cloudflared tunnel
```

## One-time setup

Open **PowerShell** (no admin needed). Paste this single line:

```powershell
iex (irm https://raw.githubusercontent.com/Yuchen808/R-R---Comfyui-Frontend/main/agent/deploy/bootstrap.ps1)
```

This will:

1. Make `C:\AI-Lab\` folder structure
2. Clone the repo to `C:\AI-Lab\app`
3. Create a Python venv + `pip install` deps
4. Download `cloudflared.exe`
5. Verify `R:\24 - AI Lab\Input` is reachable
6. Start `bridge.py`, `watcher.py`, and `cloudflared tunnel` as hidden background processes
7. Print a `https://xxx.trycloudflare.com` URL — **send this URL to Yuchen**

Takes ~1-2 minutes. Idempotent — safe to re-run.

## Daily use

```powershell
# Start everything
C:\AI-Lab\app\agent\deploy\start.ps1

# Stop everything
C:\AI-Lab\app\agent\deploy\stop.ps1

# See the current public URL again
C:\AI-Lab\app\agent\deploy\show-url.ps1
```

## Auto-start at login (optional, recommended)

```powershell
C:\AI-Lab\app\agent\deploy\register-autostart.ps1
```

Registers a Task Scheduler entry. Next time you log in, all three services start automatically.

## Logs

```
C:\AI-Lab\logs\bridge.log     ← FastAPI HTTP server (port 8000)
C:\AI-Lab\logs\watcher.log    ← Folder watchdog + ComfyUI calls
C:\AI-Lab\logs\tunnel.log     ← cloudflared output (URL is in here)
```

To watch a log live:

```powershell
Get-Content C:\AI-Lab\logs\bridge.log -Wait -Tail 20
```

## Verify it's working

```powershell
# Should respond {"input_dir":...,"watcher_alive":true,...}
Invoke-RestMethod http://localhost:8000/api/health
```

## What this expects

- Python 3.10+ in PATH (you should have this — ComfyUI installs Python)
- ComfyUI running on `http://localhost:8188` (the watcher's `COMFY_URL`)
- `R:` drive mapped to the Rigby Cloud share (IT-setup machines have this by default; on a non-IT box, run `agent\deploy\map-r-drive.ps1` once)
- Outbound HTTPS to `*.trycloudflare.com` allowed by your firewall (it should be)

## Troubleshooting

**Tunnel URL didn't print**: The script waits 60 seconds. If your network blocks Cloudflare, tunnel won't establish. Check `C:\AI-Lab\logs\tunnel.err`.

**Bridge port 8000 already in use**: Another process holds the port. `Get-NetTCPConnection -LocalPort 8000` to find it. Kill or change `BRIDGE_PORT` env var.

**Watcher says "input folder does not exist"**: R: drive not mapped. On an IT-setup machine R: is automatic; on a personal box run `C:\AI-Lab\app\agent\deploy\map-r-drive.ps1` once.

**Renders fail with "Connection refused on 8188"**: ComfyUI isn't running. Start ComfyUI first, then re-run `start.ps1`.

**Need to upgrade**: Re-run the bootstrap one-liner. It pulls the latest repo + reinstalls deps.

## Stable URL (later)

The free `*.trycloudflare.com` URL changes every restart. Once IT approves, switch to a named tunnel + custom subdomain (`api.ai.rigbyandrigby.com`) — see notes from Yuchen.
