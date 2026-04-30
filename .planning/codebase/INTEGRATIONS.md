# External Integrations

**Analysis Date:** 2026-04-30

## APIs & External Services

**Quantitative Trading:**
- **掘金量化 (GM)** - Chinese quantitative trading platform
  - SDK: `gm>=3.0.177`
  - Auth: `BACKTEST_TRADING_TOKEN` / `LIVE_TRADING_TOKEN` env vars
  - Usage: Backtesting and live trading execution
  - Config: `BACKTEST_STRATEGY_ID`, `LIVE_STRATEGY_ID`

**Market Data:**
- **AKShare** - Chinese financial data API
  - SDK: `akshare>=1.12.0`
  - Auth: None (public API)
  - Usage: Stock sentiment, company events, news, sector data
  - Location: `src/pytrading/utils/akshare_util.py`

**LLM/AI:**
- **OpenAI Compatible API** - AI analysis service
  - SDK: `openai>=1.0.0`
  - Auth: `LLM_API_KEY` env var
  - Config: `LLM_API_BASE_URL`, `LLM_MODEL`, `LLM_TIMEOUT`
  - Location: `src/pytrading/service/llm_service.py`

## Data Storage

**Database:**
- **MySQL** - Primary data store
  - ORM: SQLAlchemy 2.0.41+
  - Client: PyMySQL 1.1.1+
  - Connection: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`
  - Tables: `strategies`, `symbols`, `backtest_tasks`, `backtest_results`, `stock_kline`, `system_config`
  - Location: `src/pytrading/db/mysql.py`

**Cache:**
- **Local file cache** (`gmcache/`) - GM SDK data cache
  - Used by: 掘金量化 SDK for storing historical data

**File Storage:**
- **Local filesystem** - Logs and data
  - Path: `logs/trading.log`
  - Path: `gm_data/`
  - Path: `gmcache/`

## Authentication & Identity

**Trading Platform Auth:**
- 掘金量化 token-based authentication
- Stored in environment variables (not in code)
- Two modes: backtest and live trading

**API Security:**
- CORS configured for `http://localhost:3000` (development)
- No external auth provider detected

## Monitoring & Observability

**Logging:**
- Python `logging` module
- Configured via `src/pytrading/logger.py`
- Log level via `LOG_LEVEL` env var (default: INFO)
- File output: `logs/trading.log`

**Error Tracking:**
- Not detected (no Sentry, Raygun, etc.)

**Metrics:**
- Not detected (no Prometheus, DataDog, etc.)

## CI/CD & Deployment

**Hosting:**
- Self-hosted (not on cloud platforms detected)
- ASGI server: Uvicorn

**CI Pipeline:**
- Not detected (no GitHub Actions, Jenkins, etc.)

## Environment Configuration

**Required env vars:**

| Variable | Description | Example |
|----------|-------------|---------|
| `TRADING_MODE` | backtest or live | `backtest` |
| `BACKTEST_STRATEGY_ID` | Backtest strategy ID | `f981bc35-5313-11f0-901c-00ff136bef06` |
| `BACKTEST_TRADING_TOKEN` | Backtest account token | `2cc0e58f40011fc98b77fdb8ead7c6d007208a59` |
| `LIVE_STRATEGY_ID` | Live strategy ID | `28de0f36-7d4f-11ed-a603-00ffc033e1eb` |
| `LIVE_TRADING_TOKEN` | Live trading account token | `75dddca9-52e8-11ed-a31f-00163e12c161` |
| `SYMBOLS` | Stock symbols (comma-separated) | `SZSE.002459,SZSE.002920` |
| `MYSQL_HOST` | MySQL host | `localhost` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_DATABASE` | Database name | `pytrading` |
| `MYSQL_USERNAME` | Database user | `root` |
| `MYSQL_PASSWORD` | Database password | `***` |
| `LLM_API_KEY` | OpenAI API key | `sk-***` |
| `LLM_API_BASE_URL` | LLM API endpoint | `https://api.openai.com/v1` |
| `LLM_MODEL` | LLM model name | `gpt-4o-mini` |

**Secrets location:**
- `.env` file (local development only)
- Environment variables in deployment

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-04-30*
