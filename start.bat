@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo   PyTrading One-Click Starter (Windows)
echo ================================================================
echo.

:: Get script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found, please install Python 3.9+
    pause
    exit /b 1
)

:: Check if virtual environment exists, if not create it
if not exist ".venv" (
    echo [INFO] Virtual environment not found, creating .venv with Python 3.11...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo [INFO] Activating virtual environment...
call .venv\Scripts\activate.bat

:: Verify Python version in venv
echo [INFO] Checking Python version in virtual environment...
python --version

:: Start Python script with all arguments
echo [INFO] Starting PyTrading...
echo.
python start.py %*

:: Pause if script fails
if errorlevel 1 (
    echo.
    echo [ERROR] Script exited with error
    pause >nul
)
