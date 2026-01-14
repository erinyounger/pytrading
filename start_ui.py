#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：Web UI启动脚本
@Author  ：Claude
@Date    ：2025-08-16
"""
import os
import sys
import subprocess
import uvicorn
from pathlib import Path

def start_backend():
    """启动FastAPI后端服务"""
    print("🚀 启动后端API服务...")
    api_path = Path(__file__).parent / "src" / "pytrading" / "api" / "main.py"
    
    try:
        uvicorn.run(
            "src.pytrading.api.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ 后端启动失败: {e}")
        sys.exit(1)

def start_frontend():
    """启动React前端服务"""
    print("🎨 启动前端界面...")
    frontend_dir = Path(__file__).parent / "frontend"
    
    if not frontend_dir.exists():
        print("❌ 前端目录不存在，请先安装前端依赖")
        sys.exit(1)
    
    try:
        # 检查是否已安装依赖
        node_modules = frontend_dir / "node_modules"
        if not node_modules.exists():
            print("📦 安装前端依赖...")
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        
        # 启动开发服务器
        subprocess.run(["npm", "start"], cwd=frontend_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ 前端启动失败: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("❌ 未找到npm命令，请确保已安装Node.js")
        sys.exit(1)

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PyTrading Web UI 启动器")
    parser.add_argument(
        "--service", 
        choices=["backend", "frontend", "both"], 
        default="both",
        help="启动的服务类型 (默认: both)"
    )
    
    args = parser.parse_args()
    
    print("🏁 PyTrading Web UI 启动器")
    print("=" * 50)
    
    if args.service in ["backend", "both"]:
        if args.service == "both":
            print("📋 将同时启动后端API和前端界面")
            print("📍 后端地址: http://localhost:8000")
            print("📍 前端地址: http://localhost:3000")
            print("⚠️  请先手动启动后端，然后在新终端启动前端")
            print("\n启动后端命令: python start_ui.py --service backend")
            print("启动前端命令: python start_ui.py --service frontend")
            return
        start_backend()
    elif args.service == "frontend":
        start_frontend()

if __name__ == "__main__":
    main()