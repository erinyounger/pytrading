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

:: Start Python script
echo [INFO] Starting PyTrading...
echo.
python start.py %*

:: Pause if script fails
if errorlevel 1 (
    echo.
    echo [ERROR] Script exited with error
    pause >nul
)
