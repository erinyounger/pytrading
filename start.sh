#!/usr/bin/env bash
# =================================================================
# PyTrading One-Click Starter (Linux/macOS)
# Industry best practices: colored output, parallel startup, health checks
# =================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color
ICON_CHECK="✓"
ICON_CROSS="✗"
ICON_ROCKET="🚀"
ICON_SPINNER="◐"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
VENV_PATH="$PROJECT_ROOT/.venv"
PYTHON="$VENV_PATH/bin/python"
PID_DIR="$PROJECT_ROOT/.pids"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# Ports
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Flags
MODE="all"  # all | backend | frontend | dev
SKIP_BUILD=false

# =================================================================
# Logging functions
# =================================================================
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}"
}

info()    { log "INFO"    "${BLUE}${ICON_SPINNER}${NC} $*"; }
success() { log "SUCCESS" "${GREEN}${ICON_CHECK}${NC} $*"; }
warn()    { log "WARN"    "${YELLOW}⚠ $*"; }
error()   { log "ERROR"   "${RED}${ICON_CROSS}${NC} $*" >&2; }

header() {
    echo ""
    echo -e "${BOLD}${CYAN}============================================================${NC}"
    echo -e "${BOLD}${CYAN}  $*${NC}"
    echo -e "${CYAN}============================================================${NC}"
    echo ""
}

section() {
    echo ""
    echo -e "${BOLD}${BLUE}▶ $*${NC}"
    echo ""
}

# =================================================================
# Cleanup functions
# =================================================================
cleanup_pids() {
    mkdir -p "$PID_DIR"
    mkdir -p "$LOG_DIR"
}

# =================================================================
# System checks
# =================================================================
check_python() {
    section "Checking Python"
    if command -v python3 &>/dev/null; then
        local version=$(python3 --version 2>&1)
        success "Python: $version"
    else
        error "Python 3 not found. Please install Python 3.9+"
        return 1
    fi
}

check_uv() {
    section "Checking uv"
    if command -v uv &>/dev/null; then
        local uv_version=$(uv --version 2>&1 | head -1)
        success "uv: $uv_version"
    else
        warn "uv not found. Will try to install..."
        if command -v curl &>/dev/null; then
            curl -LsSf https://astral.sh/uv/install.sh | sh
            export PATH="$HOME/.cargo/bin:$PATH"
        else
            error "curl not found. Please install uv manually: https://astral.sh/uv/"
            return 1
        fi
    fi
}

check_node() {
    section "Checking Node.js"
    if command -v node &>/dev/null; then
        local node_version=$(node --version 2>&1)
        success "Node.js: $node_version"
    else
        warn "Node.js not found. Frontend will not be available."
        return 1
    fi

    if command -v npm &>/dev/null; then
        local npm_version=$(npm --version 2>&1)
        success "npm: $npm_version"
    else
        warn "npm not found."
    fi
}

check_env() {
    section "Checking Environment"
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        success ".env file found"
    else
        if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
            warn ".env not found, copying from .env.example..."
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            success "Created .env from .env.example"
            warn "Please edit .env and configure your trading tokens"
        else
            warn ".env not found"
        fi
    fi
}

# =================================================================
# Virtual environment
# =================================================================
setup_venv() {
    section "Setting up Virtual Environment"

    if [[ -d "$VENV_PATH" ]]; then
        success "Virtual environment exists: $VENV_PATH"
    else
        info "Creating virtual environment with Python 3.11..."
        uv venv --python 3.11 "$VENV_PATH"
        success "Virtual environment created"
    fi

    if [[ ! -f "$PYTHON" ]]; then
        error "Python not found in venv: $PYTHON"
        return 1
    fi

    # Sync dependencies
    info "Syncing Python dependencies..."
    cd "$PROJECT_ROOT"
    uv sync
    success "Dependencies synced"
}

# =================================================================
# Service management
# =================================================================
is_port_in_use() {
    local port=$1
    if command -v lsof &>/dev/null; then
        lsof -i ":$port" &>/dev/null
    elif command -v netstat &>/dev/null; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
    else
        # Fallback: try to connect
        timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null
    fi
}

