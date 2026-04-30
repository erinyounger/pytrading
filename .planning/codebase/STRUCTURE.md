# Codebase Structure

**Analysis Date:** 2026-04-30

## Directory Layout

```
/home/eeric/code/pytrading/
├── src/pytrading/          # Main Python package
│   ├── api/                # FastAPI HTTP endpoints
│   ├── config/             # Configuration management
│   ├── controller/         # Order execution logic
│   ├── db/                 # Database models and client
│   ├── model/              # Data models and savers
│   ├── run/                # Strategy execution entry
│   ├── schemas/            # Pydantic request/response models
│   ├── service/            # Business logic services
│   ├── strategy/           # Trading strategy implementations
│   ├── utils/              # Utility functions
│   ├── logger.py           # Custom logging
│   └── py_trading.py       # Main orchestrator
├── frontend/               # React frontend
│   └── src/
│       ├── pages/          # Page components
│       ├── components/     # Reusable UI components
│       ├── services/       # API client services
│       ├── utils/          # Frontend utilities
│       └── types/          # TypeScript type definitions
├── tests/                  # Python test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── fixtures/           # Test fixtures
├── test/                   # Legacy/test scripts
├── docs/                   # Documentation
├── sql/                    # SQL scripts
├── logs/                   # Application logs
├── gmcache/                # Golden Quant cache
├── gm_data/                # Market data storage
├── bin/                    # Executable scripts
├── .workflow/              # Workflow state
├── graphify-out/           # Knowledge graph output
├── run.py                  # Legacy entry point
├── start.py                # Windows startup
├── start.sh                # Linux startup
├── pyproject.toml          # Python project config
└── .env                    # Environment variables
```

## Directory Purposes

**src/pytrading/api:**
- Purpose: FastAPI HTTP route handlers
- Contains: `main.py` (2000+ line API server)
- Key files: `main.py`

**src/pytrading/config:**
- Purpose: Centralized configuration from environment variables
- Contains: `settings.py` (Config dataclass), enums, strategy/watch type definitions
- Key files: `settings.py`, `strategy_enum.py`, `watch_type.py`, `order_enum.py`

**src/pytrading/controller:**
- Purpose: Order execution and state management
- Contains: OrderController
- Key files: `order_controller.py`

**src/pytrading/db:**
- Purpose: Database models and connection management
- Contains: MySQLClient, SQLAlchemy models (Strategy, StockSymbol, BacktestTask, BackTestResult, etc.)
- Key files: `mysql.py`, `init_db.py`, `log_repository.py`

**src/pytrading/model:**
- Purpose: Backtest result data structures and persistence
- Contains: BackTest, BackTestSaver, BackTestSaverFactory
- Key files: `back_test.py`, `back_test_saver_factory.py`, `mysql_back_test_saver.py`

**src/pytrading/run:**
- Purpose: Strategy execution entry point (subprocess per symbol)
- Contains: `run_strategy.py` with gm.api callbacks
- Key files: `run_strategy.py`

**src/pytrading/schemas:**
- Purpose: Pydantic models for API request/response validation
- Contains: `ai_analysis.py`, `market_data.py`
- Key files: `ai_analysis.py`

**src/pytrading/service:**
- Purpose: Business logic encapsulation
- Contains: WatchlistService, TradeRecordService, SentimentAnalyzer, EventProcessor, AnalysisEngine
- Key files: `watchlist_service.py`

**src/pytrading/strategy:**
- Purpose: Trading strategy implementations
- Contains: StrategyBase (base class), MacdStrategy, BollStrategy, TurtleStrategy
- Key files: `base.py`, `strategy_macd.py`, `strategy_boll.py`, `strategy_turtle.py`

**src/pytrading/utils:**
- Purpose: Utility functions (Talib wrappers, AkShare helpers, thread pool, process utilities)
- Contains: `talib_util.py`, `akshare_util.py`, `thread_pool.py`, `process.py`, `myquant.py`
- Key files: `talib_util.py`, `akshare_util.py`

**frontend/src/pages:**
- Purpose: React page components
- Contains: Backtest page, Watchlist page, AI Analysis page
- Key files: (component files)

