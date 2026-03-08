# 研究文档: 股票关注列表

**功能**: 002-stock-watchlist | **日期**: 2026-03-07

## 研究任务与决策

### R-001: 关注类型（WatchType）映射机制

**问题**: 如何从内部 TrendingType（7 种）+ 清仓信号映射到用户端关注类型（5 种）？

**决策**: 创建独立的 `WatchType` 枚举类和纯函数映射器

**理由**:
- 关注类型是面向用户的展示概念，与内部策略 TrendingType 解耦
- 纯函数映射（无副作用）保证可测试性和可复现性
- "趋势结束"依赖清仓信号（trade_records 中 action="close"），不是简单的 TrendingType 映射

**替代方案**:
- 直接复用 TrendingType 枚举 → 拒绝：7 种状态对用户过于复杂，且无法表达"趋势结束"
- 在 TrendingType 中新增状态 → 拒绝：修改策略核心枚举影响范围过大

**映射规则**:
```
TrendingType.Unknown, TrendingType.UpDown          → WatchType.NO_STATE
TrendingType.Observing                              → WatchType.WATCHING
TrendingType.RisingUp, TrendingType.ZeroAxisUp      → WatchType.TREND_UP
TrendingType.DeadXDown, TrendingType.FallingDown    → WatchType.TREND_DOWN
(has_close_signal=True)                              → WatchType.TREND_END
```

清仓信号检测：查询 `trade_records` 表中同一 task_id + symbol 的最后一条记录，如果 action="close" 则判定为"趋势结束"。注意：清仓信号优先级高于 TrendingType 映射。

---

### R-002: 批量回测触发机制

**问题**: "立即回测"功能如何复用现有回测管道？

**决策**: 创建新的 BacktestTask，复用 PyTrading.run_backtest_task() 管道

**理由**:
- 现有管道已处理进度追踪、日志记录、结果保存、错误处理
- 避免重复实现回测执行逻辑
- BacktestTask 的状态机（pending→running→completed/failed）可直接用于"回测中禁用按钮"需求

**实现方案**:
1. WatchlistService.trigger_backtest() 收集所有关注条目的 symbol 列表
2. 按 strategy_id 分组（同一策略的股票合并为一个 BacktestTask）
3. 创建 BacktestTask（mode=single, symbols=JSON 数组），task_id 前缀 "watchlist-"
4. 现有 task_scheduler 自动拉取并执行
5. 回测完成后通过 WatchlistService.update_metrics_from_task() 更新关注条目的指标快照

**替代方案**:
- 直接调用 PyTrading 类 → 拒绝：绕过任务管道，无法追踪进度
- 每支股票创建独立 Task → 拒绝：50 支股票产生 50 个 Task，管理成本过高

**时间范围**:
- 关注条目仅保存 strategy_id，回测时间范围使用系统默认配置的回测期（.env 中 BACKTEST_START_TIME / BACKTEST_END_TIME 或动态计算最近 N 交易日）

---

### R-003: 关注类型变化检测

**问题**: 如何检测并记录关注类型的变化？

**决策**: 在 WatchlistItem 上存储 previous_watch_type + type_changed 标志位

**理由**:
- 简单的字段比较，无需额外的历史表
- type_changed 布尔标志用于前端高亮排序
- "已读"操作仅需将 type_changed 置为 False

**实现方案**:
1. 每次回测完成后，WatchlistService.update_metrics() 计算新的 watch_type
2. 若新 watch_type ≠ 当前 watch_type 且新类型非"无状态"：
   - previous_watch_type = 当前 watch_type
   - watch_type = 新 watch_type
   - type_changed = True
   - type_changed_at = now()
3. 若新 watch_type = "无状态"，不触发变化检测（规范要求"无状态"不参与）
4. 用户点击"已读"或查看详情后，type_changed = False

**替代方案**:
- 创建 watchlist_history 表记录所有变化 → 拒绝：MVP 阶段过度设计
- 前端本地计算变化 → 拒绝：刷新页面后丢失状态

---

### R-004: 关注/取消关注的唯一性约束

**问题**: 如何防止重复关注？同一股票不同策略如何处理？

**决策**: 使用 (symbol, strategy_id) 联合唯一约束

**理由**:
- 规范明确"同一支股票在不同策略下都被关注时，作为独立的关注条目分别展示"
- 数据库层约束确保一致性
- 关注操作为幂等：已存在则返回现有条目

**替代方案**:
- 仅按 symbol 约束 → 拒绝：违反规范多策略要求
- 无约束 + 应用层去重 → 拒绝：竞态条件风险

---

### R-005: 前端路由与导航集成

**问题**: 如何将关注列表页面集成到现有导航？

**决策**: 在侧边栏新增一级菜单项，路由 `/watchlist`

**理由**:
- 规范要求 FR-003 "侧边栏导航的一级菜单项"
- 现有 App.tsx 已有 4 个菜单项，新增第 5 个
- 位置：插入在"回测结果"之后、"回测管理"之前（按使用频率排序）

**现有菜单项顺序**:
1. `/` - 主仪表板
2. `/backtest` - 回测结果查看
3. **`/watchlist` - 关注列表（新增）**
4. `/backtest-manager` - 任务创建与管理
5. `/settings` - 系统设置

---

### R-006: 回测结果页面"关注"按钮的数据来源

**问题**: BacktestResults 页面如何知道哪些股票已被关注？

**决策**: 页面加载时批量查询已关注列表，本地维护 Set 进行快速查找

**理由**:
- 避免每行单独查询 API（N+1 问题）
- 关注列表通常 < 50 项，全量加载无性能问题
- 前端 Set<string> 用 `${symbol}-${strategy_id}` 作为 key，O(1) 查找

**API**: `GET /api/watchlist/check-batch?symbols=X,Y,Z&strategy_id=1`
→ 返回已关注的 symbol 列表

**替代方案**:
- 每页加载时查询 → 可行但效率低
- WebSocket 实时推送 → 过度设计
