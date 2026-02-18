#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
PyTrading One-Click Starter
Supports Windows and Linux, auto-start backend and frontend services
Enhanced with virtual environment management and frontend build process
"""
import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from platform import system


# ==================== 日志输出函数 ====================
def _log(msg: str, prefix: str = "[INFO]"):
    print(f"{prefix} {msg}")


def print_header(title: str):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_info(msg: str):
    _log(msg, "[INFO]")


def print_ok(msg: str):
    _log(msg, "[OK]")


def print_error(msg: str):
    _log(msg, "[ERROR]")


def print_warning(msg: str):
    _log(msg, "[WARNING]")


# ==================== 辅助函数 ====================
def get_venv_python(venv_path: Path) -> Path:
    """获取虚拟环境 Python 可执行文件路径"""
    suffix = "Scripts" if system() == "Windows" else "bin"
    return venv_path / suffix / ("python.exe" if system() == "Windows" else "python")


def run_command(cmd: list, cwd: Path | None = None, check: bool = True, capture: bool = True):
    """封装 subprocess.run 调用"""
    result = subprocess.run(
        cmd,
        cwd=cwd,
        check=check,
        capture_output=True,
        text=True
    ) if capture else subprocess.run(cmd, cwd=cwd, check=check)
    return result


def kill_process_on_port(port: int) -> bool:
    """Kill process using the specified port"""
    try:
        if system() == "Windows":
            result = run_command(f'netstat -ano | findstr :{port}', capture=True, check=False)
            # Check if any process is using the port
            lines = [line for line in result.stdout.splitlines() if f":{port}" in line and "LISTENING" in line]
            if not lines:
                # No process on this port, consider it success
                return True
            for line in lines:
                pid = line.strip().split()[-1]
                print_info(f"Killing process {pid} on port {port}...")
                subprocess.run(f"taskkill /PID {pid} /F", shell=True)
                return True
        else:
            result = run_command(f"lsof -ti:{port}", capture=True, check=False)
            pids = result.stdout.strip().split("\n")
            if not pids or not pids[0]:
                # No process on this port, consider it success
                return True
            for pid in pids:
                if pid:
                    print_info(f"Killing process {pid} on port {port}...")
                    subprocess.run(f"kill -9 {pid}", shell=True)
                    return True
    except Exception as e:
        print_warning(f"Failed to kill process on port {port}: {e}")
    return False


# ==================== 环境检查函数 ====================
def check_python_version() -> bool:
    """Check if Python 3.9+ is available"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        print(f"Python: {version.major}.{version.minor}.{version.micro}")
        return True
    print_error(f"Python {version.major}.{version.minor} is not supported, need Python 3.9+")
    return False


def get_uv_path() -> str | None:
    """Get path to uv executable"""
    if uv_path := shutil.which("uv"):
        return uv_path

    base_paths = {
        "Windows": ["C:/Python/Python311/Scripts/uv.exe", "C:/Python/Python39/Scripts/uv.exe"],
        "Linux": ["/usr/local/bin/uv", "/usr/bin/uv"],
        "Darwin": ["/usr/local/bin/uv", "/usr/bin/uv"],
    }
    for path in base_paths.get(system(), []):
        if Path(path).exists():
            return str(path)
    return None


def check_node_environment() -> bool:
    """Check Node.js and npm environment"""
    print_header("Checking Node.js Environment")

    try:
        result = run_command(["node", "--version"])
        print_ok(f"Node.js: {result.stdout.strip()}")
    except (FileNotFoundError, subprocess.CalledProcessError):
        print_warning("Node.js not found, please install Node.js 16+")
        return False

    npm_path = shutil.which("npm")
    if npm_path:
        result = run_command([npm_path, "--version"])
        print_ok(f"npm: {result.stdout.strip()}")
        return True

    try:
        run_command(["npm", "--version"])
        print_ok("npm")
        return True
    except FileNotFoundError:
        print_warning("npm not found")
        return False


# ==================== 虚拟环境管理 ====================
def setup_virtual_environment() -> str | None:
    """Setup Python virtual environment with uv"""
    print_header("Setting up Python Virtual Environment")

    project_root = Path(__file__).parent
    venv_path = project_root / ".venv"

    if not (uv_path := get_uv_path()):
        print_error("uv not found. Please install uv: https://docs.astral.sh/uv/")
        return None

    print_info(f"Using uv: {uv_path}")

    if not check_python_version():
        return None

    # Create or update virtual environment
    if not venv_path.exists():
        print_info(f"Creating virtual environment at {venv_path}...")
        try:
            run_command([uv_path, "venv", "--python", "3.11", str(venv_path)], capture=False)
            print_ok("Virtual environment created")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to create virtual environment: {e}")
            return None
    else:
        print_ok("Virtual environment already exists")

    venv_python = get_venv_python(venv_path)
    if not venv_python.exists():
        print_error(f"Python executable not found in virtual environment: {venv_python}")
        return None

    print_ok(f"Virtual environment ready: {venv_python}")

    # Sync dependencies with uv
    print_info("Synchronizing Python dependencies with uv sync...")
    try:
        run_command([uv_path, "sync"], cwd=project_root, capture=False)
        print_ok("Python dependencies synchronized")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to sync dependencies: {e}")
        print_warning("Continuing with existing dependencies...")

    return str(venv_python)


