# Register start.ps1 to run at user login. Restarts on failure.
# Run once. No admin required.
$ErrorActionPreference = 'Stop'

$Root      = 'C:\AI-Lab'
$StartPs1  = "$Root\app\agent\deploy\start.ps1"
$TaskName  = 'RR-ComfyUI-Studio-AutoStart'

if (-not (Test-Path $StartPs1)) {
    Write-Host "start.ps1 not found at $StartPs1 - run bootstrap.ps1 first." -ForegroundColor Red
    exit 1
}

$action  = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$StartPs1`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Hours 0)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

# Replace existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description 'R&R ComfyUI Studio: bridge + watcher + cloudflared tunnel' | Out-Null

Write-Host "Registered Task Scheduler entry: $TaskName" -ForegroundColor Green
Write-Host "Will start automatically at next login." -ForegroundColor Green
Write-Host ""
Write-Host "To unregister later:" -ForegroundColor Gray
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
