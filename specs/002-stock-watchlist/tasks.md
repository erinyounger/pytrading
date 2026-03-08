---
description: "股票关注列表功能实现任务列表"
---

# 任务: 股票关注列表

**输入**: 来自 `/specs/002-stock-watchlist/` 的设计文档
**前置条件**: plan.md(必需), spec.md(用户故事必需), research.md, data-model.md, contracts/

**测试**: 以下任务包含后端 pytest 和前端 Jest 测试任务

**组织结构**: 任务按用户故事分组, 以便每个故事能够独立实施和测试.

**核心设计原则**: 关注列表是一个**标记功能**——从已有的回测结果中标记感兴趣的股票重点跟踪。**不创建、不触发、不改变**现有的回测任务创建和下发逻辑。收益率、胜率等指标直接从 backtest_results 表 JOIN 读取，不在 watchlist_items 表中冗余保存。

## 格式: `[ID] [P?] [Story] 描述`
- **[P]**: 可以并行运行(不同文件, 无依赖关系)
- **[Story]**: 此任务属于哪个用户故事(例如: US1, US2, US3, US4)
- 在描述中包含确切的文件路径

---

## 阶段 1: 设置(共享基础设施)

**目的**: 数据库表和基础模型

- [x] T001 创建 sql/watchlist_schema.sql 建表脚本（watchlist_items 表，仅包含标记字段：symbol, name, strategy_id, watch_type, previous_watch_type, type_changed, type_changed_at, last_backtest_task_id, created_at, updated_at；不包含 pnl_ratio 等冗余指标字段）
- [x] T002 执行 sql/watchlist_schema.sql 创建数据库表（或通过 SQLAlchemy create_tables 自动创建）

---

## 阶段 2: 基础(阻塞前置条件)

**目的**: 在任何用户故事可以实施之前必须完成的核心基础设施

**⚠️ 关键**: 在此阶段完成之前, 无法开始任何用户故事工作

- [x] T003 [P] 在 src/pytrading/config/watch_type.py 中创建 WatchType 枚举（NO_STATE/WATCHING/TREND_UP/TREND_DOWN/TREND_END）和 from_trending_type 映射函数、participates_in_change_detection 方法
- [x] T004 [P] 在 src/pytrading/db/mysql.py 中新增 WatchlistItem 模型（仅标记字段：id, symbol, name, strategy_id, watch_type, previous_watch_type, type_changed, type_changed_at, last_backtest_task_id, created_at, updated_at；唯一约束 uk_symbol_strategy；索引 idx_watch_type, idx_type_changed, idx_strategy_id）
- [x] T005 在 src/pytrading/service/watchlist_service.py 中实现 WatchlistService 类：
  - CRUD: add_watch（幂等）、remove_watch、get_watchlist_by_symbols
  - 查询: get_watchlist（通过 last_backtest_task_id + symbol JOIN backtest_results 表读取指标，支持排序/筛选）
  - 指标不保存到 watchlist_items，仅在查询时实时 JOIN
- [x] T006 在 src/pytrading/api/main.py 中新增 REST 端点：
  - POST /api/watchlist — 添加关注
  - DELETE /api/watchlist/{id} — 取消关注
  - GET /api/watchlist — 获取关注列表（JOIN backtest_results 读取指标）
  - GET /api/watchlist/watched-symbols — 批量查询已关注状态
  - PUT /api/watchlist/{id}/read — 标记已读

**检查点**: 基础就绪 - 现在可以开始并行实施用户故事

---

## 阶段 3: 用户故事 1 - 从回测结果关注股票 (优先级: P1)🎯 MVP

**目标**: 用户可以从回测结果页面和仪表盘推荐列表中将股票加入关注列表，并显示"已关注"标记

**独立测试**: 在 BacktestResults 页面点击"关注"按钮，验证：1) 股票出现在关注列表；2) 按钮变为"已关注"

### 用户故事 1 的测试

- [x] T007 [P] [US1] 在 tests/unit/test_watchlist_service.py 中测试 WatchlistItem 模型的 CRUD（创建、默认值、唯一约束、不同策略）和 last_backtest_task_id 关联
- [x] T008 [P] [US1] 在 tests/integration/test_watchlist_api.py 中测试 POST /api/watchlist 和 DELETE /api/watchlist/{id} 端点（包括幂等、参数校验、404）

### 用户故事 1 的实施

