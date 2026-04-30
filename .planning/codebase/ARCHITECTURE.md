<!-- refreshed: 2026-04-30 -->
# Architecture

**Analysis Date:** 2026-04-30

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│         `frontend/src/pages`, `frontend/src/components`      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (FastAPI)                             │
│                  `src/pytrading/api/main.py`                  │
│  - /api/backtest/*    - /api/watchlist/*                     │
│  - /api/ai/*         - /api/market/*                         │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer                                  │
│     `src/pytrading/service/`                                 │
│  - WatchlistService                                         │
│  - TradeRecordService                                       │
│  - SentimentAnalyzer (AI)                                   │
│  - EventProcessor (AI)                                      │
│  - AnalysisEngine (AI)                                      │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Model / Data Access Layer                      │
│     `src/pytrading/model/`, `src/pytrading/db/`             │
│  - BackTest, BackTestSaver, MySQLClient                     │
│  - Strategy, StockSymbol, BacktestTask                       │
│  - TradeRecord, StockKline, AIAnalysisResult                │
└─────────────────────────────────────────────────────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Strategy Layer                                 │
│     `src/pytrading/strategy/`, `src/pytrading/run/`         │
│  - MacdStrategy, BollStrategy, TurtleStrategy              │
│  - run_strategy.py (execution entry)                        │
│  - OrderController                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  - MySQL Database                                          │
│  - Golden Quant API (gm.api)                               │
│  - AkShare (market data)                                   │
│  - LLM API (AI analysis)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| PyTrading | Main orchestrator - manages backtest task lifecycle, thread pool execution | `src/pytrading/py_trading.py` |
| FastAPI App | HTTP API server - handles REST endpoints for backtest, watchlist, AI analysis, market data | `src/pytrading/api/main.py` |
| WatchlistService | CRUD for stock watchlist, watch type change detection, metric updates | `src/pytrading/service/watchlist_service.py` |
| MySQLClient | Database connection management, ORM session factory | `src/pytrading/db/mysql.py` |
| BackTest Model | Backtest result data structure, save/load operations | `src/pytrading/model/back_test.py` |
| MacdStrategy | MACD-based trading signal generation | `src/pytrading/strategy/strategy_macd.py` |
| OrderController | Order execution and state management | `src/pytrading/controller/order_controller.py` |

## Pattern Overview

**Overall:** Layered Architecture with Service-Oriented Components

**Key Characteristics:**
- **FastAPI Layer**: Async HTTP endpoints for web UI interaction
- **Service Layer**: Business logic encapsulation (WatchlistService, etc.)
- **Model Layer**: SQLAlchemy ORM models and data access objects
- **Strategy Layer**: Trading strategy implementations with base class pattern
- **Run Layer**: Strategy execution entry points via subprocess

## Layers

**API Layer (FastAPI):**
- Purpose: Expose REST endpoints for frontend interaction
- Location: `src/pytrading/api/main.py`
- Contains: HTTP route handlers for backtest, watchlist, AI analysis, market data
- Depends on: Service layer, MySQLClient
- Used by: Frontend React app

**Service Layer:**
- Purpose: Business logic encapsulation
- Location: `src/pytrading/service/`
- Contains: WatchlistService, TradeRecordService, SentimentAnalyzer, EventProcessor, AnalysisEngine
- Depends on: Model/DB layer, Config
- Used by: API layer, Strategy execution

**Model Layer:**
- Purpose: Data structures and database access
- Location: `src/pytrading/model/`, `src/pytrading/db/`
- Contains: BackTest, BackTestSaver, MySQLClient, SQLAlchemy models
- Depends on: MySQL database
- Used by: Service layer, API layer, Strategy layer

**Strategy Layer:**
- Purpose: Trading signal generation
- Location: `src/pytrading/strategy/`
- Contains: StrategyBase (base class), MacdStrategy, BollStrategy, TurtleStrategy
- Depends on: gm.api for market data
- Used by: run_strategy.py

**Run Layer:**
- Purpose: Strategy execution entry point (subprocess per symbol)
- Location: `src/pytrading/run/run_strategy.py`
- Contains: init(), on_bar(), on_backtest_finished() callbacks, CLI parser
- Depends on: Strategy layer, OrderController, gm.api
- Used by: PyTrading class (via subprocess)

## Data Flow

### Primary Request Path (Backtest Task)

1. **Frontend** (`frontend/src/pages/`) - User initiates backtest via UI
2. **API** (`src/pytrading/api/main.py:start_backtest`) - Creates BacktestTask record, returns task_id
3. **Task Scheduler** (background thread in `main.py:task_scheduler`) - Polls for pending tasks
4. **PyTrading** (`src/pytrading/py_trading.py:run_backtest_task`) - Orchestrates multi-symbol execution
5. **Subprocess** (`src/pytrading/run/run_strategy.py:multiple_run`) - Spawns per-symbol process
6. **Strategy** (`src/pytrading/strategy/strategy_macd.py:MacdStrategy.run`) - Generates trading signals
7. **OrderController** (`src/pytrading/controller/order_controller.py`) - Executes orders via gm.api
8. **BackTestResult** saved to MySQL via `BackTest.save()` or `MySQLBackTestSaver`

### Watchlist Flow

1. User adds stock to watchlist via `/api/watchlist` POST
2. WatchlistService creates WatchlistItem record
3. User triggers batch backtest via `/api/watchlist/backtest`
4. WatchlistService groups by strategy_id, creates BacktestTask per group
5. After backtest completes, WatchlistService.update_metrics() updates watch_type based on trending_type

### AI Analysis Flow

1. Frontend requests `/api/ai/analysis/{symbol}`
2. API checks DB for cached result
3. If missing/force_refresh, AnalysisEngine.analyze_stock() runs
4. SentimentAnalyzer fetches market news via AkShare
5. EventProcessor fetches company announcements
6. LLM generates investment insight
7. AIAnalysisResult saved to MySQL

**State Management:**
- Task state tracked in BacktestTask.status ('pending', 'running', 'completed', 'failed', 'cancelled')
- Strategy state held in context object from gm.api
- WatchlistItem.watch_type tracks stock classification ('上涨', '下跌', '盘整', '无状态')

## Key Abstractions

**StrategyBase:**
- Purpose: Base class for all trading strategies
- Examples: `src/pytrading/strategy/strategy_macd.py`, `strategy_boll.py`, `strategy_turtle.py`
- Pattern: Template method - setup(), run(), run_schedule() hooks

**MySQLClient:**
- Purpose: Database connection management
- Examples: `src/pytrading/db/mysql.py`
- Pattern: Factory/Connection pool

**BackTest:**
- Purpose: Backtest result data structure with save capability
- Examples: `src/pytrading/model/back_test.py`
- Pattern: Active record pattern

**Config:**
- Purpose: Centralized configuration from environment variables
- Examples: `src/pytrading/config/settings.py`
- Pattern: Singleton dataclass

## Entry Points

**Web API:**
- Location: `src/pytrading/api/main.py`
- Triggers: HTTP requests from frontend
- Responsibilities: Request validation, response formatting, background task scheduling

**CLI/Raw Script:**
- Location: `run.py` (project root)
- Triggers: Direct Python execution
- Responsibilities: Legacy entry point, creates PyTrading instance

**Strategy Subprocess:**
- Location: `src/pytrading/run/run_strategy.py`
- Triggers: PyTrading.run_strategy() spawns subprocess per symbol
- Responsibilities: gm.api context initialization, strategy callbacks, result saving

**start.py (Windows batch launcher):**
- Location: `start.py` (project root)
- Triggers: Windows startup script
- Responsibilities: Platform-specific process launching

## Architectural Constraints

- **Threading:** ThreadPool in PyTrading manages concurrent symbol execution (size=10). Each symbol runs in separate subprocess.
- **Global state:** PyTrading._active_pools tracks running task thread pools. Config object is module-level singleton.
- **Circular imports:** Service layer imports from db layer, API imports service, but run_strategy.py has complex path setup to avoid import issues.
- **Subprocess isolation:** Each symbol runs in separate process with independent gm.api context to avoid conflicts.

## Anti-Patterns

### Direct Session Management in Services

**What happens:** WatchlistService._get_session() creates new MySQLClient instance for each call
**Why it's wrong:** Creates new connection pool per request, potential resource exhaustion
**Do this instead:** Pass session from API layer or use context manager pattern

### God Object in API

**What happens:** `src/pytrading/api/main.py` contains 2000+ lines with all endpoints
**Why it's wrong:** Difficult to navigate, test, maintain
**Do this instead:** Split into routers (backtest_router.py, watchlist_router.py, ai_router.py)

### Strategy State in Context

**What happens:** Strategy classes store state (self.order, self.side) that persists across bars
**Why it's wrong:** Context object from gm.api is opaque, state mutation is implicit
**Do this instead:** Explicit state container passed through run() return value

## Error Handling

**Strategy:** Exceptions logged with task_id/symbol context, task status updated to 'failed', error_message stored in BacktestTask

**API:** HTTPException for client errors (400, 404), generic 500 for internal errors with sanitized message

**Database:** Session rollback on exception, connection pool with ping to detect stale connections

## Cross-Cutting Concerns

**Logging:** Custom logger in `src/pytrading/logger.py` with task_id/symbol context (extra parameter)
**Validation:** Pydantic models for request/response in API (WatchlistRequest, AIAnalysisResponse)
**Authentication:** Token-based (gm.api token, LLM API key) via environment variables

---

*Architecture analysis: 2026-04-30*
