Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "      GUARDIAN XCEL // AUTONOMOUS RESCUE SYSTEM (POWERSHELL LAUNCHER)    " -ForegroundColor White
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Clean previous python processes
Write-Host "[1/4] Checking and clearing port 8000..." -ForegroundColor Gray
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Start FastAPI Backend
Write-Host "[2/4] Starting FastAPI Central Backend (Port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootPath\backend`" && python run_backend.py" -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Start Vite Frontend
Write-Host "[3/4] Starting React Tactical Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$rootPath\frontend`" && npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# 4. Open Default Web Browser
Write-Host "[4/4] Launching Browser to http://localhost:5173/deck ..." -ForegroundColor Green
Start-Process "http://localhost:5173/deck"

Write-Host ""
Write-Host "All systems operational! Opening browser..." -ForegroundColor Cyan
