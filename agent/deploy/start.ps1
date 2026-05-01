# Manual start — assumes bootstrap.ps1 has already been run.
# Idempotent: kills any stale processes first.
#
#   .\start.ps1
#
$ErrorActionPreference = 'Stop'

$Root        = 'C:\AI-Lab'
$AppDir      = "$Root\app"
$LogsDir     = "$Root\logs"
$VenvPython  = "$AppDir\agent\venv\Scripts\python.exe"
$Cloudflared = "$Root\bin\cloudflared.exe"
$ComfyUrl    = if ($env:COMFY_URL) { $env:COMFY_URL } else { 'http://localhost:8188' }

if (-not (Test-Path $VenvPython))  { Write-Host "Run bootstrap.ps1 first." -ForegroundColor Red; exit 1 }
if (-not (Test-Path $Cloudflared)) { Write-Host "cloudflared missing — run bootstrap.ps1." -ForegroundColor Red; exit 1 }

New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null

# Stop anything stale
& "$AppDir\agent\deploy\stop.ps1" 2>$null

Write-Host "Starting services..." -ForegroundColor Cyan
$env:COMFY_URL = $ComfyUrl

Start-Process -FilePath $VenvPython `
    -ArgumentList "$AppDir\agent\bridge.py" `
    -WorkingDirectory "$AppDir\agent" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\bridge.log" `
    -RedirectStandardError "$LogsDir\bridge.err"

Start-Process -FilePath $VenvPython `
    -ArgumentList "$AppDir\agent\watcher.py" `
    -WorkingDirectory "$AppDir\agent" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\watcher.log" `
    -RedirectStandardError "$LogsDir\watcher.err"

Start-Process -FilePath $Cloudflared `
    -ArgumentList @('tunnel', '--url', 'http://localhost:8000', '--no-autoupdate') `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$LogsDir\tunnel.log" `
    -RedirectStandardError "$LogsDir\tunnel.err"

# Capture tunnel URL
Write-Host "Waiting for tunnel URL..." -ForegroundColor Cyan
$tunnelUrl = $null
for ($i = 1; $i -le 60; $i++) {
    Start-Sleep -Seconds 1
    $errLog = if (Test-Path "$LogsDir\tunnel.err") { Get-Content "$LogsDir\tunnel.err" -Raw -ErrorAction SilentlyContinue } else { '' }
    $outLog = if (Test-Path "$LogsDir\tunnel.log") { Get-Content "$LogsDir\tunnel.log" -Raw -ErrorAction SilentlyContinue } else { '' }
    if (("$errLog`n$outLog") -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $tunnelUrl = $matches[0]
        break
    }
}

if ($tunnelUrl) {
    $tunnelUrl | Out-File -FilePath "$Root\tunnel-url.txt" -Encoding UTF8
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host " PUBLIC URL: $tunnelUrl" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "Saved to $Root\tunnel-url.txt"
} else {
    Write-Host "Tunnel URL not detected in 60s. Check $LogsDir\tunnel.err" -ForegroundColor Yellow
}
