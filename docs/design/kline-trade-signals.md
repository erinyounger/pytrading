# K线图买卖信号标注功能设计

## 概述

在K线图上标注策略回测过程中的4种交易信号（建/买/卖/平），用于直观分析策略的交易逻辑和时机选择。

**状态**: 已实现 | **完成日期**: 2026-03-07

## 功能说明

### 信号类型

| 信号 | 含义 | 图标 | 位置 | 颜色 | 示例文本 |
|---|---|---|---|---|---|
| 建 (build) | 新趋势开始，买入1手启动跟踪 | arrowUp | belowBar | #e74c3c 红 | "建" |
| 买 (buy) | 加仓信号，按比例加仓 | arrowUp | belowBar | #e74c3c 红 | "买90%" |
| 卖 (sell) | 减仓信号，按比例卖出 | arrowDown | aboveBar | #2ecc71 绿 | "卖50%" |
| 平 (close) | 趋势结束，清仓 | arrowDown | aboveBar | #1890ff 蓝 | "平" |

### MACD策略信号映射

| 策略条件 | action | signal_type | 说明 |
|---|---|---|---|
| 0轴下第二金叉 | build | `second_golden_x_under_zero` | 趋势起点，买100股观察 |
| 上穿零轴线 | buy | `up_cross_zero_axis` | 趋势确认，加仓至90% |
| 连续上涨3天 | buy | `rising_3day` | 强势追加15% |
| 零轴上金叉 | buy | `above_zero_golden_x` | 再次上升，追加30% |
| 零轴上第一死叉 | sell | `first_dead_x` | 减仓50% |
| 快线连降2天 | sell | `declining_2day` | 减仓15% |
| 零轴上第二死叉 | close | `second_dead_x` | 清仓 |
| 下穿零轴线 | close | `down_cross_zero_axis` | 清仓 |
| 死叉+零轴 | close | `dead_x_zero_axis` | 清仓 |
| ATR动态止损 | close | `atr_stop_loss` | 触发ATR止损清仓 |
| 固定回撤止损 | close | `fixed_drawdown_stop` | 回撤超阈值清仓 |

## 架构设计

### 数据流

```
策略执行(macd_strategy)
  → Order.with_signal(action, label, type)
    → on_bar() 检测信号元数据
      → TradeRecordService.save_trade_record()
        → trade_records 表

前端打开K线图
  → apiService.getTradeRecords(task_id, symbol)
    → GET /api/trade-records
      → StockChart createSeriesMarkers()
        → K线图箭头标记
```

### 数据库

**表**: `trade_records`

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT PK | 自增主键 |
| task_id | VARCHAR(100) | 回测任务ID，索引 |
| symbol | VARCHAR(32) | 股票代码 |
| action | VARCHAR(16) | 交易动作: build/buy/sell/close |
| target_percent | FLOAT | 操作后目标持仓比例 |
| price | DECIMAL(10,2) | 当前价格 |
| volume | INT | 交易数量（build时为100） |
| signal_type | VARCHAR(64) | 信号类型描述 |
| bar_time | DATETIME | K线时间 |
| created_at | DATETIME | 创建时间 |

**唯一约束**: `(task_id, symbol, bar_time, action)`

### API

```
GET /api/trade-records?task_id={task_id}&symbol={symbol}
```

响应:
```json
{
  "data": [
    {
      "action": "build",
      "label": "建",
      "target_percent": null,
      "price": 12.50,
      "volume": 100,
      "signal_type": "second_golden_x_under_zero",
      "bar_time": "2025-03-15"
    },
    {
      "action": "buy",
      "label": "买90%",
      "target_percent": 0.9,
      "price": 13.20,
      "volume": null,
      "signal_type": "up_cross_zero_axis",
      "bar_time": "2025-04-01"
    }
  ]
}
```

`label` 字段由后端根据 action 和 target_percent 自动生成。

## 涉及文件

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/pytrading/db/mysql.py` | 修改 | 新增 TradeRecord 模型 |
| `src/pytrading/service/__init__.py` | 新建 | 包初始化 |
| `src/pytrading/service/trade_record_service.py` | 新建 | save/get 交易记录 |
| `src/pytrading/config/order_enum.py` | 修改 | Order 增加 signal_action/signal_label/signal_type 字段和 with_signal() 链式方法 |
| `src/pytrading/strategy/strategy_macd.py` | 修改 | 11个信号点附加 .with_signal() 元数据 |
| `src/pytrading/run/run_strategy.py` | 修改 | on_bar() 中检测信号并调用 TradeRecordService |
| `src/pytrading/api/main.py` | 修改 | 新增 GET /api/trade-records 接口 |
| `sql/backtest_management_schema.sql` | 修改 | 新增 trade_records 建表 DDL |
| `frontend/src/types/index.ts` | 修改 | 新增 TradeRecord 接口 |
| `frontend/src/services/api.ts` | 修改 | 新增 getTradeRecords 方法 |
| `frontend/src/components/StockChart.tsx` | 修改 | 接收 tradeRecords prop，使用 createSeriesMarkers() 渲染 |
| `frontend/src/pages/BacktestResults.tsx` | 修改 | 打开K线图时获取交易记录并传递 |
| `frontend/src/pages/Dashboard.tsx` | 修改 | 打开K线图时获取交易记录并传递 |

## 技术要点

### Order.with_signal() 链式调用

```python
# 策略中使用
return OrderAction.order_volume(OrderSide_Buy, trade_n=100).with_signal('build', '建', 'second_golden_x_under_zero')
return OrderAction.order_target_percent(OrderSide_Buy, trade_n=0.9).with_signal('buy', '买90%', 'up_cross_zero_axis')
return OrderAction.order_close_all().with_signal('close', '平', 'atr_stop_loss')
```

### lightweight-charts v5 标记 API

v5 不再支持 `series.setMarkers()`，需使用独立的 `createSeriesMarkers()`:

```typescript
import { createSeriesMarkers } from 'lightweight-charts';

const markersPlugin = createSeriesMarkers(candlestickSeries, markers);
// 更新: markersPlugin.setMarkers(newMarkers)
// 清除: markersPlugin.detach()
```

### 前端加载时序

K线图弹窗打开时，并行获取K线数据和交易记录:

```typescript
const response = await apiService.getKlineData(symbol);
setKlineData(response.data || []);
if (record.task_id) {
  const trResp = await apiService.getTradeRecords(record.task_id, symbol);
  setTradeRecords(trResp.data || []);
}
```

StockChart 组件在 `useEffect([data, tradeRecords])` 中渲染标记。
