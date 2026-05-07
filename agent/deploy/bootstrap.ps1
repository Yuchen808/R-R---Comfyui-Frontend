# R&R ComfyUI Studio — Zak's render-box bootstrap
#
# Run from PowerShell (no admin needed). Idempotent: safe to re-run.
#
#   iex (irm https://raw.githubusercontent.com/Yuchen808/R-R---Comfyui-Frontend/main/agent/deploy/bootstrap.ps1)
#
# What this does:
#   1. Sets up C:\AI-Lab\ folder structure
#   2. Clones (or updates) the repo
#   3. Creates a Python venv + installs deps
#   4. Downloads cloudflared if missing
#   5. Starts bridge.py + watcher.py + cloudflared tunnel as hidden background processes
#   6. Waits for the tunnel URL and prints it loudly + writes it to C:\AI-Lab\tunnel-url.txt

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
$Root          = 'C:\AI-Lab'
$AppDir        = "$Root\app"
$BinDir        = "$Root\bin"
$LogsDir       = "$Root\logs"
$VenvDir       = "$AppDir\agent\venv"
$VenvPython    = "$VenvDir\Scripts\python.exe"
$Cloudflared   = "$BinDir\cloudflared.exe"
$RepoUrl       = 'https://github.com/Yuchen808/R-R---Comfyui-Frontend.git'
$ZipFallback   = 'https://github.com/Yuchen808/R-R---Comfyui-Frontend/archive/refs/heads/main.zip'
$CloudflaredUrl= 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
$ComfyUrl      = if ($env:COMFY_URL) { $env:COMFY_URL } else { 'http://localhost:8188' }

