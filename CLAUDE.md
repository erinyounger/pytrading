# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

PyTrading 是一个基于 Python 构建的量化交易系统，集成了掘金量化平台。系统支持回测和实盘交易模式，具备并行执行能力和灵活的数据库存储选项。

## 核心架构

### 主要组件

- **PyTrading**: 主要编排类 (`src/pytrading/py_trading.py`)，管理策略执行和并行处理
- **策略框架**: 基础策略类，包含 MACD、布林带和海龟策略实现
- **订单管理**: 订单控制器处理交易执行和仓位管理
- **数据持久化**: 支持 MySQL 的灵活存储系统
- **配置管理**: 基于环境变量的配置系统，使用 `.env` 文件

### 执行流程

1. **入口点**: `run.py` 初始化 PyTrading 并开始策略执行
2. **策略编排**: PyTrading 获取股票列表并为每只股票生成并行进程
3. **单独策略执行**: 每个进程运行 `src/pytrading/run/run_strategy.py` 并传入特定参数
4. **策略逻辑**: 策略实例（MACD/布林带/海龟）生成交易信号
5. **订单执行**: OrderController 通过掘金 API 处理买卖订单
6. **结果存储**: BackTest 模型将性能指标保存到配置的数据库

### 关键文件

- `src/pytrading/config/settings.py`: 基于环境变量的配置管理
- `src/pytrading/run/run_strategy.py`: 单个策略执行入口点，包含命令行参数解析
- `src/pytrading/strategy/base.py`: 所有策略必须实现的基础策略接口
- `src/pytrading/model/back_test.py`: 回测结果数据模型，包含数据库持久化

## 开发命令

### 运行系统
```bash
# 使用默认 MACD 策略运行交易系统
python run.py

# 在单个股票上测试特定策略
python src/pytrading/run/run_strategy.py --symbol=SZSE.000625 --start_time="2024-01-01 09:00:00" --end_time="2025-06-30 15:00:00" --strategy_name=MACD_STRATEGY

# 测试数据库连接
python test/test_mysql.py
```

### 环境配置
```bash
# 安装依赖
uv sync  # 推荐：使用 pyproject.toml 进行依赖管理

# 复制环境配置模板并配置
cp .env.example .env
# 编辑 .env 文件，填入掘金账户信息和数据库设置
```

### 依赖管理
```bash
# 查看已安装的依赖
uv tree

# 添加新依赖
uv add package_name

# 移除依赖
uv remove package_name
```

## 配置说明

### 必需的环境变量 (.env 文件)

**掘金量化平台设置:**
- `BACKTEST_STRATEGY_ID`: 回测模式策略 ID
- `LIVE_STRATEGY_ID`: 实盘交易模式策略 ID  
- `BACKTEST_TRADING_TOKEN`: 回测 API 令牌
- `LIVE_TRADING_TOKEN`: 实盘交易 API 令牌
- `TRADING_MODE`: "backtest" 或 "live"

**数据库配置:**
- `SAVE_DB`: 设置为 "true" 启用数据库持久化
- `DB_TYPE`: "mysql"
- MySQL 配置: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`

**交易参数:**
- `SYMBOLS`: 逗号分隔的股票代码列表（可选，默认为上证50成分股）

### 策略类型
- `MACD_STRATEGY`: MACD 趋势跟踪策略，基于 ATR 的仓位管理
- `BOLL_STRATEGY`: 布林带均值回归策略
- `TURTLE_STRATEGY`: 海龟交易突破策略

## 数据库架构

### 回测结果表 (MySQL)
- 性能指标: pnl_ratio（收益率）, sharp_ratio（夏普比率）, max_drawdown（最大回撤）, risk_ratio（风险比率）
- 交易统计: open_count（开仓次数）, close_count（平仓次数）, win_count（盈利次数）, lose_count（亏损次数）, win_ratio（胜率）
- 元数据: symbol（股票代码）, name（股票名称）, trending_type（趋势类型）, 回测时间范围
- 唯一约束: (symbol, backtest_start_time, backtest_end_time)

## 主要依赖

- **gm**: 掘金量化 Python SDK (>= 3.0.177)
- **ta-lib**: 技术分析库（本地 wheel 包在 bin/ 目录）
- **sqlalchemy**: MySQL 数据库 ORM

- **pymysql**: MySQL 数据库连接器

## 重要说明

- 系统在回测多个股票时使用并行处理
- 实盘交易模式为安全考虑限制为单线程执行
- 所有策略继承自 StrategyBase 并实现 setup() 和 run() 方法
- 数据库存储是可选的，由 SAVE_DB 环境变量控制
- 日志配置保存到 `logs/trading.log`，支持可配置的日志级别

## 系统架构细节

### 并行执行机制
- **回测模式**: 使用 ThreadPool 并行执行多个股票的策略，每个股票在独立进程中运行
- **实盘模式**: 为安全考虑采用单线程执行，避免并发交易风险
- **进程通信**: 通过命令行参数传递股票代码、时间范围和策略类型

### 策略执行流程
1. **初始化阶段**: `init(context)` 在 `run_strategy.py:32` 中设置订单控制器和策略实例
2. **数据处理**: `on_bar(context, bars)` 在 `run_strategy.py:45` 中处理每个K线数据
3. **订单执行**: OrderController 负责买卖订单的实际执行
4. **结果保存**: `on_backtest_finished()` 在 `run_strategy.py:85` 中保存回测结果

### 数据库存储架构
- **工厂模式**: `back_test_saver_factory.py` 根据配置选择 MySQL 存储
- **数据模型**: `BackTest` 类包含所有回测性能指标和元数据
- **唯一约束**: 基于 (symbol, backtest_start_time, backtest_end_time) 避免重复数据