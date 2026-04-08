# Graph Report - .  (2026-04-08)

## Corpus Check
- 109 files · ~57,641 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 804 nodes · 1420 edges · 44 communities detected
- Extraction: 56% EXTRACTED · 44% INFERRED · 0% AMBIGUOUS · INFERRED: 629 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `MacdStrategy` - 62 edges
2. `TrendingType` - 58 edges
3. `OrderAction` - 42 edges
4. `MACDPoint` - 31 edges
5. `BackTestResult` - 29 edges
6. `Strategy` - 28 edges
7. `WatchType` - 28 edges
8. `Order` - 28 edges
9. `TradeRecord` - 27 edges
10. `StrategyBase` - 26 edges

## Surprising Connections (you probably didn't know these)
- `WatchlistService 单元测试  验证关注列表服务的 ORM 模型和业务逻辑. 命名遵循: test_<场景>_<预期结果>` --uses--> `WatchlistItem`  [INFERRED]
  tests/unit/test_watchlist_service.py → src/pytrading/db/mysql.py
- `测试 WatchlistItem ORM 模型` --uses--> `WatchlistItem`  [INFERRED]
  tests/unit/test_watchlist_service.py → src/pytrading/db/mysql.py
- `TestWatchlistItemModel` --uses--> `WatchlistItem`  [INFERRED]
  tests/unit/test_watchlist_service.py → src/pytrading/db/mysql.py
- `TestWatchlistItemBacktestRef` --uses--> `WatchlistItem`  [INFERRED]
  tests/unit/test_watchlist_service.py → src/pytrading/db/mysql.py
- `TestWatchlistItemChangeTracking` --uses--> `WatchlistItem`  [INFERRED]
  tests/unit/test_watchlist_service.py → src/pytrading/db/mysql.py

## Hyperedges (group relationships)
- **TrendingType到WatchType映射关系** — trending_type_enum, watch_type_enum, trade_records_table, watch_type_no_state, watch_type_watching, watch_type_trend_up, watch_type_trend_down, watch_type_trend_end [EXTRACTED 1.00]
- **市场行情测试数据集** — market_data_fixtures, bullish_trend_fixture, bearish_trend_fixture, sideways_range_fixture, golden_cross_fixture [EXTRACTED 1.00]
- **MACD策略交易信号系统** — macd_strategy, order_with_signal, trade_record_entity, trade_signal_build, trade_signal_buy, trade_signal_sell, trade_signal_close [EXTRACTED 1.00]

## Communities

### Community 0 - "MACD Strategy Core"
Cohesion: 0.04
Nodes (54): StrategyBase, 通过ATR获取影响总仓位百分比的交易量，返回多少手, Order, order_close_all(), order_percent(), order_target_percent(), order_volume(), OrderAction (+46 more)

### Community 1 - "Frontend UI Components"
Cohesion: 0.03
Nodes (8): fetchBacktestPoolSymbols(), fetchTaskResults(), handleExpand(), handleOpenCreateModal(), macdRangeHandler(), mainRangeHandler(), syncCharts(), volumeRangeHandler()

### Community 2 - "Database & Backtest Models"
Cohesion: 0.07
Nodes (50): BackTest, Enum, 同步K线数据到数据库     Args:         symbol: 股票代码         days: 获取天数，默认为365天（仅在未指定 start, 后台执行回测任务     Args:         task_id: 任务ID, WatchlistRequest, 获取所有回测结果，支持分页、筛选和排序（全部在数据库查询层完成）, BackTestResult, BacktestStatus (+42 more)

### Community 3 - "Backend API Routes"
Cohesion: 0.07
Nodes (28): add_watchlist_item(), _check_scheduled_backtest(), delete_backtest_result(), delete_backtest_task(), execute_backtest_task(), fetch_tencent_quote(), get_backtest_status(), get_backtest_tasks() (+20 more)

### Community 4 - "Application Startup"
Cohesion: 0.15
Nodes (35): build_frontend(), check_node_environment(), check_python_version(), get_uv_path(), get_venv_python(), install_frontend_deps(), kill_process_on_port(), _log() (+27 more)

### Community 5 - "Strategy Core Classes"
Cohesion: 0.11
Nodes (5): init(), MACDPoint, on_bar(), TradeSignal, XPointType

### Community 6 - "WatchType Tests"
Cohesion: 0.06
Nodes (13): WatchType 枚举和映射函数单元测试  验证关注类型枚举、TrendingType 到 WatchType 的映射逻辑. 命名遵循: test_<场, 验证 display_name 返回中文值, 测试 from_trending_type 映射函数, 验证 UpDown (横盘震荡) 映射为无状态, 验证 ZeroAxisUp 映射为趋势上涨, 验证 FallingDown 映射为趋势下行, 验证有清仓信号时返回趋势结束(最高优先级), 验证未知 TrendingType 值返回无状态 (+5 more)

