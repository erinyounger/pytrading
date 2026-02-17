#!/bin/bash

echo ""
echo "================================"
echo "  PyTrading One-Click Starter (Linux/Mac)"
echo "================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found, please install Python 3.9+"
    exit 1
fi

# Check if virtual environment exists, if not create it
if [ ! -d ".venv" ]; then
    echo "[INFO] Virtual environment not found, creating .venv with Python 3.11..."
    python3 -m venv .venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        exit 1
    fi
fi

# Activate virtual environment
echo "[INFO] Activating virtual environment..."
source .venv/bin/activate

# Verify Python version in venv
echo "[INFO] Checking Python version in virtual environment..."
python --version

# Start Python script with all arguments
echo "[INFO] Starting PyTrading..."
echo ""
python start.py "$@"