# ==================== 前端管理 ====================
def install_frontend_deps() -> bool:
    """Install frontend dependencies"""
    print_header("Installing Frontend Dependencies")

    frontend_dir = Path(__file__).parent / "frontend"
    node_modules = frontend_dir / "node_modules"

    if node_modules.exists():
        print_ok("Frontend dependencies already installed")
        return True

    print_info("Installing frontend dependencies...")
    try:
        npm_cmd = shutil.which("npm") or "npm"
        run_command([npm_cmd, "install"], cwd=frontend_dir, capture=False)
        print_ok("Frontend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Frontend dependencies installation failed: {e}")
        return False


def build_frontend() -> bool:
    """Build frontend application"""
    print_header("Building Frontend Application")

    frontend_dir = Path(__file__).parent / "frontend"
    build_dir = frontend_dir / "build"

    if build_dir.exists():
        print_info("Cleaning previous build...")
        shutil.rmtree(build_dir)

    print_info("Building frontend (this may take a few minutes)...")
    try:
        npm_cmd = shutil.which("npm") or "npm"
        run_command([npm_cmd, "run", "build"], cwd=frontend_dir, capture=False)
        print_ok("Frontend built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Frontend build failed!")
        print_error(f"Error output: {e.stderr}")
        return False


# ==================== 服务管理 ====================
def _start_service(cmd: list, cwd: Path, name: str, url: str, env_vars: dict | None = None):
    """通用的服务启动函数"""
    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)

    try:
        subprocess.Popen(cmd, cwd=cwd, env=env)
        print_ok(f"{name} started ({url})")
        return True
    except Exception as e:
        print_error(f"{name} startup failed: {e}")
        return False


def start_backend(venv_python: str):
    """Start backend service"""
    print_header("Starting Backend Service")

    project_root = Path(__file__).parent
    env = {"PYTHONPATH": str(project_root / "src")}

    cmd = [
        venv_python, "-m", "uvicorn", "src.pytrading.api.main:app",
        "--host", "0.0.0.0", "--port", "8000", "--reload"
    ]
    return _start_service(cmd, project_root, "Backend service", "http://localhost:8000", env)


def start_frontend():
    """Start frontend service"""
    print_header("Starting Frontend Service")

    frontend_dir = Path(__file__).parent / "frontend"
    npm_cmd = shutil.which("npm") or "npm"

    env = {"PORT": "3000", "FAST_REFRESH": "true"}
    print_info("Starting frontend development server...")

    subprocess.Popen([npm_cmd, "start"], cwd=frontend_dir, env={**os.environ, **env})
    print_ok("Frontend service started (http://localhost:3000)")
    print_info("Frontend is running in DEBUG mode with hot reload enabled")
    return True


def restart_services():
    """Restart backend and frontend services"""
    print_header("Restarting Services")

    for port, name in [(8000, "backend"), (3000, "frontend")]:
        print_info(f"Stopping {name} service on port {port}...")
        kill_process_on_port(port)

    print_info("Waiting for ports to be released...")
    time.sleep(2)

    print_header("Starting Services Again")

    project_root = Path(__file__).parent
    venv_path = project_root / ".venv"
    venv_python = get_venv_python(venv_path)

    if not venv_python.exists():
        print_error(f"Virtual environment not found at {venv_path}")
        return False

    start_backend(str(venv_python))
    start_frontend()
    return True


# ==================== 主函数 ====================
def main():
    print_header("PyTrading One-Click Starter")

    parser = argparse.ArgumentParser(
        description="PyTrading One-Click Starter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Start services in background (default)
  %(prog)s --restart                # Restart services (kill and restart all)
  %(prog)s --init-all              # Initialize environment (venv + dependencies + build)
        """
    )
    parser.add_argument("--restart", action="store_true",
                       help="Restart services (kill existing processes and start new ones)")
    parser.add_argument("--init-all", action="store_true",
                       help="Initialize everything (venv + frontend dependencies + build)")
    args = parser.parse_args()

    # Handle restart
    if args.restart:
        if restart_services():
            print_info("Services restarted successfully in background mode")
            print_info("Press Ctrl+C to stop services")
            _wait_forever()
        else:
            print_error("Failed to restart services")
            sys.exit(1)

    # Handle init-all
    if args.init_all:
        venv_path = Path(__file__).parent / ".venv"
        if venv_path.exists():
            print_info("Removing existing virtual environment...")
            shutil.rmtree(venv_path)
            print_ok("Existing virtual environment removed")

    # Setup and checks
    venv_python = setup_virtual_environment()
    if not venv_python:
        sys.exit(1)

    if not check_node_environment():
        sys.exit(1)

    if not install_frontend_deps():
        sys.exit(1)

    if not build_frontend():
        sys.exit(1)

    # Start services
    print_header("Starting Services")
    start_backend(venv_python)
    start_frontend()

    # Final message
    _print_completion_info()

    # Run services in background by default
    _wait_forever()


def _wait_forever():
    """Wait indefinitely until keyboard interrupt"""
    print_info("Services are running in background...")
    print_info("Press Ctrl+C to stop all services")
    print("=" * 60)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down services...")


def _print_completion_info():
    """Print completion information"""
    print_header("Startup Completed")
    print("Access URLs:")
    print("   - Web UI (React): http://localhost:3000")
    print("   - API Documentation: http://localhost:8000/docs")
    print("   - API Health Check: http://localhost:8000/health")
    print("")
    print("Features:")
    print("   - Hot reload enabled - changes will auto-refresh in browser")
    print("   - Backend auto-reload enabled - code changes restart server")
    print("")
    print("Tips:")
    print("   - Services run in background - use Ctrl+C to stop")
    print("   - Use --restart to kill and restart services")
    print("   - Use --init-all to reinstall environment and rebuild frontend")
    print("")
    print("=" * 60)


if __name__ == "__main__":
    main()
