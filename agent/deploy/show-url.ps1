# Re-print the tunnel URL from the saved file or by re-scanning the log.
$saved = 'C:\AI-Lab\tunnel-url.txt'
$logErr = 'C:\AI-Lab\logs\tunnel.err'
$logOut = 'C:\AI-Lab\logs\tunnel.log'

$url = $null
if (Test-Path $saved) {
    $url = (Get-Content $saved -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
}

if (-not $url) {
    $combined = ''
    if (Test-Path $logErr) { $combined += Get-Content $logErr -Raw -ErrorAction SilentlyContinue }
    if (Test-Path $logOut) { $combined += Get-Content $logOut -Raw -ErrorAction SilentlyContinue }
    if ($combined -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
        $url = $matches[0]
    }
}

if ($url) {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host " PUBLIC URL: $url" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "No tunnel URL found. Is cloudflared running? Run start.ps1." -ForegroundColor Yellow
}
