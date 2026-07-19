@echo off
echo ============================================================
echo  Smart Hostel Complaint Management System — Setup
echo ============================================================
echo.

:: Navigate to backend
cd /d "%~dp0backend"

echo [1/4] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo [2/4] Dependencies installed successfully!
echo.
echo [3/4] Please run the MySQL schema manually:
echo   - Open MySQL Workbench or MySQL CLI
echo   - Run: backend\db\schema.sql
echo   - Then run: backend\db\seed.sql
echo   - (or use the auto-setup option below)
echo.
echo [4/4] Checking .env file...
if not exist ".env" (
    echo ERROR: .env file not found! Create backend\.env with your MySQL credentials.
    pause
    exit /b 1
)
echo .env found!
echo.
echo ============================================================
echo  Ready! Start the server with:
echo    cd backend
echo    npm run dev
echo.
echo  Then open: http://localhost:5000/login
echo.
echo  Demo accounts (all password: admin123):
echo    Admin:   admin@hostel.com
echo    Staff:   ravi@hostel.com
echo    Student: arjun@hostel.com
echo ============================================================
pause
