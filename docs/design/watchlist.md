# 股票关注列表设计文档

**功能**: 002-stock-watchlist
**创建时间**: 2026-03-07
**更新时间**: 2026-03-08

## 概述

股票关注列表是一个**标记功能**——从已有的回测结果中标记感兴趣的股票进行重点跟踪。不创建、不触发、不改变现有的回测任务创建和下发逻辑。

收益率、夏普比率等指标直接从 `backtest_results` 表通过 JOIN 读取，不在 `watchlist_items` 表中冗余保存。

## 用户故事

1. **US1 (P1)**: 从回测结果关注股票 - 用户可以在回测结果页面和仪表盘推荐列表中将股票加入关注列表
2. **US2 (P1)**: 查看关注列表及独立指标 - 独立的关注列表页面展示所有关注股票的最新回测指标（通过 JOIN backtest_results 读取）
3. **US3 (P2)**: 关注列表指标与回测结果联动 - 当回测管理完成新回测后，关注列表自动展示最新指标
4. **US4 (P2)**: 趋势状态变化高亮提醒 - 关注类型变化时高亮显示

## 核心设计原则

- **标记功能**: 关注列表仅标记股票，不创建独立的回测任务
- **指标复用**: 收益率等指标从 `backtest_results` 表 JOIN 读取，不冗余保存
- **回测联动**: 回测任务完成后，通过 `update_metrics` 更新 `last_backtest_task_id` 和 `watch_type`
- **幂等添加**: 同一股票+策略组合只能添加一次

## 数据模型

### WatchlistItem

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| symbol | VARCHAR(20) | 股票代码 |
| name | VARCHAR(100) | 股票名称 |
| strategy_id | INT | 关联策略ID |
| watch_type | VARCHAR(20) | 关注类型 |
| previous_watch_type | VARCHAR(20) | 上一次关注类型 |
| type_changed | BOOLEAN | 关注类型是否变化 |
| type_changed_at | DATETIME | 变化时间 |
| last_backtest_task_id | VARCHAR(100) | 最近回测任务ID（用于 JOIN backtest_results） |
| created_at | DATETIME | 关注时间 |
| updated_at | DATETIME | 更新时间 |

### 关注类型 (WatchType)

| 值 | 中文 | 映射来源 |
|----|------|----------|
| NO_STATE | 无状态 | TrendingType: Unknown, UpDown |
| WATCHING | 关注中 | TrendingType: Observing |
| TREND_UP | 趋势上涨 | TrendingType: RisingUp, ZeroAxisUp |
| TREND_DOWN | 趋势下行 | TrendingType: DeadXDown, FallingDown |
| TREND_END | 趋势结束 | 清仓信号 (trade_records.action='close') |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/watchlist | 添加关注 |
| DELETE | /api/watchlist/{id} | 取消关注 |
| GET | /api/watchlist | 获取关注列表（JOIN backtest_results 读取指标） |
| GET | /api/watchlist/watched-symbols | 批量查询已关注状态 |
| PUT | /api/watchlist/{id}/read | 标记已读 |

## 指标数据流

```
用户关注股票 → watchlist_items 记录 (symbol, strategy_id, watch_type)
                                         ↓
回测管理完成回测 → run_backtest_task 完成后检查 watchlist_items
                   → 调用 update_metrics 更新 last_backtest_task_id 和 watch_type
                                         ↓
查看关注列表 → GET /api/watchlist
              → WatchlistService.get_watchlist()
              → 通过 last_backtest_task_id + symbol JOIN backtest_results
              → 返回 pnl_ratio, sharp_ratio, max_drawdown, win_ratio 等指标
```

## 涉及文件

### 后端
- `src/pytrading/config/watch_type.py` - WatchType 枚举和映射函数
- `src/pytrading/db/mysql.py` - WatchlistItem 模型
- `src/pytrading/service/watchlist_service.py` - WatchlistService 服务层
- `src/pytrading/api/main.py` - REST API 端点
- `src/pytrading/py_trading.py` - 回测完成后更新关注列表 hook
- `sql/watchlist_schema.sql` - 数据库建表 SQL

### 前端
- `frontend/src/types/index.ts` - TypeScript 类型定义
- `frontend/src/services/api.ts` - API 调用方法
- `frontend/src/pages/Watchlist.tsx` - 关注列表页面
- `frontend/src/pages/BacktestResults.tsx` - 回测结果页面（添加关注按钮）
- `frontend/src/pages/Dashboard.tsx` - 仪表盘页面（添加关注按钮）
- `frontend/src/App.tsx` - 路由和侧边栏

## 依赖项

- MySQL 数据库
- FastAPI 后端
- React + Ant Design 前端
- lightweight-charts 图表库
