# API 合同: 股票关注列表

**功能**: 002-stock-watchlist | **日期**: 2026-03-07
**基础路径**: `/api`

## 端点列表

| 方法 | 路径 | 说明 | 优先级 |
|------|------|------|--------|
| POST | /api/watchlist | 添加关注 | P1 |
| DELETE | /api/watchlist/{id} | 取消关注 | P1 |
| GET | /api/watchlist | 获取关注列表 | P1 |
| GET | /api/watchlist/watched-symbols | 批量查询已关注状态 | P1 |
| POST | /api/watchlist/backtest | 触发批量回测 | P2 |
| PUT | /api/watchlist/{id}/read | 标记关注类型变化已读 | P2 |

---

## POST /api/watchlist

添加股票到关注列表。幂等操作：已存在则返回现有条目。

**请求体**:
```json
{
  "symbol": "SZSE.002459",
  "name": "晶澳科技",
  "strategy_id": 1
}
```

**响应 201**:
```json
{
  "id": 1,
  "symbol": "SZSE.002459",
  "name": "晶澳科技",
  "strategy_id": 1,
  "watch_type": "无状态",
  "created_at": "2026-03-07T10:00:00"
}
```

**响应 200**（已存在）:
```json
{
  "id": 1,
  "symbol": "SZSE.002459",
  "name": "晶澳科技",
  "strategy_id": 1,
  "watch_type": "关注中",
  "message": "该股票已在关注列表中"
}
```

**错误**:
- 400: symbol 或 strategy_id 缺失
- 404: strategy_id 不存在

---

## DELETE /api/watchlist/{id}

取消关注，从列表中移除。

**路径参数**: `id` — WatchlistItem 主键

**响应 200**:
```json
{
  "message": "已取消关注",
  "symbol": "SZSE.002459"
}
```

**错误**:
- 404: 关注条目不存在

---

## GET /api/watchlist

获取全部关注列表，支持排序和关注类型筛选。

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sort_by | string | "created_at" | 排序字段：pnl_ratio, sharp_ratio, win_ratio, max_drawdown, created_at |
| sort_order | string | "desc" | asc / desc |
| watch_type | string | — | 筛选关注类型（可选） |

**响应 200**:
```json
{
  "data": [
    {
      "id": 1,
      "symbol": "SZSE.002459",
      "name": "晶澳科技",
      "strategy_id": 1,
      "strategy_name": "MACD",
      "watch_type": "趋势上涨",
      "previous_watch_type": "关注中",
      "type_changed": true,
      "type_changed_at": "2026-03-07T15:00:00",
      "pnl_ratio": 0.1523,
      "sharp_ratio": 1.2345,
      "max_drawdown": -0.0812,
      "win_ratio": 0.6500,
      "current_price": 12.50,
      "last_backtest_time": "2026-03-07T14:30:00",
      "created_at": "2026-03-05T10:00:00"
    }
  ],
  "total": 15,
  "type_changed_count": 3
}
```

**排序规则**: type_changed=True 的条目始终排在最前面（置顶），其余按 sort_by 排序。

---

## GET /api/watchlist/watched-symbols

批量查询指定股票是否已被关注（用于 BacktestResults/Dashboard 页面显示"已关注"标记）。

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| strategy_id | int | 策略ID |

**响应 200**:
```json
{
  "watched": ["SZSE.002459", "SHSE.600036", "SZSE.002920"]
}
```

---

## POST /api/watchlist/backtest

触发关注列表中所有股票的批量回测。回测进行中禁止重复触发。

**请求体**: 无

**响应 200**:
```json
{
  "task_ids": ["watchlist-abc123", "watchlist-def456"],
  "total_symbols": 15,
  "message": "已开始回测 15 支股票"
}
```

**响应 409**（回测进行中）:
```json
{
  "message": "回测正在进行中，请等待完成",
  "running_task_ids": ["watchlist-abc123"]
}
```

---

## PUT /api/watchlist/{id}/read

标记关注类型变化为已读（消除高亮）。

**路径参数**: `id` — WatchlistItem 主键

**响应 200**:
```json
{
  "id": 1,
  "type_changed": false
}
```

**错误**:
- 404: 关注条目不存在