wait_for_port() {
    local port=$1
    local name=$2
    local max_attempts=${3:-30}
    local attempt=1

    info "Waiting for $name to be ready on port $port..."
    while ! is_port_in_use "$port"; do
        sleep 1
        printf "."
        ((attempt++)) || true
        if [[ $attempt -gt $max_attempts ]]; then
            echo ""
            error "$name did not start within ${max_attempts}s"
            return 1
        fi
    done
    echo ""
    success "$name is ready on port $port"
}

start_backend() {
    section "Starting Backend Service"

    # Kill existing process on port
    if is_port_in_use $BACKEND_PORT; then
        warn "Port $BACKEND_PORT is in use, attempting to free it..."
        # Kill by port more aggressively
        local pid=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
        if [[ -n "$pid" ]]; then
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
        # Also kill by PID file if exists
        if [[ -f "$BACKEND_PID_FILE" ]]; then
            local old_pid=$(cat "$BACKEND_PID_FILE")
            kill -9 $old_pid 2>/dev/null || true
        fi
        sleep 1
    fi

    # Setup environment
    local gm_data_path="$PROJECT_ROOT/gm_data"
    mkdir -p "$gm_data_path"

    # Start backend
    info "Starting FastAPI backend on http://0.0.0.0:$BACKEND_PORT..."

    cd "$PROJECT_ROOT"
    nohup env PYTHONPATH="$PROJECT_ROOT/src" GM_DATA_PATH="$gm_data_path" \
        "$PYTHON" -m uvicorn pytrading.api.main:app \
        --host 0.0.0.0 \
        --port $BACKEND_PORT \
        --reload \
        > "$BACKEND_LOG" 2>&1 &
    local backend_pid=$!

    echo $backend_pid > "$BACKEND_PID_FILE"
    success "Backend started (PID: $backend_pid)"
    info "Logs: $BACKEND_LOG"

    # Wait for backend to be ready
    wait_for_port $BACKEND_PORT "Backend API"

    # Health check
    sleep 2
    if curl -sf "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        warn "Backend health check failed, but service is running"
    fi
}

start_frontend() {
    section "Starting Frontend Service"

    local frontend_dir="$PROJECT_ROOT/frontend"

    if [[ ! -d "$frontend_dir" ]]; then
        error "Frontend directory not found: $frontend_dir"
        return 1
    fi

    # Check node_modules
    if [[ ! -d "$frontend_dir/node_modules" ]]; then
        section "Installing Frontend Dependencies"
        info "Running npm install..."
        cd "$frontend_dir"
        npm install
        success "Dependencies installed"
    fi

    # Kill existing process on port
    if is_port_in_use $FRONTEND_PORT; then
        warn "Port $FRONTEND_PORT is in use, attempting to free it..."
        # Kill by port more aggressively
        local pid=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
        if [[ -n "$pid" ]]; then
            kill -9 $pid 2>/dev/null || true
            sleep 2
        fi
        # Also kill by PID file if exists
        if [[ -f "$FRONTEND_PID_FILE" ]]; then
            local old_pid=$(cat "$FRONTEND_PID_FILE")
            kill -9 $old_pid 2>/dev/null || true
        fi
        sleep 1
    fi

    # Start frontend
    info "Starting React frontend on http://0.0.0.0:$FRONTEND_PORT..."

    cd "$frontend_dir"
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    local frontend_pid=$!

    echo $frontend_pid > "$FRONTEND_PID_FILE"
    success "Frontend started (PID: $frontend_pid)"
    info "Logs: $FRONTEND_LOG"

    # Wait for frontend to be ready
    wait_for_port $FRONTEND_PORT "Frontend"
}

