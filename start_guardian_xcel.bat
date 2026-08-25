@echo off
title GUARDIAN XCEL // AUTONOMOUS RESCUE SYSTEM
color 0b

echo =========================================================================
echo       GUARDIAN XCEL // AUTONOMOUS TOURIST RESCUE COORDINATION SYSTEM
echo =========================================================================
echo.

:: 1. Clean up any previous dangling processes on port 8000
echo [1/4] Checking ports and cleaning previous background sessions...
powershell -NoProfile -Command "Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

:: 2. Launch Central Python FastAPI Backend
echo [2/4] Starting Central FastAPI Backend & Simulation Engine (Port 8000)...
start "Guardian Xcel Backend" cmd /c "cd /d "%~dp0backend" && python run_backend.py"

:: Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

:: 3. Launch React + Vite Tactical Frontend (HTTPS enabled)
echo [3/4] Starting React Tactical Frontend (HTTPS Port 5173)...
start "Guardian Xcel Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"

:: Wait 3 seconds for Vite dev server to start
timeout /t 3 /nobreak >nul

:: 4. Automatically open browser to the Master Presentation Deck
echo [4/4] Opening Guardian Xcel Master Deck in your browser...
start https://localhost:5173/deck

echo.
echo =========================================================================
echo               GUARDIAN XCEL IS NOW LIVE & OPERATIONAL!
echo =========================================================================
echo.
echo Connected Interfaces (HTTPS Enabled):
echo   - [1] Master Presentation Deck : https://localhost:5173/deck
echo   - [2] Guardian Xcel Mobile PWA  : https://localhost:5173/mobile
echo   - [3] Tactical Command Center   : https://localhost:5173/tactical
echo   - [4] UAV Operations & FLIR     : https://localhost:5173/uav
echo   - [5] Mobile Hotspot URL        : https://10.184.45.64:5173/mobile
echo   - [6] Backend REST & Swagger    : http://127.0.0.1:8000/docs
echo.
echo Keep the backend and frontend terminal windows open while testing.
echo Press any key to exit this launcher window.
echo =========================================================================
pause >nul
