# 数据模型: 股票关注列表

**功能**: 002-stock-watchlist | **日期**: 2026-03-07

## 新增实体

### WatchlistItem（关注条目）

代表用户关注的一支股票在特定策略下的跟踪记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| symbol | VARCHAR(20) | NOT NULL | 股票代码 |
| name | VARCHAR(100) | | 股票名称 |
| strategy_id | INT | NOT NULL, FK(strategies.id) | 关联策略 |
| watch_type | VARCHAR(20) | NOT NULL, DEFAULT '无状态' | 关注类型 |
| previous_watch_type | VARCHAR(20) | | 上一次关注类型（变化对比） |
| type_changed | BOOLEAN | NOT NULL, DEFAULT FALSE | 关注类型是否发生变化 |
| type_changed_at | DATETIME | | 关注类型变化时间 |
| pnl_ratio | DECIMAL(10,4) | | 最新收益率 |
| sharp_ratio | DECIMAL(10,4) | | 最新夏普比率 |
| max_drawdown | DECIMAL(10,4) | | 最新最大回撤 |
| win_ratio | DECIMAL(6,4) | | 最新胜率 |
| current_price | DECIMAL(10,2) | | 最新价格 |
| last_backtest_task_id | VARCHAR(100) | | 最近回测任务ID |
| last_backtest_time | DATETIME | | 最近回测完成时间 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 关注时间 |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**唯一约束**: `UNIQUE (symbol, strategy_id)` — 同一股票同一策略只能关注一次

**索引**:
- `idx_watch_type (watch_type)` — 按关注类型筛选
- `idx_type_changed (type_changed)` — 快速查找有变化的条目
- `idx_strategy_id (strategy_id)` — 按策略查询

**外键**: `strategy_id → strategies.id`

### WatchType（关注类型枚举）

非数据库实体，Python 枚举类。

| 值 | 中文显示 | 映射来源 | 参与变化检测 |
|----|---------|---------|------------|
| NO_STATE | 无状态 | TrendingType: Unknown, UpDown | 否 |
| WATCHING | 关注中 | TrendingType: Observing | 是 |
| TREND_UP | 趋势上涨 | TrendingType: RisingUp, ZeroAxisUp | 是 |
| TREND_DOWN | 趋势下行 | TrendingType: DeadXDown, FallingDown | 是 |
| TREND_END | 趋势结束 | 清仓信号（trade_records.action = 'close'，最后一条记录） | 是 |

**映射优先级**: 清仓信号（TREND_END）> TrendingType 映射

## 现有实体关系

```
strategies (1) ──── (N) watchlist_items
                         │
                         │ symbol 关联（非外键）
                         │
backtest_results (N) ────┘  通过 (symbol, task_id) 读取指标
                         │
trade_records (N) ───────┘  通过 (symbol, task_id) 检测清仓信号
```

**数据流**:
1. 用户关注 → 写入 watchlist_items（symbol + strategy_id）
2. 触发回测 → 创建 backtest_tasks，执行后写入 backtest_results + trade_records
3. 回测完成 → WatchlistService 从 backtest_results 读取指标，从 trade_records 检测清仓信号
4. 更新 watchlist_items 的指标快照 + watch_type + 变化检测

## 验证规则

| 规则 | 说明 |
|------|------|
| symbol 非空 | 必须关联有效股票代码 |
| strategy_id 有效 | 必须指向已存在的 strategies 记录 |
| watch_type 枚举约束 | 仅接受 5 种有效值 |
| pnl_ratio 精度 | DECIMAL(10,4) 保证小数点后 4 位精度 |
| 唯一性 | (symbol, strategy_id) 不可重复 |
| 关注类型变化 | "无状态"不触发变化检测 |
