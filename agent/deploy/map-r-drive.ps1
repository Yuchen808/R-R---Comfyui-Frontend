# Map R: -> Z:\Shared\Rigby Cloud  for machines that aren't IT-imaged.
#
# IT-setup machines already have R: pointing at the Rigby Cloud share. This
# script gives a non-IT box (e.g. Yuchen's home desktop) the same drive layout.
#
# Run once. No admin required.
#   .\map-r-drive.ps1
#
# Adds an entry to HKCU\Software\Microsoft\Windows\CurrentVersion\Run so the
# mapping survives reboot (re-runs subst at every login).

$ErrorActionPreference = 'Stop'

$Source     = 'Z:\Shared\Rigby Cloud'
$DriveLetter = 'R:'
$RunKey     = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$RunValue   = 'MapRDrive_RigbyCloud'

# 1. Verify source path exists
if (-not (Test-Path $Source)) {
    Write-Host "Source path not accessible: $Source" -ForegroundColor Red
    Write-Host "Make sure your Egnyte client is running and Z: is mounted." -ForegroundColor Yellow
    exit 1
}

# 2. Drop any existing R: mapping before re-creating
$existing = & subst 2>&1
if ($existing -match '^R:\\:') {
    Write-Host "Removing existing R: mapping" -ForegroundColor Gray
    & subst /D $DriveLetter 2>&1 | Out-Null
}

# 3. Map R: -> source (this session)
Write-Host "Mapping $DriveLetter -> $Source" -ForegroundColor Cyan
& subst $DriveLetter $Source
if ($LASTEXITCODE -ne 0) {
    Write-Host "subst failed. If R: is a real drive on this machine, pick another letter." -ForegroundColor Red
    exit 1
}

# 4. Verify
Start-Sleep -Milliseconds 500
if (Test-Path 'R:\') {
    Write-Host "Verified: R:\ is now mapped." -ForegroundColor Green
    $sample = Get-ChildItem 'R:\' -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty Name
    if ($sample) { Write-Host "  Top-level: $($sample -join ', ')" -ForegroundColor Gray }
} else {
    Write-Host "Mapping reported success but R:\ not visible. Try logging off/on." -ForegroundColor Yellow
}

# 5. Persist across reboots via HKCU Run key
$cmd = "cmd.exe /c subst $DriveLetter ""$Source"""
Set-ItemProperty -Path $RunKey -Name $RunValue -Value $cmd -Type String -Force
Write-Host "Persistence registered:" -ForegroundColor Green
Write-Host "  $RunKey\$RunValue = $cmd" -ForegroundColor Gray
Write-Host ""
Write-Host "R: will be re-mapped automatically at every login." -ForegroundColor Green
Write-Host ""
Write-Host "To undo:" -ForegroundColor Gray
Write-Host "  subst /D R:" -ForegroundColor Gray
Write-Host "  Remove-ItemProperty -Path '$RunKey' -Name '$RunValue'" -ForegroundColor Gray
