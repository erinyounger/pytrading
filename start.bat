@echo off
setlocal enabledelayedexpansion

:: =================================================================
:: PyTrading One-Click Starter (Windows)
:: Industry best practices: colored output, process management
:: =================================================================

:: Colors (Windows 10+)
color 0F

:: Paths
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%"
set "VENV_PATH=%PROJECT_ROOT%\.venv"
set "PYTHON=%VENV_PATH%\Scripts\python.exe"
set "PID_DIR=%PROJECT_ROOT%\.pids"
set "LOG_DIR=%PROJECT_ROOT%\logs"
set "BACKEND_LOG=%LOG_DIR%\backend.log"
set "FRONTEND_LOG=%LOG_DIR%\frontend.log"

:: Ports
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=3000"

:: Flags
set "MODE=all"

:: =================================================================
:: Logging functions
:: =================================================================
set "GREEN="
set "RED="
set "YELLOW="
set "BLUE="
set "CYAN="
set "BOLD="
set "NC="

:: Check if we have ANSI color support (Windows 10+)
for /f "tokens=*" %%a in ('ver') do (
    echo %%a | findstr /C:"Windows 10" >nul 2>&1 && set "HAS_ANSI=1"
    echo %%a | findstr /C:"Windows 11" >nul 2>&1 && set "HAS_ANSI=1"
    echo %%a | findstr /C:"Server" >nul 2>&1 && set "HAS_ANSI=1"
)

if defined HAS_ANSI (
    set "GREEN=[92m"
    set "RED=[91m"
    set "YELLOW=[93m"
    set "BLUE=[94m"
    set "CYAN=[96m"
    set "BOLD=[1m"
    set "NC=[0m"
)

:header
echo.
echo %CYAN%%BOLD%============================================================%NC%
echo %CYAN%%BOLD%  %~1%NC%
echo %CYAN%%BOLD%============================================================%NC%
echo.
goto :eof

:section
echo.
echo %BLUE%%BOLD%^> %~1%NC%
echo.
goto :eof

:info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:warn
echo %YELLOW%[WARN]%NC% %~1
goto :eof

:error
echo %RED%[ERROR]%NC% %~1 >&2
goto :eof

:: =================================================================
:: Cleanup
:: =================================================================
:cleanup_pids
if not exist "%PID_DIR%" mkdir "%PID_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
goto :eof

:: =================================================================
:: System checks
:: =================================================================
:check_python
call :section Checking Python
python --version >nul 2>&1
if errorlevel 1 (
    call :error Python 3 not found. Please install Python 3.9+
    pause
    exit /b 1
)
python --version
call :success Python found
goto :eof

:check_uv
call :section Checking uv
where uv >nul 2>&1
if errorlevel 1 (
    call :warn uv not found. Please install: https://astral.sh/uv/
    call :info Or run: curl -LsSf https://astral.sh/uv/install.sh
) else (
    uv --version
    call :success uv found
)
goto :eof

:check_node
call :section Checking Node.js
where node >nul 2>&1
if errorlevel 1 (
    call :warn Node.js not found. Frontend will not be available.
) else (
    node --version
    call :success Node.js found
    where npm >nul 2>&1
    if not errorlevel 1 (
        npm --version
        call :success npm found
    )
)
goto :eof

:check_env
call :section Checking Environment
if exist "%PROJECT_ROOT%\.env" (
    call :success .env file found
) else (
    if exist "%PROJECT_ROOT%\.env.example" (
        call :warn .env not found, copying from .env.example...
        copy "%PROJECT_ROOT%\.env.example" "%PROJECT_ROOT%\.env"
        call :success Created .env from .env.example
        call :warn Please edit .env and configure your trading tokens
    ) else (
        call :warn .env not found
    )
)
goto :eof

:: =================================================================
:: Virtual environment
:: =================================================================
:setup_venv
call :section Setting up Virtual Environment

