# Technology Stack

**Analysis Date:** 2026-04-30

## Languages

**Primary:**
- Python 3.11 - Backend, API, data processing, trading algorithms
- TypeScript 4.9.5 - Frontend React application

**Secondary:**
- JavaScript (ES6) - Frontend React application

## Runtime

**Python Environment:**
- uv (package manager)
- Virtual environment: `.venv/`
- Python version requirement: >=3.9

**Node Environment:**
- npm (package manager)
- Node.js (implied by react-scripts)

## Frameworks

**Backend:**
- FastAPI 0.104.1+ - Web API framework
- Uvicorn 0.24.0+ - ASGI server
- Pydantic 2.5.0+ - Data validation

**Frontend:**
- React 18.2.0 - UI framework
- Ant Design 5.12.8+ - UI component library
- React Router DOM 6.20.1+ - Routing
- Chart.js 4.4.0+ / Lightweight Charts 5.1.0+ - Financial charting

**Trading:**
- gm (掘金量化) 3.0.177+ - Quantitative trading API (China markets)

**Data:**
- akshare 1.12.0+ - Financial data API (China markets)
- pandas - Data manipulation
- TA-Lib - Technical analysis

## Key Dependencies

**Critical:**
- `gm>=3.0.177` - 掘金量化SDK for backtesting and live trading
- `akshare>=1.12.0` - A-share market data (stock, futures, options)
- `fastapi>=0.104.1` - Backend API framework
- `pydantic>=2.5.0` - Data serialization and validation
- `sqlalchemy>=2.0.41` - ORM for database operations
- `openai>=1.0.0` - LLM API integration

**Data Processing:**
- `pandas` - DataFrame operations
- `ta-lib` - Technical analysis library
- `numpy` - Numerical computing

**Frontend:**
- `antd>=5.12.6` - Ant Design React components
- `axios>=1.6.2` - HTTP client
- `chart.js>=4.4.0` - Charting library
- `lightweight-charts>=5.1.0` - TradingView-style charts
- `react>=18.2.0` - React framework

**Database:**
- `pymysql>=1.1.1` - MySQL client
- `sqlalchemy>=2.0.41` - ORM

**Utilities:**
- `dotenv>=0.9.9` - Environment variable loading
- `psutil>=7.0.0` - System utilities

## Testing

**Backend:**
- pytest 8.0+
- pytest-cov 4.0+
- pytest-mock 3.0+

**Frontend:**
- Jest (via react-scripts)
- Testing Library (jest-dom, react, user-event)

## Configuration

**Environment:**
- `.env` file with environment-specific settings
- `.env.example` template for reference
- `load_dotenv()` for configuration loading

**Key configs in `src/pytrading/config/settings.py`:**
- Trading mode (backtest/live)
- Database credentials
- API tokens (掘金量化)
- Symbol lists
- Time ranges

**Frontend proxy:**
- `package.json`: `"proxy": "http://localhost:8000"` - API proxy to FastAPI backend

**TypeScript:**
- `frontend/tsconfig.json` - Target ES5, React JSX

## Project Structure

**Backend (`src/pytrading/`):**
- `api/` - FastAPI endpoints
- `service/` - Business logic services
- `db/` - Database models and client
- `model/` - Data models
- `config/` - Configuration management
- `utils/` - Utility functions
- `strategy/` - Trading strategies

**Frontend (`frontend/`):**
- `src/` - React source code
- `public/` - Static assets
- `build/` - Production build

## Platform Requirements

**Development:**
- Python 3.9+
- Node.js 16+ (for react-scripts)
- MySQL 5.7+ (for database)

**Production:**
- ASGI server (Uvicorn) for FastAPI
- Static file hosting for React build
- MySQL database server

---

*Stack analysis: 2026-04-30*