function Step($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Info($msg)  { Write-Host "    $msg" -ForegroundColor Gray }
function Ok($msg)    { Write-Host "    [ok] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "    [warn] $msg" -ForegroundColor Yellow }
function Fail($msg)  { Write-Host "    [fail] $msg" -ForegroundColor Red; throw $msg }

Write-Host ""
Write-Host "###########################################" -ForegroundColor Green
Write-Host "#  R&R ComfyUI Studio — render-box setup  #" -ForegroundColor Green
Write-Host "###########################################" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------------------
# 1. Folder structure
# ---------------------------------------------------------------------------
Step "Preparing $Root"
foreach ($d in @($Root, $BinDir, $LogsDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}
Ok "folder structure ready"

# ---------------------------------------------------------------------------
# 2. Python check
# ---------------------------------------------------------------------------
Step "Checking Python"
$pythonCmd = $null
foreach ($c in @('python', 'python3', 'py')) {
    $p = Get-Command $c -ErrorAction SilentlyContinue
    if ($p) {
        $ver = & $c --version 2>&1
        if ($LASTEXITCODE -eq 0 -and $ver -match 'Python 3\.') {
            $pythonCmd = $c
            Ok "found $c -> $ver"
            break
        }
    }
}
if (-not $pythonCmd) {
    Fail "Python 3 not found in PATH. Install from https://www.python.org/ first."
}

# ---------------------------------------------------------------------------
# 3. Clone or update repo
# ---------------------------------------------------------------------------
Step "Fetching repo"
$gitAvailable = (Get-Command git -ErrorAction SilentlyContinue) -ne $null

if (Test-Path "$AppDir\.git") {
    if ($gitAvailable) {
        Info "git pull"
        Push-Location $AppDir
        try {
            & git fetch origin main 2>$null
            if ($LASTEXITCODE -ne 0) { Fail "git fetch failed (exit $LASTEXITCODE)" }
            & git reset --hard origin/main 2>$null
            if ($LASTEXITCODE -ne 0) { Fail "git reset failed (exit $LASTEXITCODE)" }
            Ok "updated to origin/main"
        } finally { Pop-Location }
    } else {
        Warn "repo present but git not installed — skipping update"
    }
} else {
    if ($gitAvailable) {
        Info "git clone $RepoUrl"
        if (Test-Path $AppDir) { Remove-Item $AppDir -Recurse -Force }
        & git clone $RepoUrl $AppDir 2>$null
        if ($LASTEXITCODE -ne 0) { Fail "git clone failed (exit $LASTEXITCODE)" }
        Ok "cloned"
    } else {
        Info "git not found — downloading ZIP fallback"
        $tmpZip = "$env:TEMP\rr-comfy-$(Get-Random).zip"
        Invoke-WebRequest -Uri $ZipFallback -OutFile $tmpZip -UseBasicParsing
        if (Test-Path $AppDir) { Remove-Item $AppDir -Recurse -Force }
        Expand-Archive -Path $tmpZip -DestinationPath "$Root\_zip-extract" -Force
        $extracted = Get-ChildItem -Path "$Root\_zip-extract" -Directory | Select-Object -First 1
        Move-Item -Path $extracted.FullName -Destination $AppDir
        Remove-Item -Path "$Root\_zip-extract" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $tmpZip -Force
        Ok "extracted ZIP to $AppDir"
    }
}

# ---------------------------------------------------------------------------
# 4. Python venv + deps
# ---------------------------------------------------------------------------
Step "Setting up Python venv"
if (-not (Test-Path $VenvPython)) {
    & $pythonCmd -m venv $VenvDir
    Ok "venv created at $VenvDir"
} else {
    Ok "venv already exists"
}
Info "pip install -r requirements.txt"
& $VenvPython -m pip install --quiet --upgrade pip 2>&1 | Out-Null
& $VenvPython -m pip install --quiet -r "$AppDir\agent\requirements.txt"
if ($LASTEXITCODE -ne 0) { Fail "pip install failed" }
Ok "deps installed"

# ---------------------------------------------------------------------------
# 5. Cloudflared
# ---------------------------------------------------------------------------
Step "Cloudflared"
if (Test-Path $Cloudflared) {
    Ok "already present at $Cloudflared"
} else {
    Info "downloading from $CloudflaredUrl"
    Invoke-WebRequest -Uri $CloudflaredUrl -OutFile $Cloudflared -UseBasicParsing
    Ok "downloaded to $Cloudflared"
}

# ---------------------------------------------------------------------------
# 6. R: drive sanity check (Rigby Cloud share)
# ---------------------------------------------------------------------------
Step "R: drive (Rigby Cloud) check"
$inputDir  = 'R:\24 - AI Lab\Input'
$outputDir = 'R:\24 - AI Lab\Output'
if (-not (Test-Path 'R:\')) {
    Warn "R:\ not mapped on this machine."
    Warn "If this is a non-IT-setup box, run: $AppDir\agent\deploy\map-r-drive.ps1"
}
if (-not (Test-Path $inputDir))  { Warn "INPUT  not accessible: $inputDir" } else { Ok "INPUT  ok: $inputDir" }
if (-not (Test-Path $outputDir)) { Warn "OUTPUT not accessible: $outputDir" } else { Ok "OUTPUT ok: $outputDir" }

# ---------------------------------------------------------------------------
# 7. Stop existing services (idempotency)
# ---------------------------------------------------------------------------
Step "Stopping any previous services"
& "$AppDir\agent\deploy\stop.ps1" 2>$null

# ---------------------------------------------------------------------------
# 8. Start services
# ---------------------------------------------------------------------------
Step "Starting bridge + watcher + tunnel"

$env:COMFY_URL = $ComfyUrl

# bridge.py — port 8000
Start-Process -FilePath $VenvPython `
    -ArgumentList "$AppDir\agent\bridge.py" `
    -WorkingDirectory "$AppDir\agent" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\bridge.log" `
    -RedirectStandardError "$LogsDir\bridge.err"
Ok "bridge.py started (logs: $LogsDir\bridge.log)"

# watcher.py — Z:\ folder watch
Start-Process -FilePath $VenvPython `
    -ArgumentList "$AppDir\agent\watcher.py" `
    -WorkingDirectory "$AppDir\agent" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\watcher.log" `
    -RedirectStandardError "$LogsDir\watcher.err"
Ok "watcher.py started (logs: $LogsDir\watcher.log)  COMFY_URL=$ComfyUrl"

# cloudflared tunnel — exposes :8000 to a public https URL
Start-Process -FilePath $Cloudflared `
    -ArgumentList @('tunnel', '--url', 'http://localhost:8000', '--no-autoupdate') `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\tunnel.log" `
    -RedirectStandardError "$LogsDir\tunnel.err"
Ok "cloudflared tunnel started (logs: $LogsDir\tunnel.log)"

# ---------------------------------------------------------------------------
# 9. Wait for tunnel URL
# ---------------------------------------------------------------------------
Step "Waiting for tunnel URL (up to 60s)"
$tunnelUrl = $null
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    $errLog = ''
    $outLog = ''
    if (Test-Path "$LogsDir\tunnel.err") { $errLog = Get-Content "$LogsDir\tunnel.err" -Raw -ErrorAction SilentlyContinue }
    if (Test-Path "$LogsDir\tunnel.log") { $outLog = Get-Content "$LogsDir\tunnel.log" -Raw -ErrorAction SilentlyContinue }
    $combined = "$errLog`n$outLog"
    if ($combined -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $tunnelUrl = $matches[0]
        break
    }
    if ($i % 5 -eq 0) { Info "still waiting... ${i}s" }
}

# ---------------------------------------------------------------------------
# 10. Verify bridge health
# ---------------------------------------------------------------------------
Step "Verifying bridge"
Start-Sleep -Seconds 2
$health = $null
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 5
    Ok "bridge healthy: watcher_alive=$($health.watcher_alive), input_exists=$($health.input_exists)"
} catch {
    Warn "bridge health check failed: $_"
}

# ---------------------------------------------------------------------------
# 11. Banner
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "##############################################################" -ForegroundColor Green
if ($tunnelUrl) {
    $tunnelUrl | Out-File -FilePath "$Root\tunnel-url.txt" -Encoding UTF8
    Write-Host "#" -ForegroundColor Green
    Write-Host "#  PUBLIC URL: $tunnelUrl" -ForegroundColor Green
    Write-Host "#" -ForegroundColor Green
    Write-Host "#  Send this to Yuchen. He'll paste it into the frontend's" -ForegroundColor Green
    Write-Host "#  VITE_BRIDGE_URL setting." -ForegroundColor Green
    Write-Host "#" -ForegroundColor Green
    Write-Host "#  URL also saved to: $Root\tunnel-url.txt" -ForegroundColor Green
} else {
    Write-Host "#" -ForegroundColor Yellow
    Write-Host "#  Tunnel URL did not appear in 60s." -ForegroundColor Yellow
    Write-Host "#  Check $LogsDir\tunnel.err — may be a network restriction." -ForegroundColor Yellow
    Write-Host "#" -ForegroundColor Yellow
}
Write-Host "##############################################################" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Gray
Write-Host "  .\app\agent\deploy\stop.ps1       — stop everything"
Write-Host "  .\app\agent\deploy\show-url.ps1   — re-print the tunnel URL"
Write-Host "  Get-Content $LogsDir\bridge.log   — tail the bridge log"
Write-Host "  Get-Content $LogsDir\watcher.log  — tail the watcher log"
Write-Host ""