if exist "%VENV_PATH%" (
    call :success Virtual environment exists: %VENV_PATH%
) else (
    call :info Creating virtual environment with Python 3.11...
    uv venv --python 3.11 "%VENV_PATH%"
    if errorlevel 1 (
        call :error Failed to create virtual environment
        pause
        exit /b 1
    )
    call :success Virtual environment created
)

if not exist "%PYTHON%" (
    call :error Python not found in venv: %PYTHON%
    pause
    exit /b 1
)

call :info Syncing Python dependencies...
cd /d "%PROJECT_ROOT%"
uv sync
if errorlevel 1 (
    call :warn Failed to sync dependencies, continuing anyway...
)
call :success Dependencies synced
goto :eof

:: =================================================================
:: Service management
:: =================================================================
:is_port_in_use
set "port=%~1"
netstat -ano 2>nul | findstr :%port% | findstr LISTENING >nul 2>&1
goto :eof

:wait_for_port
set "port=%~1"
set "name=%~2"
set "max_attempts=30"
set "attempt=0"

call :info Waiting for %name% to be ready on port %port%...
:wait_loop
timeout /t 1 /nobreak >nul
set /a attempt+=1

call :is_port_in_use %port%
if not errorlevel 1 (
    echo.
    call :success %name% is ready on port %port%
    goto :eof
)

if %attempt% LSS %max_attempts% (
    set "spinner=-"
    if !attempt! LEQ 5 set "spinner=\"
    if !attempt! LEQ 10 set "spinner=|"
    if !attempt! LEQ 15 set "spinner=/"
    echo !spinner! [attempt !attempt!/!max_attempts!]
    goto :wait_loop
)

echo.
call :error %name% did not start within %max_attempts%s
goto :eof

:start_backend
call :section Starting Backend Service

:: Kill existing process on port
call :is_port_in_use %BACKEND_PORT%
if not errorlevel 1 (
    call :warn Port %BACKEND_PORT% is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
        taskkill /PID %%a /T /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

:: Setup environment
if not exist "%PROJECT_ROOT%\gm_data" mkdir "%PROJECT_ROOT%\gm_data"

:: Start backend
call :info Starting FastAPI backend on http://0.0.0.0:%BACKEND_PORT%...

cd /d "%PROJECT_ROOT%"
set "PYTHONPATH=%PROJECT_ROOT%\src"
set "GM_DATA_PATH=%PROJECT_ROOT%\gm_data"

start /B cmd /c "%PYTHON% -m uvicorn pytrading.api.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload > %BACKEND_LOG% 2>&1"

call :success Backend started
call :info Logs: %BACKEND_LOG%

:: Wait for backend to be ready
call :wait_for_port %BACKEND_PORT% "Backend API"

:: Health check
timeout /t 2 /nobreak >nul
curl -sf "http://localhost:%BACKEND_PORT%/health" >nul 2>&1
if not errorlevel 1 (
    call :success Backend health check passed
) else (
    call :warn Backend health check failed, but service is running
)
goto :eof

:start_frontend
call :section Starting Frontend Service

if not exist "%PROJECT_ROOT%\frontend" (
    call :error Frontend directory not found: %PROJECT_ROOT%\frontend
    goto :eof
)

:: Check node_modules
if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    call :section Installing Frontend Dependencies
    call :info Running npm install...
    cd /d "%PROJECT_ROOT%\frontend"
    call npm install
    if errorlevel 1 (
        call :error Frontend dependencies installation failed
        goto :eof
    )
    call :success Dependencies installed
)