stop_services() {
    header "Stopping Services"

    for pid_file in "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"; do
        if [[ -f "$pid_file" ]]; then
            local pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                info "Stopping process $pid..."
                kill -TERM "$pid" 2>/dev/null || true
                sleep 2
                # Force kill if still running
                if kill -0 "$pid" 2>/dev/null; then
                    kill -9 "$pid" 2>/dev/null || true
                fi
            fi
            rm -f "$pid_file"
        fi
    done

    # Aggressively kill by port - more robust than fuser
    for port in $BACKEND_PORT $FRONTEND_PORT; do
        if is_port_in_use $port; then
            info "Killing process on port $port..."
            local pid=$(lsof -ti:$port 2>/dev/null || true)
            if [[ -n "$pid" ]]; then
                kill -9 $pid 2>/dev/null || true
            fi
            sleep 1
        fi
    done

    success "All services stopped"
}

status_services() {
    header "Service Status"

    local backend_running=false
    local frontend_running=false

    if is_port_in_use $BACKEND_PORT; then
        backend_running=true
    fi
    if is_port_in_use $FRONTEND_PORT; then
        frontend_running=true
    fi

    if $backend_running; then
        echo -e "${GREEN}${ICON_CHECK} Backend (port $BACKEND_PORT): RUNNING${NC}"
    else
        echo -e "${RED}${ICON_CROSS} Backend (port $BACKEND_PORT): STOPPED${NC}"
    fi

    if $frontend_running; then
        echo -e "${GREEN}${ICON_CHECK} Frontend (port $FRONTEND_PORT): RUNNING${NC}"
    else
        echo -e "${RED}${ICON_CROSS} Frontend (port $FRONTEND_PORT): STOPPED${NC}"
    fi
}

# =================================================================
# Signal handling
# =================================================================
shutdown() {
    echo ""
    warn "Received shutdown signal..."
    stop_services
    exit 0
}

trap shutdown SIGINT SIGTERM

# =================================================================
# Help
# =================================================================
show_help() {
    cat << EOF
${BOLD}PyTrading One-Click Starter${NC}

${BOLD}USAGE:${NC}
    ./start.sh [OPTIONS]

${BOLD}OPTIONS:${NC}
    -h, --help              Show this help message
    -b, --backend           Start only backend service
    -f, --frontend          Start only frontend service
    -s, --stop              Stop all services
    --status                Show service status
    --dev                   Development mode (backend only, no build)

${BOLD}EXAMPLES:${NC}
    ./start.sh              Start all services (default)
    ./start.sh -b           Start backend only
    ./start.sh -f           Start frontend only
    ./start.sh -s           Stop all services
    ./start.sh --status     Check service status

${BOLD}PORTS:${NC}
    Backend:  $BACKEND_PORT (FastAPI)
    Frontend: $FRONTEND_PORT (React)

${BOLD}LOGS:${NC}
    Backend:  $BACKEND_LOG
    Frontend: $FRONTEND_LOG

EOF
}

# =================================================================
# Main
# =================================================================
main() {
    cleanup_pids

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--backend)
                MODE="backend"
                shift
                ;;
            -f|--frontend)
                MODE="frontend"
                shift
                ;;
            -s|--stop)
                stop_services
                exit 0
                ;;
            --status)
                status_services
                exit 0
                ;;
            --dev)
                MODE="backend"
                SKIP_BUILD=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Pre-flight checks
    header "PyTrading One-Click Starter ${ICON_ROCKET}"
    check_python
    check_uv
    check_env

    # Setup venv
    setup_venv

    # Start services based on mode
    case $MODE in
        backend)
            start_backend
            ;;
        frontend)
            check_node
            start_frontend
            ;;
        all)
            check_node
            start_backend &
            local backend_pid=$!
            start_frontend &
            local frontend_pid=$!
            wait $backend_pid $frontend_pid 2>/dev/null || true
            ;;
    esac

    # Final status
    echo ""
    status_services
    echo ""
    success "Services started successfully!"
    echo ""
    echo -e "${BOLD}Access URLs:${NC}"
    echo -e "  - Web UI:   ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  - API Docs: ${CYAN}http://localhost:$BACKEND_PORT/docs${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""

    # Wait for signals
    while true; do
        sleep 1
    done
}

main "$@"
