# Project: PyTrading

## What This Is

基于 Python + FastAPI + React 的现代化量化交易系统，集成掘金量化平台，提供回测和实盘交易功能。

## Core Value

**脱离掘金 GUI，安全的自动化策略执行** — 策略编写与执行分离，后台运行，可视化管�理。

## Requirements

### Validated

- 一键启动脚本（跨平台：Windows/Linux/Mac）
- 后台服务运行模式，自动任务调度
- 掘金 3.0 集成（回测/实盘）
- 多股票策略并行回测
- MySQL 数据库存储回测结果
- React Web 界面
- FastAPI 自动生成文档
- 热更新开发模式

### Active

(None yet — ship to validate)

### Out of Scope

- 非掘金量化平台支持 — 聚焦掘金生态
- 策略回测以外的功能 — 当前专注回测和交易执行

## Context

- 基于掘金量化3.0 API (gm SDK)
- 后端：FastAPI + SQLAlchemy + Pydantic
- 前端：React (frontend/)
- 数据库：MySQL
- Python 3.11 虚拟环境 (.venv)
- 使用 uv 管理依赖

## Constraints

- **Python >= 3.9** — 兼容旧版 Python
- **掘金账号** — 需要有效的掘金token才能运行
- **MySQL** — 需要MySQL数据库存储结果

## Tech Stack

- **Language**: Python 3.11
- **Framework**: FastAPI
- **Database**: MySQL
- **Frontend**: React
- **SDK**: 掘金量化 (gm)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| uv 作为包管理器 | 现代快速，优于 pip | 已采用 |
| SQLAlchemy ORM | 跨数据库兼容 | 已采用 |
| React 前端 | 现代化 UI | 已采用 |

## Stakeholders

- 量化交易者

---
*Last updated: 2026-05-16 after initialization*
