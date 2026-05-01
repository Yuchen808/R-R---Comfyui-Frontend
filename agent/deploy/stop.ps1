# Kill any running bridge.py / watcher.py / cloudflared processes started from C:\AI-Lab.
$ErrorActionPreference = 'SilentlyContinue'

$killed = 0

# Stop the cloudflared exe directly (matched by image name)
Get-Process -Name 'cloudflared' -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    $killed++
}

# Find python processes whose CommandLine references our scripts
$pythonProcs = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue
foreach ($p in $pythonProcs) {
    $cmd = $p.CommandLine
    if ($cmd -and ($cmd -match 'bridge\.py' -or $cmd -match 'watcher\.py')) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        $killed++
    }
}

if ($killed -gt 0) {
    Write-Host "Stopped $killed process(es)." -ForegroundColor Yellow
} else {
    Write-Host "Nothing to stop."
}
