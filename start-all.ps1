Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "            Launching MediKiosk Servers            " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

Write-Host "1. Starting FastAPI Backend (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; .\services\api\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "2. Starting Patient Kiosk (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\patient-kiosk'; npm run dev"

Write-Host "3. Starting Doctor Dashboard (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\apps\doctor-dashboard'; npm run dev"

Write-Host ""
Write-Host "All servers launched in separate tabs/windows!" -ForegroundColor Yellow
Write-Host "  * Patient Kiosk:    http://localhost:3000" -ForegroundColor White
Write-Host "  * Doctor Dashboard: http://localhost:3001" -ForegroundColor White
Write-Host "  * Backend API:      http://localhost:8000" -ForegroundColor White
Write-Host "  * Swagger Docs:     http://localhost:8000/api/v1/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