### Community 7 - "Trading Concepts & Fixtures"
Cohesion: 0.09
Nodes (31): backtest_results表, 下跌趋势数据集, 上涨趋势数据集, 数据库测试会话fixture, 金叉信号数据集, MACD策略, 市场行情测试数据集, 掘金API Mock Fixture (+23 more)

### Community 8 - "Watchlist API Tests"
Cohesion: 0.07
Nodes (14): Watchlist API 集成测试  验证 REST API 端点的请求响应行为. 使用 FastAPI TestClient 进行测试., 测试 GET /api/watchlist 带筛选参数端点存在, 测试 GET /api/watchlist/watched-symbols 端点存在, 测试 PUT /api/watchlist/{item_id}/read 端点存在, 测试缺少 strategy_id 参数返回验证错误, Mock gm.api before any imports, 测试 POST /api/watchlist 端点存在, 测试 DELETE /api/watchlist/{item_id} 端点存在 (+6 more)

### Community 9 - "Watchlist Service"
Cohesion: 0.12
Nodes (17): POST /api/watchlist, DELETE /api/watchlist/{id}, GET /api/watchlist/watched-symbols, GET /api/watchlist, PUT /api/watchlist/{id}/read, 关注类型枚举和 TrendingType 映射函数  功能: 002-stock-watchlist, 关注列表REST API合同, add_watch() (+9 more)

### Community 10 - "Settings Tests"
Cohesion: 0.08
Nodes (10): Config 类单元测试  验证统一配置管理的默认值、环境变量覆盖和交易模式映射. 命名遵循: test_config_<场景>_<预期结果>, 验证 get() 对不存在的属性返回默认值, 验证 to_dict() 包含所有公共字段, 验证逗号分隔的股票代码字符串正确解析为列表, 验证 'backtest' 映射为 MODE_BACKTEST 常量, 验证 'live' 映射为 MODE_LIVE 常量, TestConfigAccessors, TestConfigDefaults (+2 more)

### Community 11 - "Logging System"
Cohesion: 0.12
Nodes (12): LogRepository, 回测日志仓储，负责 backtest_logs 表的增删查, 初始化日志仓储         Args:             db_client: MySQLClient 实例（优先使用，复用其 engine）, 从配置创建独立实例（不推荐，建议复用 MySQLClient）, 追加一条日志到 backtest_logs, 按 task_id(+symbol) 增量拉取日志, DBLogHandler, get_logger() (+4 more)

### Community 12 - "Order Controller"
Cohesion: 0.11
Nodes (1): OrderController

### Community 13 - "Market Data Fixtures"
Cohesion: 0.11
Nodes (17): bearish_trending(), bullish_trending(), dead_cross_macd(), down_cross_zero_axis(), golden_cross_macd(), no_cross_positive(), 市场数据测试夹具  提供不同行情场景的 MACD 指标数据, 用于策略信号检测的参数化测试. 每个场景返回 numpy 数组, 模拟 talib.MACD, 持续正值无交叉: MACD 始终为正      Returns:         dict: MACD 持续正值 (+9 more)

