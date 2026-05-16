---
title: "Architecture Constraints"
readMode: required
priority: high
category: arch
keywords:
  - architecture
  - module
  - layer
  - boundary
  - dependency
  - structure
---

# Architecture Constraints

Auto-generated from project structure. Update manually as architecture evolves.

## Module Structure

**Type**: 单体应用 (FastAPI 后端 + React 前端)

**Key Modules**:
- `api/` - FastAPI 路由和 Web 服务入口
- `config/` - 配置管理 (settings.py)
- `controller/` - 业务控制器
- `db/` - 数据库客户端和 SQLAlchemy 模型
- `model/` - 数据模型 (BackTest 等)
- `schemas/` - Pydantic schemas
- `service/` - 业务服务层
- `strategy/` - 交易策略实现
- `utils/` - 工具函数 (talib_util, akshare_util)
- `run/` - 独立运行脚本

## Layer Boundaries

```
API (FastAPI) → Controller → Service → Model/DB
                     ↓
              PyTrading (交易执行)
                     ↓
              掘金量化 SDK (gm.api)
```

## Dependency Rules

- `api/main.py` 依赖所有模块 (作为入口点)
- `py_trading.py` 是核心交易引擎
- `db/` 提供数据库抽象
- `utils/` 提供技术分析工具 (TA-Lib, AkShare)

## Technology Constraints

- **Runtime**: Python >= 3.9
- **Framework**: FastAPI + SQLAlchemy + Pydantic
- **数据库**: MySQL (pymysql 驱动)
- **外部 SDK**: 掘金量化 (gm), AkShare, TA-Lib
- **前端**: React 18 + TypeScript + Ant Design 5

## Entries

