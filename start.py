#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
PyTrading One-Click Starter
Supports Windows and Linux, auto-start backend and frontend services
Enhanced with virtual environment management and frontend build process
"""
import os
import sys
import subprocess
import platform
from pathlib import Path
import shutil
import time

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_info(msg):
    """Print info message"""
    print(f"[INFO] {msg}")

def print_ok(msg):
    """Print success message"""
    print(f"[OK] {msg}")

def print_error(msg):
    """Print error message"""
    print(f"[ERROR] {msg}")

def print_warning(msg):
    """Print warning message"""
    print(f"[WARNING] {msg}")

def check_python_version():
    """Check if Python 3.11 is available"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 9:
        print(f"Python: {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print_error(f"Python {version.major}.{version.minor} is not supported, need Python 3.9+")
        return False

def get_uv_path():
    """Get path to uv executable"""
    # Try common uv installation locations
    uv_path = shutil.which("uv")
    if uv_path:
        return uv_path

    # Common Windows paths
    if platform.system() == "Windows":
        possible_paths = [
            Path("C:/Python/Python311/Scripts/uv.exe"),
            Path("C:/Python/Python39/Scripts/uv.exe"),
        ]
    else:
        possible_paths = [
            Path("/usr/local/bin/uv"),
            Path("/usr/bin/uv"),
        ]

    for path in possible_paths:
        if path.exists():
            return str(path)

    return None

def setup_virtual_environment():
    """Setup Python virtual environment with uv"""
    print_header("Setting up Python Virtual Environment")

    project_root = Path(__file__).parent
    venv_path = project_root / ".venv"

    # Check if uv is available
    uv_path = get_uv_path()
    if not uv_path:
        print_error("uv not found. Please install uv: https://docs.astral.sh/uv/")
        return None

    print_info(f"Using uv: {uv_path}")

    # Check Python 3.11
    if not check_python_version():
        return None

    # Create or update virtual environment
    if not venv_path.exists():
        print_info(f"Creating virtual environment at {venv_path}...")
        try:
            subprocess.run(
                [uv_path, "venv", "--python", "3.11", str(venv_path)],
                check=True,
                capture_output=True
            )
            print_ok("Virtual environment created")
        except subprocess.CalledProcessError as e:
            print_error(f"Failed to create virtual environment: {e}")
            return None
    else:
        print_ok("Virtual environment already exists")

    # Get Python executable in venv
    if platform.system() == "Windows":
        venv_python = venv_path / "Scripts" / "python.exe"
    else:
        venv_python = venv_path / "bin" / "python"

    if not venv_python.exists():
        print_error(f"Python executable not found in virtual environment: {venv_python}")
        return None

    print_ok(f"Virtual environment ready: {venv_python}")

    # Sync dependencies with uv
    print_info("Synchronizing Python dependencies with uv sync...")
    try:
        subprocess.run(
            [uv_path, "sync"],
            check=True,
            cwd=project_root
        )
        print_ok("Python dependencies synchronized")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to sync dependencies: {e}")
        print_warning("Continuing with existing dependencies...")

    return str(venv_python)

def check_node_environment():
    """Check Node.js and npm environment"""
    print_header("Checking Node.js Environment")

    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print_ok(f"Node.js: {result.stdout.strip()}")
        else:
            print_warning("Node.js not found")
            return False
    except FileNotFoundError:
        print_warning("Node.js not found, please install Node.js 16+")
        return False

    # Check npm
    npm_found = False
    npm_version = None

    # Try using shutil.which
    try:
        npm_path = shutil.which("npm")
        if npm_path:
            result = subprocess.run([npm_path, "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                npm_version = result.stdout.strip()
                npm_found = True
    except:
        pass

    # Try direct npm command
    if not npm_found:
        try:
            result = subprocess.run(["npm", "--version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                npm_version = result.stdout.strip()
                npm_found = True
        except FileNotFoundError:
            pass

    if npm_found:
        print_ok(f"npm: {npm_version}")
        return True
    else:
        print_warning("npm not found")
        return False

def install_frontend_deps():
    """Install frontend dependencies"""
    print_header("Installing Frontend Dependencies")

    frontend_dir = Path(__file__).parent / "frontend"
    node_modules = frontend_dir / "node_modules"

    if not node_modules.exists():
        print_info("Installing frontend dependencies...")
        try:
            npm_cmd = shutil.which("npm") or "npm"
            subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
            print_ok("Frontend dependencies installed")
            return True
        except subprocess.CalledProcessError as e:
            print_error(f"Frontend dependencies installation failed: {e}")
            return False
    else:
        print_ok("Frontend dependencies already installed")
        return True

def build_frontend():
    """Build frontend application"""
    print_header("Building Frontend Application")

    frontend_dir = Path(__file__).parent / "frontend"
    build_dir = frontend_dir / "build"

    if build_dir.exists():
        print_info("Cleaning previous build...")
        import shutil
        shutil.rmtree(build_dir)

    print_info("Building frontend (this may take a few minutes)...")
    try:
        npm_cmd = shutil.which("npm") or "npm"
        result = subprocess.run(
            [npm_cmd, "run", "build"],
            cwd=frontend_dir,
            check=True,
            capture_output=True,
            text=True
        )
        print_ok("Frontend built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Frontend build failed!")
        print_error(f"Error output: {e.stderr}")
        return False

def start_backend(venv_python):
    """Start backend service"""
    print_header("Starting Backend Service")

    try:
        # Set PYTHONPATH
        env = os.environ.copy()
        env['PYTHONPATH'] = str(Path(__file__).parent / "src")

        # Start uvicorn using venv python
        print_info("Starting uvicorn...")
        subprocess.Popen(
            [venv_python, "-m", "uvicorn", "src.pytrading.api.main:app",
             "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=Path(__file__).parent,
            env=env
        )
        print_ok("Backend service started (http://localhost:8000)")
        return True
    except Exception as e:
        print_error(f"Backend startup failed: {e}")
        return False

def start_frontend():
    """Start frontend service"""
    print_header("Starting Frontend Service")

    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Set environment variables
        env = os.environ.copy()
        env['PORT'] = '3000'
        env['FAST_REFRESH'] = 'true'  # Enable fast refresh for debug mode

        npm_cmd = shutil.which("npm") or "npm"

        # Start npm (supports hot reload)
        print_info("Starting frontend development server...")
        subprocess.Popen(
            [npm_cmd, "start"],
            cwd=frontend_dir,
            env=env
        )
        print_ok("Frontend service started (http://localhost:3000)")
        print_info("Frontend is running in DEBUG mode with hot reload enabled")
        return True
    except Exception as e:
        print_error(f"Frontend startup failed: {e}")
        return False

def is_port_in_use(port):
    """Check if a port is in use"""
    if not PSUTIL_AVAILABLE:
        return False
    
    try:
        for proc in psutil.process_iter():
            try:
                connections = proc.connections()
                for conn in connections:
                    if conn.status == psutil.CONN_LISTEN and conn.laddr.port == port:
                        return True
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    except Exception:
        pass
    
    return False

def kill_processes_on_port(port):
    """Kill processes using the specified port"""
    if not PSUTIL_AVAILABLE:
        print_warning("psutil not available, cannot kill processes by port")
        return False
    
    killed = False
    try:
        for proc in psutil.process_iter():
            try:
                # Get process connections
                connections = proc.connections()
                for conn in connections:
                    if conn.status == psutil.CONN_LISTEN:
                        if conn.laddr.port == port:
                            proc_name = proc.name()
                            proc_pid = proc.pid
                            print_info(f"Killing process {proc_name} (PID: {proc_pid}) on port {port}")
                            try:
                                proc.kill()
                                killed = True
                            except psutil.AccessDenied:
                                print_warning(f"Access denied when killing process {proc_pid}, trying terminate...")
                                try:
                                    proc.terminate()
                                    killed = True
                                except:
                                    pass
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
            except psutil.AccessDenied:
                # Process exists but we don't have permission to access its connections
                pass
    except Exception as e:
        print_warning(f"Error killing processes on port {port}: {e}")
    
    return killed

def kill_backend_processes():
    """Kill backend processes (uvicorn on port 8000)"""
    print_info("Stopping backend processes on port 8000...")
    killed = kill_processes_on_port(8000)
    if killed:
        # Wait for process to terminate and port to be released
        max_wait = 5  # Maximum wait time in seconds
        wait_time = 0
        while is_port_in_use(8000) and wait_time < max_wait:
            time.sleep(0.5)
            wait_time += 0.5
        if is_port_in_use(8000):
            print_warning("Port 8000 is still in use after killing processes")
        else:
            print_ok("Backend processes stopped and port 8000 is free")
    else:
        print_info("No backend processes found on port 8000")
    return killed

def kill_frontend_processes():
    """Kill frontend processes (npm/react-scripts on port 3000)"""
    print_info("Stopping frontend processes on port 3000...")
    killed = kill_processes_on_port(3000)
    if killed:
        # Wait for process to terminate and port to be released
        max_wait = 5  # Maximum wait time in seconds
        wait_time = 0
        while is_port_in_use(3000) and wait_time < max_wait:
            time.sleep(0.5)
            wait_time += 0.5
        if is_port_in_use(3000):
            print_warning("Port 3000 is still in use after killing processes")
        else:
            print_ok("Frontend processes stopped and port 3000 is free")
    else:
        print_info("No frontend processes found on port 3000")
    return killed

def restart_services(service="both"):
    """Restart backend and frontend services without reinitialization"""
    print_header("Restarting Services")

    # Kill existing processes first
    if service in ["backend", "both"]:
        kill_backend_processes()
    
    if service in ["frontend", "both"]:
        kill_frontend_processes()

    # Find virtual environment
    project_root = Path(__file__).parent
    venv_path = project_root / ".venv"

    # Get Python executable in venv
    if platform.system() == "Windows":
        venv_python = venv_path / "Scripts" / "python.exe"
    else:
        venv_python = venv_path / "bin" / "python"

    if not venv_python.exists():
        print_error(f"Virtual environment not found at {venv_path}")
        print_info("Tip: Run without --restart to initialize environment first")
        return False

    print_info(f"Using existing virtual environment: {venv_python}")

    # Start backend (if needed)
    if service in ["backend", "both"]:
        try:
            env = os.environ.copy()
            env['PYTHONPATH'] = str(Path(__file__).parent / "src")
            subprocess.Popen(
                [str(venv_python), "-m", "uvicorn", "src.pytrading.api.main:app",
                 "--host", "0.0.0.0", "--port", "8000", "--reload"],
                cwd=Path(__file__).parent,
                env=env
            )
            print_ok("Backend service restarted (http://localhost:8000)")
        except Exception as e:
            print_error(f"Backend restart failed: {e}")
            return False

    # Start frontend (if needed)
    if service in ["frontend", "both"]:
        try:
            frontend_dir = Path(__file__).parent / "frontend"
            env = os.environ.copy()
            env['PORT'] = '3000'
            env['FAST_REFRESH'] = 'true'

            npm_cmd = shutil.which("npm") or "npm"
            subprocess.Popen(
                [npm_cmd, "start"],
                cwd=frontend_dir,
                env=env
            )
            print_ok("Frontend service restarted (http://localhost:3000)")
            print_info("Frontend is running in DEBUG mode with hot reload enabled")
        except Exception as e:
            print_error(f"Frontend restart failed: {e}")
            return False

    return True

def main():
    """Main function"""
    import argparse

    print_header("PyTrading One-Click Starter")

    parser = argparse.ArgumentParser(
        description="PyTrading One-Click Starter",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                          # Fast restart (default, skips init)
  %(prog)s --restart                # Restart services (same as above)
  %(prog)s --service backend        # Start only backend
  %(prog)s --service frontend       # Start only frontend
  %(prog)s --init-venv             # Initialize/recreate Python virtual environment
  %(prog)s --init-frontend         # Initialize frontend dependencies and build
  %(prog)s --init-all              # Initialize everything (venv + frontend)
  %(prog)s --skip-build            # Skip frontend build (faster startup)
  %(prog)s --no-deps               # Skip frontend dependencies installation
        """
    )
    parser.add_argument("--service", choices=["backend", "frontend", "both"],
                       default="both", help="Services to start (default: both)")
    parser.add_argument("--no-deps", action="store_true",
                       help="Skip frontend dependencies installation")
    parser.add_argument("--skip-build", action="store_true",
                       help="Skip frontend build process (faster startup)")
    parser.add_argument("--restart", action="store_true",
                       help="Restart services without reinitialization (default)")
    parser.add_argument("--init-venv", action="store_true",
                       help="Initialize or recreate Python virtual environment")
    parser.add_argument("--init-frontend", action="store_true",
                       help="Initialize frontend dependencies and build")
    parser.add_argument("--init-all", action="store_true",
                       help="Initialize everything (venv + frontend)")
    args = parser.parse_args()

    # Handle initialization flags
    initialize_venv = args.init_venv or args.init_all
    initialize_frontend = args.init_frontend or args.init_all
    is_restart = args.restart or (not initialize_venv and not initialize_frontend)

    # If restart mode, use restart_services() function to skip all initialization
    if is_restart and not initialize_venv and not initialize_frontend:
        if not restart_services(args.service):
            sys.exit(1)
        # Skip to final message after restart
    else:
        # Normal initialization flow
        # Setup Python virtual environment (only if needed)
        venv_python = None
        if initialize_venv:
            # Remove existing venv to recreate
            venv_path = Path(__file__).parent / ".venv"
            if venv_path.exists():
                print_info("Removing existing virtual environment...")
                import shutil
                shutil.rmtree(venv_path)
                print_ok("Existing virtual environment removed")

        # Setup virtual environment (always needed for normal flow)
        venv_python = setup_virtual_environment()
        if not venv_python:
            print_error("Failed to setup Python virtual environment")
            sys.exit(1)

        # Check Node.js environment
        if not check_node_environment():
            print_error("Node.js environment check failed, please ensure Node.js and npm are installed")
            sys.exit(1)

        # Install frontend dependencies (only if needed)
        if initialize_frontend or (not args.no_deps and not is_restart):
            if not install_frontend_deps():
                print_error("Frontend dependencies installation failed")
                sys.exit(1)

        # Build frontend (only if needed)
        if args.service in ["frontend", "both"]:
            if initialize_frontend or (not args.skip_build and not is_restart):
                if not build_frontend():
                    print_error("Frontend build failed")
                    if not args.skip_build:
                        print_info("Tip: Use --skip-build to skip build and start faster")
                        sys.exit(1)

        # Start services
        print_header("Starting Services")

        if args.service in ["backend", "both"]:
            start_backend(venv_python)

        if args.service in ["frontend", "both"]:
            start_frontend()

    # Final message
    print_header("Startup Completed")
    print("Access URLs:")
    print("   - Web UI (React): http://localhost:3000")
    print("   - API Documentation: http://localhost:8000/docs")
    print("   - API Health Check: http://localhost:8000/health")
    print("")
    print("Features:")
    print("   ✓ Hot reload enabled - changes will auto-refresh in browser")
    print("   ✓ Backend auto-reload enabled - code changes restart server")
    print("")
    print("Tips:")
    print("   - Use --restart for quick restart (default)")
    print("   - Use --init-venv to recreate Python environment")
    print("   - Use --init-frontend to rebuild frontend")
    print("   - Use --skip-build to skip frontend build")
    print("")
    print("Press Ctrl+C to stop all services")
    print("=" * 60)

    # Wait for user interrupt
    try:
        input("\nPress Enter to exit...")
    except KeyboardInterrupt:
        print("\n\nShutting down services...")
        pass

if __name__ == "__main__":
    main()
