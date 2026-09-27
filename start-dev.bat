@echo off
echo ========================================
echo  Healthcare Coordinator - Dev Start
echo ========================================

echo.
echo [1/2] Starting FastAPI backend on port 8000...
start "Backend" cmd /k "cd /d %~dp0backend && C:\Users\Pranav\AppData\Local\Programs\Python\Python312\python.exe -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React frontend on port 5173...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting...
echo   Backend API:  http://localhost:8000/docs
echo   Frontend App: http://localhost:5173
echo.
pause