### Community 14 - "Test Fixtures"
Cohesion: 0.17
Nodes (10): db_engine(), db_session(), mock_config(), mock_gm_api(), 全局测试夹具 - PyTrading 后端测试基础设施  提供: - mock_gm_api: 自动 mock 掘金 SDK, 防止真实导入 (autou, Config 工厂 fixture, 支持自定义配置参数.      用法:         def test_something(mock_config, Mock 掘金量化 SDK, 防止测试中真实导入 gm.api.      使用 types.ModuleType 构建模块对象, 使 `from gm.a, 创建 SQLite 内存引擎并初始化所有 ORM 表.      scope=session: 整个测试会话共享同一引擎, 避免重复建表开销. (+2 more)

### Community 15 - "Watchlist Service Tests"
Cohesion: 0.13
Nodes (5): WatchlistService 单元测试  验证关注列表服务的 ORM 模型和业务逻辑. 命名遵循: test_<场景>_<预期结果>, 测试 WatchlistItem ORM 模型, TestWatchlistItemBacktestRef, TestWatchlistItemChangeTracking, TestWatchlistItemModel

### Community 16 - "Coverage Report JS"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 17 - "Technical Analysis Utils"
Cohesion: 0.19
Nodes (10): ATR(), ATR_CN(), EMA(), EWMA(), 同花顺的EMA         数据长度5000以下时，比pandas要快         @X: numpy array or list, @return: list，前@timeperiod个元素的值是NaN。主要因为计算差值多占用了一个元素。, J. Welles Wilder's EMA, 计算ATR         TR=max(High(T−Low(T),abs(Close(T−1)−High(T)),abs(Close(T−1)−Low(T (+2 more)

### Community 18 - "Backtest Result Saver"
Cohesion: 0.18
Nodes (4): ABC, BackTestSaver, BackTestSaver, MySQLBackTestSaver

### Community 19 - "Strategy Runner"
Cohesion: 0.25
Nodes (6): get_market_data(), multiple_run(), on_backtest_finished(), run_cli(), save_kline_data(), update_task_progress()

### Community 20 - "Coverage Prettify JS"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 21 - "Thread Pool"
Cohesion: 0.27
Nodes (1): ThreadPool

### Community 22 - "Coverage HTML JS"
Cohesion: 0.29
Nodes (2): getCellValue(), rowComparator()

### Community 23 - "Process Management"
Cohesion: 0.46
Nodes (6): exec_process(), get_process_name(), is_process_running(), is_windows(), start_process(), wait_process()

### Community 24 - "API Models"
Cohesion: 0.43
Nodes (7): BaseModel, BacktestConfig, BacktestResult, Strategy, Symbol, SystemConfig, TaskStatus

### Community 25 - "Trend Strategy"
Cohesion: 0.33
Nodes (0): 

### Community 26 - "Demo Strategy"
Cohesion: 0.4
Nodes (3): before_market(), get_previous_N_trading_date(), 获取end_date前N个交易日,end_date为datetime格式，包括date日期     :param date：目标日期     :param

### Community 27 - "Coverage Block Nav JS"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 28 - "Realtime Monitor"
Cohesion: 0.4
Nodes (0): 

### Community 29 - "Talib Test"
Cohesion: 0.4
Nodes (0): 

### Community 30 - "Trade Record Service"
Cohesion: 0.83
Nodes (3): _get_session(), get_trade_records(), save_trade_record()

### Community 31 - "AkShare Utility"
Cohesion: 0.67
Nodes (1): AkShareUtil

### Community 32 - "Database Init"
Cohesion: 1.0
Nodes (2): init_database(), init_mysql()

### Community 33 - "Stock API Adapter"
Cohesion: 0.67
Nodes (1): StockContext

### Community 34 - "MySQL Test"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "MyQuant Utility"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Setup Tests"
Cohesion: 1.0
Nodes (1): MockResizeObserver

### Community 37 - "Run Script"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Order Rationale"
Cohesion: 1.0
Nodes (1): 今日买入量，当天买入量当天不能卖出， 昨持仓量= (volume - volume_today)

### Community 39 - "Order Rationale 2"
Cohesion: 1.0
Nodes (1): 持仓额 (volume*vwap*multiplier)

### Community 40 - "Backtest Saver Rationale"
Cohesion: 1.0
Nodes (1): 获取所有回测结果，支持分页与筛选（在数据库层执行）

### Community 41 - "Utils Test"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "JK Script"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Test Script"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **62 isolated node(s):** `获取虚拟环境 Python 可执行文件路径`, `Kill process using the specified port (with retry, cross-platform)`, `Check if Python 3.9+ is available`, `Get path to uv executable`, `Check Node.js and npm environment` (+57 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `MyQuant Utility`** (2 nodes): `myquant.py`, `get_current_price()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Setup Tests`** (2 nodes): `setupTests.ts`, `MockResizeObserver`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Run Script`** (1 nodes): `run.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Order Rationale`** (1 nodes): `今日买入量，当天买入量当天不能卖出， 昨持仓量= (volume - volume_today)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Order Rationale 2`** (1 nodes): `持仓额 (volume*vwap*multiplier)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backtest Saver Rationale`** (1 nodes): `获取所有回测结果，支持分页与筛选（在数据库层执行）`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Utils Test`** (1 nodes): `utils.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JK Script`** (1 nodes): `jk.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Script`** (1 nodes): `test.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WatchlistService` connect `Database & Backtest Models` to `Watchlist Service`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `TrendingType` connect `MACD Strategy Core` to `Watchlist Service`, `Database & Backtest Models`, `WatchType Tests`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `获取市场数据：7日平均成交量、市值、ATR` connect `Database & Backtest Models` to `MACD Strategy Core`, `Strategy Runner`, `Order Controller`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `MacdStrategy` (e.g. with `获取市场数据：7日平均成交量、市值、ATR` and `StrategyBase`) actually correct?**
  _`MacdStrategy` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Are the 56 inferred relationships involving `TrendingType` (e.g. with `WatchType` and `关注类型枚举和 TrendingType 映射函数  功能: 002-stock-watchlist`) actually correct?**
  _`TrendingType` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Are the 41 inferred relationships involving `OrderAction` (e.g. with `OrderController` and `通过ATR获取影响总仓位百分比的交易量，返回多少手`) actually correct?**
  _`OrderAction` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Are the 25 inferred relationships involving `MACDPoint` (e.g. with `.run()` and `StrategyBase`) actually correct?**
  _`MACDPoint` has 25 INFERRED edges - model-reasoned connections that need verification._