@echo off
title Smart Hostel Portal - Booting...
color 0B
echo.
echo  =====================================================
echo   Smart Hostel Complaint Management System
echo  =====================================================
echo.

:: --- Port Protection Logic ---
echo [1/3] Clearing Port 5000 (just in case)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    if NOT "%%a"=="0" (
        echo  🧨 Removing zombie process %%a...
        taskkill /F /PID %%a >nul 2>&1
    )
)

cd /d "%~dp0backend"

echo [2/3] Verifying dependencies...
:: Only run npm install if node_modules is missing for faster boot
if not exist "node_modules\" (
    echo  📦 New setup detected. Installing...
    call npm install
) else (
    echo  ✅ Dependencies already present.
)

echo [3/3] Starting backend server...
echo.
echo  -----------------------------------------------------
echo   ✅ SUCCESS: Your portal is ready!
echo.
echo   🔗 OPEN IN BROWSER: http://localhost:5000/login
echo  -----------------------------------------------------
echo.
echo  (Keep this window open while using the app)
echo  Press Ctrl+C to stop.
echo.

node server.js
pause
