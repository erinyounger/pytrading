#!/bin/bash

echo ""
echo "================================"
echo "  PyTrading One-Click Starter (Linux/Mac)"
echo "================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found, please install Python 3.9+"
    exit 1
fi

# Start Python script
echo "[INFO] Starting PyTrading..."
echo ""
python3 start.py "$@"