:: Kill existing process on port
call :is_port_in_use %FRONTEND_PORT%
if not errorlevel 1 (
    call :warn Port %FRONTEND_PORT% is in use, attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
        taskkill /PID %%a /T /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

:: Start frontend
call :info Starting React frontend on http://0.0.0.0:%FRONTEND_PORT%...

cd /d "%PROJECT_ROOT%\frontend"
start /B cmd /c "npm start > %FRONTEND_LOG% 2>&1"

call :success Frontend started
call :info Logs: %FRONTEND_LOG%

:: Wait for frontend to be ready
call :wait_for_port %FRONTEND_PORT% "Frontend"
goto :eof

:stop_services
call :header Stopping Services

:: Kill backend
for /f "tokens=*" %%a in ('type "%PID_DIR%\backend.pid" 2^>nul') do (
    call :info Stopping backend process %%a...
    taskkill /PID %%a /T /F >nul 2>&1
)
del /f /q "%PID_DIR%\backend.pid" 2>nul

:: Kill frontend
for /f "tokens=*" %%a in ('type "%PID_DIR%\frontend.pid" 2^>nul') do (
    call :info Stopping frontend process %%a...
    taskkill /PID %%a /T /F >nul 2>&1
)
del /f /q "%PID_DIR%\frontend.pid" 2>nul

:: Kill by port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%BACKEND_PORT% ^| findstr LISTENING') do (
    taskkill /PID %%a /T /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%FRONTEND_PORT% ^| findstr LISTENING') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

call :success All services stopped
goto :eof

:status_services
call :header Service Status

call :is_port_in_use %BACKEND_PORT%
if not errorlevel 1 (
    echo %GREEN%[OK] Backend (port %BACKEND_PORT%): RUNNING%NC%
) else (
    echo %RED%[X] Backend (port %BACKEND_PORT%): STOPPED%NC%
)

call :is_port_in_use %FRONTEND_PORT%
if not errorlevel 1 (
    echo %GREEN%[OK] Frontend (port %FRONTEND_PORT%): RUNNING%NC%
) else (
    echo %RED%[X] Frontend (port %FRONTEND_PORT%): STOPPED%NC%
)
goto :eof

:show_help
echo.
echo %BOLD%PyTrading One-Click Starter%NC%
echo.
echo %BOLD%USAGE:%NC%
echo     start.bat [OPTIONS]
echo.
echo %BOLD%OPTIONS:%NC%
echo     -b, --backend      Start only backend service
echo     -f, --frontend     Start only frontend service
echo     -s, --stop         Stop all services
echo     --status           Show service status
echo     -h, --help         Show this help message
echo.
echo %BOLD%PORTS:%NC%
echo     Backend:  %BACKEND_PORT% (FastAPI)
echo     Frontend: %FRONTEND_PORT% (React)
echo.
echo %BOLD%LOGS:%NC%
echo     Backend:  %BACKEND_LOG%
echo     Frontend: %FRONTEND_LOG%
echo.
goto :eof

:: =================================================================
:: Main
:: =================================================================
:main
call :cleanup_pids

:: Parse arguments
set "ARG=%~1"
if "%ARG%"=="" goto :run_default
if "%ARG%"=="-h" goto :show_help
if "%ARG%"=="--help" goto :show_help
if "%ARG%"=="-b" goto :run_backend
if "%ARG%"=="--backend" goto :run_backend
if "%ARG%"=="-f" goto :run_frontend
if "%ARG%"=="--frontend" goto :run_frontend
if "%ARG%"=="-s" goto :do_stop
if "%ARG%"=="--stop" goto :do_stop
if "%ARG%"=="--status" goto :do_status

:run_default
call :header PyTrading One-Click Starter
call :check_python
call :check_uv
call :check_env
call :setup_venv
call :check_node
call :start_backend
call :start_frontend
goto :show_status

:run_backend
call :header PyTrading One-Click Starter
call :check_python
call :check_uv
call :check_env
call :setup_venv
call :start_backend
goto :final

:run_frontend
call :header PyTrading One-Click Starter
call :check_node
call :start_frontend
goto :final

:do_stop
call :stop_services
exit /b 0

:do_status
call :status_services
exit /b 0

:show_status
echo.
call :status_services
echo.
call :success Services started successfully!
echo.
echo %BOLD%Access URLs:%NC%
echo   - Web UI:   %CYAN%http://localhost:%FRONTEND_PORT%%NC%
echo   - API Docs: %CYAN%http://localhost:%BACKEND_PORT%/docs%NC%
echo.
echo %YELLOW%Press Ctrl+C to stop all services%NC%
echo.

:final
endlocal
goto :eof

:: Start
call :main %*
