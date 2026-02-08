#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
PyTrading One-Click Starter
Supports Windows and Linux, auto-start backend and frontend services
"""
import os
import sys
import subprocess
import platform
from pathlib import Path

def check_environment():
    """Check runtime environment"""
    print("=" * 60)
    print("PyTrading One-Click Starter")
    print("=" * 60)
    print(f"Python: {sys.version}")
    print(f"Platform: {platform.system()}")
    print("=" * 60)

    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"Node.js: {result.stdout.strip()}")
        else:
            print("WARNING: Node.js not found")
            return False
    except FileNotFoundError:
        print("WARNING: Node.js not found, please install Node.js")
        return False

    # Check npm - try multiple ways
    npm_found = False
    npm_version = None

    # Try using shutil.which
    try:
        import shutil
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
        print(f"npm: {npm_version}")
    else:
        print("WARNING: npm not found")
        return False

    return True

def install_frontend_deps():
    """Install frontend dependencies"""
    frontend_dir = Path(__file__).parent / "frontend"
    node_modules = frontend_dir / "node_modules"

    if not node_modules.exists():
        print("\n[INFO] Installing frontend dependencies...")
        try:
            # Find npm command
            import shutil
            npm_cmd = shutil.which("npm") or "npm"
            subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
            print("[OK] Frontend dependencies installed")
            return True
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Frontend dependencies installation failed: {e}")
            return False
    else:
        print("\n[OK] Frontend dependencies already installed")
        return True

def start_backend():
    """Start backend service"""
    print("\n[INFO] Starting backend service...")
    try:
        # Set PYTHONPATH
        env = os.environ.copy()
        env['PYTHONPATH'] = str(Path(__file__).parent / "src")

        # Start uvicorn
        subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "src.pytrading.api.main:app",
             "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=Path(__file__).parent,
            env=env
        )
        print("[OK] Backend service started (http://localhost:8000)")
        return True
    except Exception as e:
        print(f"[ERROR] Backend startup failed: {e}")
        return False

def start_frontend():
    """Start frontend service"""
    print("\n[INFO] Starting frontend service...")
    frontend_dir = Path(__file__).parent / "frontend"

    try:
        # Set environment variables
        env = os.environ.copy()
        env['PORT'] = '3000'

        # Find npm command
        import shutil
        npm_cmd = shutil.which("npm") or "npm"

        # Start npm
        subprocess.Popen(
            [npm_cmd, "start"],
            cwd=frontend_dir,
            env=env
        )
        print("[OK] Frontend service started (http://localhost:3000)")
        return True
    except Exception as e:
        print(f"[ERROR] Frontend startup failed: {e}")
        return False

def main():
    """Main function"""
    import argparse
    parser = argparse.ArgumentParser(description="PyTrading One-Click Starter")
    parser.add_argument("--service", choices=["backend", "frontend", "both"],
                       default="both", help="Services to start (default: both)")
    parser.add_argument("--no-deps", action="store_true",
                       help="Skip frontend dependencies installation")
    args = parser.parse_args()

    # Check environment
    if not check_environment():
        print("\n[ERROR] Environment check failed, please ensure Node.js and npm are installed")
        sys.exit(1)

    # Install frontend dependencies
    if not args.no_deps:
        if not install_frontend_deps():
            print("\n[ERROR] Frontend dependencies installation failed")
            sys.exit(1)

    # Start services
    print("\n" + "=" * 60)
    if args.service in ["backend", "both"]:
        start_backend()

    if args.service in ["frontend", "both"]:
        start_frontend()

    print("\n" + "=" * 60)
    print("[OK] Startup completed!")
    print("=" * 60)
    print("Access URLs:")
    print("   - Web UI: http://localhost:3000")
    print("   - API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop all services")
    print("=" * 60)

    # Wait for user interrupt
    try:
        input("\nPress Enter to exit...")
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
