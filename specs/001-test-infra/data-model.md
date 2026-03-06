# 数据模型: 测试基础设施搭建

**日期**: 2026-03-07
**分支**: `001-test-infra`

## 概述

本功能不引入新的业务数据模型. 以下记录测试基础设施涉及的关键数据结构和夹具(fixture)设计.

## 测试夹具数据结构

### 1. 数据库测试会话

```
TestDatabaseSession
├── engine: SQLite 内存引擎 (sqlite:///:memory:)
├── session: SQLAlchemy Session (事务作用域)
├── tables: 从 Base.metadata 创建的全部 ORM 表
└── lifecycle: 每个测试函数自动创建/回滚/销毁
```

**行为**: 每个测试函数获得独立的数据库会话, 测试结束后自动回滚, 无需手动清理.

### 2. Mock Context (策略测试)

```
MockStrategyContext
├── data() -> DataFrame           # 返回预定义 K 线数据
├── order_controller
│   ├── account_positions -> []   # 当前持仓列表
│   ├── account_cash -> float     # 可用资金
│   └── order_volume() -> Order   # 下单方法(捕获调用)
├── account() -> dict             # 账户信息
└── symbol -> str                 # 当前标的代码
```

**行为**: 模拟掘金 SDK 的 Context 对象, 仅实现策略逻辑依赖的接口子集.

### 3. 市场行情数据集

```
MarketDataFixtures
├── bullish_trend      # 上涨趋势: 30 根 K 线, 价格从 10.0 → 15.0
│   ├── open, high, low, close, volume
│   └── macd, macd_signal, macd_hist (预计算)
├── bearish_trend      # 下跌趋势: 30 根 K 线, 价格从 15.0 → 10.0
│   └── (同上结构)
├── sideways_range     # 震荡盘整: 30 根 K 线, 价格在 12.0 ± 1.0
│   └── (同上结构)
└── golden_cross_point # 金叉信号点: MACD 从负转正的精确数据
    └── (同上结构)
```

**行为**: 提供确定性的合成 K 线数据, 每次运行结果完全一致.

### 4. Mock API 响应 (前端)

```
MockApiResponses
├── backtestResults    # 回测结果列表 (PaginatedApiResponse<BacktestResult[]>)
├── backtestTasks      # 任务列表 (TaskStatus[])
├── klineData          # K 线数据 (StockKline[])
├── tradeRecords       # 交易记录 (TradeRecord[])
├── healthCheck        # 健康检查 ({ status: 'ok' })
└── errorResponse      # 错误响应 ({ error: string, status: number })
```

**行为**: 基于 `frontend/src/types/index.ts` 中定义的接口生成符合类型的 mock 数据.

## 实体关系

```
测试配置文件 (pyproject.toml / jest config)
    │
    ├── 后端 conftest.py
    │   ├── db_session fixture ──→ TestDatabaseSession
    │   ├── mock_context fixture ──→ MockStrategyContext
    │   └── market_data fixture ──→ MarketDataFixtures
    │
    └── 前端 __mocks__/
        ├── api.ts mock ──→ MockApiResponses
        └── lightweight-charts mock ──→ MockChart 对象
```
