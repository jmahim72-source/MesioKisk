@echo off
title MediKiosk Launcher
echo ===================================================
echo             Launching MediKiosk Servers
echo ===================================================
echo.

echo 1. Starting FastAPI Backend (Port 8000)...
start "MediKiosk Backend (Port 8000)" cmd /k "cd /d "%~dp0" && .\services\api\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000 --reload"

echo 2. Starting Patient Kiosk (Port 3000)...
start "MediKiosk Patient Kiosk (Port 3000)" cmd /k "cd /d "%~dp0apps\patient-kiosk" && npm run dev"

echo 3. Starting Doctor Dashboard (Port 3001)...
start "MediKiosk Doctor Dashboard (Port 3001)" cmd /k "cd /d "%~dp0apps\doctor-dashboard" && npm run dev"

echo.
echo ===================================================
echo  All 3 servers are running in separate terminals!
echo.
echo  * Patient Kiosk:    http://localhost:3000
echo  * Doctor Dashboard: http://localhost:3001
echo  * Backend API:      http://localhost:8000
echo  * Swagger Docs:     http://localhost:8000/api/v1/docs
echo ===================================================
echo.
echo Press any key to close this launcher window (servers stay open)...
pause >nul
