#!/bin/bash
cd /d/Code/pytrading/xTrading
# 杀死所有vite进程
pkill -f "vite" 2>/dev/null || true
sleep 2
# 使用端口3000启动开发服务器
npm run dev -- --port 3000 --host 0.0.0.0
