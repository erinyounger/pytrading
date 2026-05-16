---
title: "Coding Conventions"
readMode: required
priority: high
category: coding
keywords:
  - style
  - naming
  - import
  - pattern
  - convention
  - formatting
---

# Coding Conventions

Auto-generated from project analysis. Update manually as patterns evolve.

## Formatting

- **Indentation**: 4 spaces (Python standard)
- **Line length**: 未配置 (默认 120)
- **Python 编码声明**: `# -*- coding:utf-8 -*-`

## Naming

- **变量/函数**: snake_case (e.g., `backtest_result`, `get_instruments`)
- **类/类型**: PascalCase (e.g., `BackTest`, `PyTrading`, `DBLogHandler`)
- **常量**: UPPER_SNAKE_CASE (e.g., `TOKEN`, `MAX_DRAWDOWN`)
- **私有变量**: `_leading_underscore`
- **文件**: snake_case (e.g., `back_test.py`, `talib_util.py`)

## Imports

- **Style**: Named imports + relative imports
- **Python 路径**: 使用 `sys.path.insert` 添加项目根目录
- **Order**: built-in → external → internal relative imports
- **掘金 SDK**: `from gm.api import set_token, get_constituents, history, get_instruments`

## Patterns

- **Pydantic**: `BaseModel` for request/response schemas
- **FastAPI**: `@asynccontextmanager` for lifespan, `BackgroundTasks` for async tasks
- **SQLAlchemy**: ORM with `MySQLClient`, declarative models
- **日志**: `logger.py` 提供的 `get_logger()` with task_id/symbol context
- **配置**: `config/settings.py` 集中管理配置

## Entries