- [x] T009 [P] [US1] 在 frontend/src/types/index.ts 中新增 WatchlistItem 接口（含 pnl_ratio 等从 backtest_results JOIN 而来的展示字段）
- [x] T010 [P] [US1] 在 frontend/src/services/api.ts 中新增 addWatch, removeWatch, getWatchedSymbols, getWatchlist, markWatchAsRead 方法
- [x] T011 [US1] 在 frontend/src/pages/BacktestResults.tsx 中添加"关注"按钮：页面加载时调用 getWatchedSymbols 判断已关注状态，点击后调用 addWatch（使用回测结果中的 strategy_id）
- [x] T012 [US1] 在 frontend/src/pages/Dashboard.tsx 中添加"关注"按钮（逻辑同 T011）

**检查点**: 此时, 用户故事 1 应该完全功能化且可独立测试

---

## 阶段 4: 用户故事 2 - 查看关注列表及独立指标 (优先级: P1)🎯 MVP

**目标**: 用户可以查看独立的关注列表页面，展示所有关注股票的最新回测指标（直接从 backtest_results 表读取），支持排序和筛选

**独立测试**: 进入 /watchlist 页面，验证：1) 列表显示所有关注股票及其回测指标；2) 排序和筛选功能正常；3) 点击股票弹出 K 线图

### 用户故事 2 的测试

- [x] T013 [P] [US2] 在 tests/integration/test_watchlist_api.py 中测试 GET /api/watchlist 端点（响应结构、排序、筛选）
- [x] T014 [P] [US2] 在 frontend/src/__tests__/Watchlist.test.tsx 中测试关注列表页面渲染（空列表、数据列表、加载状态）

### 用户故事 2 的实施

- [x] T015 [P] [US2] 在 frontend/src/App.tsx 中新增 /watchlist 路由和侧边栏"关注列表"菜单项（位于"回测结果"之后）
- [x] T016 [US2] 在 frontend/src/pages/Watchlist.tsx 中实现关注列表页面（Ant Design Table 显示 symbol, name, strategy_name, watch_type, pnl_ratio, sharp_ratio, win_ratio, max_drawdown, current_price, last_backtest_time, created_at；支持排序/筛选/K线图弹窗/取消关注）

**检查点**: 此时, 用户故事 1 和 2 都应该独立运行

---

## 阶段 5: 用户故事 3 - 关注列表指标与回测结果联动 (优先级: P2)

**目标**: 关注列表的指标数据与回测管理中的回测结果保持同步——当用户通过回测管理执行回测后，关注列表自动展示最新指标

**核心设计**: 不创建独立的回测任务。关注列表仅记录 last_backtest_task_id，查询时通过 JOIN backtest_results 获取最新指标。当回测管理完成新的回测任务时，通过 update_metrics 方法更新 last_backtest_task_id 和 watch_type。

**独立测试**: 在回测管理中创建并完成一个回测任务，验证：1) 关注列表中对应股票的指标更新为最新回测结果；2) watch_type 根据 trending_type 正确映射

### 用户故事 3 的实施

- [x] T017 [US3] 在 src/pytrading/service/watchlist_service.py 中实现 update_metrics 方法：接收 item_id + task_id，从 backtest_results 读取 trending_type，更新 last_backtest_task_id 和 watch_type（不写入任何指标数据）
- [x] T018 [US3] 在回测完成的回调流程中（src/pytrading/run/run_strategy.py 的 on_backtest_finished 或 src/pytrading/py_trading.py 的 run_backtest_task 完成后），检查被回测的 symbol 是否在关注列表中，若在则调用 WatchlistService.update_metrics 更新 last_backtest_task_id

**检查点**: 此时, 用户故事 1, 2, 3 都应该独立运行

---

## 阶段 6: 用户故事 4 - 趋势状态变化高亮提醒 (优先级: P2)

**目标**: 当关注股票的关注类型发生变化时，在列表中高亮显示并置顶

**独立测试**: 触发关注类型变化（通过回测结果中 trending_type 变化），验证：1) 变化行高亮显示；2) 排在列表顶部；3) 点击"已读"后消除高亮

### 用户故事 4 的测试

- [x] T019 [P] [US4] 在 tests/unit/test_watch_type.py 中测试 TrendingType 到 WatchType 的映射函数（覆盖所有 TrendingType 值 + 清仓信号 + 边界情况）
- [x] T020 [P] [US4] 在 tests/integration/test_watchlist_api.py 中测试 PUT /api/watchlist/{id}/read 端点

### 用户故事 4 的实施