**frontend/src/components:**
- Purpose: Reusable React UI components
- Contains: Charts, tables, forms
- Key files: (component files)

**frontend/src/services:**
- Purpose: API client functions
- Contains: API call wrappers
- Key files: (service files)

**tests:**
- Purpose: Python test suite
- Contains: Unit tests, integration tests, fixtures
- Key files: `conftest.py`

## Key File Locations

**Entry Points:**
- `run.py`: Legacy direct Python entry point
- `start.py`: Windows batch launcher
- `start.sh`: Linux startup script
- `src/pytrading/api/main.py`: FastAPI server (main entry for web)
- `src/pytrading/run/run_strategy.py`: Strategy subprocess entry

**Configuration:**
- `src/pytrading/config/settings.py`: Config dataclass (singleton)
- `.env`: Environment variables

**Core Logic:**
- `src/pytrading/py_trading.py`: PyTrading orchestrator class
- `src/pytrading/service/watchlist_service.py`: Watchlist business logic
- `src/pytrading/strategy/strategy_macd.py`: MACD strategy implementation

**Testing:**
- `tests/conftest.py`: Pytest fixtures
- `tests/unit/`: Unit test files
- `tests/integration/`: Integration test files

## Naming Conventions

**Files:**
- Python modules: `lowercase_with_underscores.py` (e.g., `watchlist_service.py`)
- Python packages: `lowercase_with_underscores/` (e.g., `src/pytrading/`)
- React components: `PascalCase.tsx` (e.g., `BacktestPage.tsx`)
- React hooks: `use*.ts` (e.g., `useBacktest.ts`)
- Config files: `lowercase.*` or `.camelCase` (e.g., `pyproject.toml`)

**Functions/Methods:**
- Python: `snake_case` (e.g., `get_watchlist`, `run_strategy`)
- Classes: `PascalCase` (e.g., `WatchlistService`, `MacdStrategy`)

**Variables:**
- Python: `snake_case` (e.g., `task_id`, `backtest_results`)
- TypeScript: `camelCase` (e.g., `backtestResults`, `taskId`)

**Types/Enums:**
- Python enums: `PascalCase` with `Enum` suffix (e.g., `BacktestStatus`, `TrendingType`)
- TypeScript interfaces: `PascalCase` (e.g., `BacktestResult`)

## Where to Add New Code

**New API Endpoint:**
- Primary code: Add to `src/pytrading/api/main.py` (consider splitting into router files)
- Request/Response model: Add to `src/pytrading/schemas/`
- Tests: `tests/integration/test_watchlist_api.py`

**New Strategy:**
- Implementation: `src/pytrading/strategy/strategy_new.py`
- Extend: `StrategyBase` class
- Test: Add to `tests/unit/` or legacy `test/strategy.py`

**New Service:**
- Implementation: `src/pytrading/service/service_name.py`
- Import pattern: From `pytrading.service import ServiceName`
- Tests: `tests/unit/test_service_name.py`

**New Database Model:**
- Model definition: `src/pytrading/db/mysql.py` (add new class extending Base)
- Saver (optional): `src/pytrading/model/` if custom save logic needed

**New Utility:**
- Shared utilities: `src/pytrading/utils/`
- Import pattern: `from pytrading.utils import utility_name`

**Frontend Component:**
- Page: `frontend/src/pages/PageName.tsx`
- Component: `frontend/src/components/ComponentName.tsx`
- Service: `frontend/src/services/api.ts`

## Special Directories

**.workflow:**
- Purpose: Workflow state and planning documents
- Generated: Yes (by GSD workflow system)
- Committed: Yes

**graphify-out:**
- Purpose: Knowledge graph output for codebase navigation
- Generated: Yes (by graphify)
- Committed: Yes

**gmcache:**
- Purpose: Golden Quant SDK cache directory
- Generated: Yes (by gm.api)
- Committed: No (.gitignore)

**gm_data:**
- Purpose: Market data storage
- Generated: Yes (runtime data)
- Committed: No

**logs:**
- Purpose: Application log files
- Generated: Yes (runtime)
- Committed: No

**.venv:**
- Purpose: Python virtual environment
- Generated: Yes (by uv/venv)
- Committed: No

---

*Structure analysis: 2026-04-30*