- [x] T021 [US4] 在 WatchlistService.update_metrics 方法中实现关注类型变化检测逻辑：新 watch_type ≠ 当前 watch_type 且非"无状态"时，设置 type_changed=True, previous_watch_type, type_changed_at
- [x] T022 [US4] 在 frontend/src/pages/Watchlist.tsx 中实现行高亮样式（type_changed=True 的行添加背景色）和置顶排序（type_changed=True 排在最前）
- [x] T023 [US4] 在 frontend/src/pages/Watchlist.tsx 中实现"已读"按钮：调用 PUT /api/watchlist/{id}/read，成功后刷新列表

**检查点**: 所有用户故事现在应该独立功能化

---

## 阶段 7: 完善与横切关注点

**目的**: 清理、验证和文档

- [x] T024 [P] 清理 watchlist_service.py 中的 trigger_backtest 方法和 api/main.py 中的 POST /api/watchlist/backtest 端点（移除，该功能不再需要）
- [x] T025 [P] 清理 watchlist_items 表中已废弃的冗余指标字段（执行 sql/migrate_watchlist_drop_metrics.sql）
- [x] T026 更新 docs/design/watchlist.md 设计文档，明确"标记功能"定位
- [x] T027 运行 quickstart.md 中的验证步骤
- [x] T028 后端 pytest 覆盖率检查（目标 >= 80% 新增代码）
- [x] T029 前端 Jest 覆盖率检查（目标 >= 70% 新增代码）

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置(阶段 1)**: 无依赖关系 - 可立即开始
- **基础(阶段 2)**: 依赖于设置完成 - 阻塞所有用户故事
- **用户故事(阶段 3+)**: 都依赖于基础阶段完成
  - US1 和 US2 可以并行进行
  - US3 依赖于 US1（需要有关注条目）
  - US4 依赖于 US3（需要 update_metrics 逻辑）
- **完善(最终阶段)**: 依赖于所有期望的用户故事完成

### 用户故事依赖关系

- **用户故事 1(P1)**: 可在基础(阶段 2)后开始 - 无其他故事依赖
- **用户故事 2(P1)**: 可在基础(阶段 2)后开始 - 依赖 US1 的 API 端点（需要有关注数据才能展示）
- **用户故事 3(P2)**: 依赖 US1 - 需要有关注条目才能联动更新
- **用户故事 4(P2)**: 依赖 US3 - 需要 update_metrics 方法才能检测变化

### 每个用户故事内部

- 测试(如包含)必须在实施前编写并失败
- 模型在服务之前
- 服务在端点之前
- 核心实施在集成之前
- 故事完成后才移至下一个优先级

### 并行机会

- 阶段 2 中 T003 和 T004 可以并行运行（T003: 枚举定义，T004: ORM 模型）
- 阶段 3 中 T007 和 T008 可以并行运行（不同测试文件）
- 阶段 3 中 T009 和 T010 可以并行运行（类型定义和 API 方法）
- 阶段 3 中 T011 和 T012 可以并行运行（不同页面）
- 阶段 6 中 T019 和 T020 可以并行运行（不同测试文件）

---

## 并行示例: 用户故事 1

```bash
# 一起启动用户故事 1 的所有测试:
任务: "在 tests/unit/test_watchlist_service.py 中测试 CRUD 操作"
任务: "在 tests/integration/test_watchlist_api.py 中测试 POST/DELETE 端点"

# 一起启动用户故事 1 的所有前端任务:
任务: "在 frontend/src/types/index.ts 中新增 WatchlistItem 接口"
任务: "在 frontend/src/services/api.ts 中新增 watchlist API 方法"
```

---

## 实施策略

### 仅 MVP(用户故事 1 + 2)

1. 完成阶段 1: 设置
2. 完成阶段 2: 基础(关键 - 阻塞所有故事)
3. 完成阶段 3: 用户故事 1
4. 完成阶段 4: 用户故事 2
5. **停止并验证**: 独立测试用户故事 1 和 2
6. 如准备好则部署/演示

### 增量交付

1. 完成设置 + 基础 → 基础就绪
2. 添加用户故事 1 → 独立测试 → 部署/演示(MVP!)
3. 添加用户故事 2 → 独立测试 → 部署/演示
4. 添加用户故事 3 → 独立测试 → 部署/演示
5. 添加用户故事 4 → 独立测试 → 部署/演示
6. 每个故事在不破坏先前故事的情况下增加价值

---

## 注意事项

- [P] 任务 = 不同文件, 无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在实施前验证测试失败
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- **核心**: 关注列表不创建回测任务，指标数据通过 JOIN backtest_results 实时读取
- 避免: 模糊任务, 相同文件冲突, 破坏独立性的跨故事依赖
