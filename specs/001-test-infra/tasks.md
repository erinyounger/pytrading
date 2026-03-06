# 任务: 测试基础设施搭建

**输入**: 来自 `/specs/001-test-infra/` 的设计文档
**前置条件**: plan.md(必需), spec.md(用户故事必需), research.md, data-model.md, quickstart.md

**测试**: 本功能的核心目标就是建立测试基础设施, 因此每个用户故事都包含验证任务.

**组织结构**: 任务按用户故事分组, 以便每个故事能够独立实施和测试.

## 格式: `[ID] [P?] [Story] 描述`
- **[P]**: 可以并行运行(不同文件, 无依赖关系)
- **[Story]**: 此任务属于哪个用户故事(例如: US1, US2, US3)
- 在描述中包含确切的文件路径

## 路径约定
- **后端代码**: `src/pytrading/`
- **后端测试**: `tests/` (项目根目录)
- **前端代码**: `frontend/src/`
- **前端测试**: `frontend/src/__tests__/`
- **前端 mocks**: `frontend/src/__mocks__/`
- **配置**: `pyproject.toml` (项目根目录)

---

## 阶段 1: 设置(项目初始化)

**目的**: 安装测试依赖, 创建目录结构和配置文件

- [X] T001 在 pyproject.toml 中添加 pytest 开发依赖和测试配置: 在 `[dependency-groups]` 下添加 `dev = ["pytest>=8.0", "pytest-cov>=4.0", "pytest-mock>=3.0"]`; 添加 `[tool.pytest.ini_options]` 配置 testpaths, python_files, python_classes, python_functions, addopts(含 -v --tb=short), 以及 `[tool.coverage.run]` source 和 omit 规则
- [X] T002 [P] 创建后端测试目录结构: tests/__init__.py, tests/unit/__init__.py, tests/integration/__init__.py, tests/fixtures/__init__.py (全部为空 __init__.py 文件)
- [X] T003 [P] 创建前端测试目录: frontend/src/__tests__/ 和 frontend/src/__mocks__/ (确保目录存在)

---

## 阶段 2: 基础(阻塞前置条件)

**目的**: 建立全局测试夹具和 mock 基础设施, 所有用户故事依赖于此

**⚠️ 关键**: 在此阶段完成之前, 无法开始任何用户故事工作

- [X] T004 在 tests/conftest.py 中创建全局后端测试夹具: (1) `db_engine` fixture(scope=session): 创建 SQLite 内存引擎 `sqlite:///:memory:` 并设置 `check_same_thread=False`, 通过 `Base.metadata.create_all()` 创建全部 ORM 表; (2) `db_session` fixture(scope=function): 从 db_engine 创建 Session, yield 后自动 rollback 和 close; (3) `mock_gm_api` fixture(autouse=True, scope=session): 使用 `unittest.mock.MagicMock` 创建 gm 和 gm.api 模块 mock, 注入 `sys.modules["gm"]` 和 `sys.modules["gm.api"]`, 防止测试中真实导入掘金 SDK; (4) `mock_config` fixture: 提供一个工厂函数, 接受 kwargs 创建自定义 Config 实例, 默认值为 TRADING_MODE=backtest, SAVE_DB=false, DB_TYPE=mysql
- [X] T005 [P] 在 frontend/src/__mocks__/lightweight-charts.ts 中创建 lightweight-charts 全模块 mock: 导出 `createChart` 函数返回带 jest.fn() spy 的链式对象, 包含 `addCandlestickSeries()`, `addHistogramSeries()`, `addLineSeries()` 返回带 `setData()`, `setMarkers()` spy 的 series mock; `timeScale()` 返回带 `setVisibleRange()`, `fitContent()` spy; `subscribeCrosshairMove()`, `subscribeVisibleTimeRangeChange()` 为 jest.fn(); `remove()`, `resize()`, `applyOptions()` 为 jest.fn()
- [X] T006 [P] 检查 frontend/src/setupTests.ts 是否包含 `@testing-library/jest-dom` import, 如缺失则补充; 添加全局 `window.matchMedia` mock(Ant Design 依赖), 添加 `window.ResizeObserver` mock(lightweight-charts 依赖)

**检查点**: 基础就绪 - 运行 `uv run pytest tests/ --co` 验证后端测试发现, 运行 `cd frontend && npx react-scripts test --watchAll=false --listTests` 验证前端测试发现

---

## 阶段 3: 用户故事 1 - 后端开发者运行单元测试 (优先级: P1) 🎯 MVP

**目标**: 后端开发者能通过 `uv run pytest` 运行测试并查看覆盖率报告

**独立测试**: 执行 `uv run pytest tests/ -v --cov=src/pytrading --cov-report=term-missing`, 验证测试被发现、执行通过、覆盖率报告生成

### 用户故事 1 的实施

- [X] T007 [P] [US1] 在 tests/unit/test_settings.py 中创建 Config 类单元测试: (1) `test_config_default_values_correct`: 验证 Config 实例各属性默认值(trading_mode, save_db, db_type 等); (2) `test_config_custom_env_overrides_defaults`: 使用 monkeypatch.setenv 设置 TRADING_MODE=live, SAVE_DB=true 等, 重新创建 Config 并验证覆盖生效; (3) `test_config_trading_mode_maps_to_constant`: 验证 trading_mode='live' 映射为 MODE_LIVE 常量, 'backtest' 映射为 MODE_BACKTEST; 命名遵循 `test_config_<场景>_<预期>` 格式
- [X] T008 [P] [US1] 在 tests/unit/test_mysql_models.py 中创建 ORM 模型单元测试(使用 db_session fixture): (1) `test_strategy_model_create_and_query_returns_record`: 创建 Strategy 记录并查询验证字段值; (2) `test_backtest_result_model_stores_metrics_correctly`: 创建 BackTestResult 记录, 验证 sharpe_ratio, max_drawdown, win_rate 等指标字段; (3) `test_db_session_rollback_isolates_tests`: 在一个测试中插入数据, 在另一个测试中验证数据不存在(证明 fixture 隔离性); 使用 conftest.py 中的 db_session fixture
- [X] T009 [US1] 验证: 在项目根目录运行 `uv run pytest tests/unit/ -v --cov=src/pytrading/config --cov=src/pytrading/db --cov-report=term-missing`, 确认: (1) 全部测试被发现并通过; (2) 覆盖率报告正常生成; (3) 被测模块(settings.py, mysql.py)覆盖率 >= 80%

**检查点**: 后端测试基础设施完全可用, 开发者可运行 pytest 并查看覆盖率

---

## 阶段 4: 用户故事 2 - 前端开发者运行组件测试 (优先级: P2)

**目标**: 前端开发者能通过 `npm test` 运行测试并查看覆盖率报告

**独立测试**: 执行 `cd frontend && npm test -- --coverage --watchAll=false`, 验证测试被发现、执行通过、覆盖率报告生成

### 用户故事 2 的实施

- [X] T010 [P] [US2] 在 frontend/src/__tests__/utils.test.ts 中创建工具函数测试: 测试 `formatCurrency()` (正数/负数/零), `formatPercent()` (正/负/精度), `formatNumber()`, `formatVolume()` (万/亿单位转换), `getStatusColor()` (各状态映射), `debounce()` (延迟调用验证); 每个测试使用 describe 分组, it 描述预期行为
- [X] T011 [P] [US2] 在 frontend/src/__tests__/App.test.tsx 中创建 App 组件测试: (1) 测试 App 渲染不崩溃; (2) 测试默认路由渲染 Dashboard 页面(mock apiService 防止真实 API 调用); (3) 使用 `jest.mock('../services/api')` mock 整个 API 模块; 使用 MemoryRouter 包裹组件进行路由测试
- [X] T012 [US2] 验证: 在 frontend 目录运行 `npm test -- --coverage --watchAll=false`, 确认: (1) 全部测试被发现并通过; (2) 覆盖率报告正常生成; (3) 被测文件(utils/index.ts)覆盖率 >= 70%

**检查点**: 前端测试基础设施完全可用, 开发者可运行 npm test 并查看覆盖率

---

## 阶段 5: 用户故事 3 - 开发者为交易策略编写参数化测试 (优先级: P3)

**目标**: 提供策略测试模板和市场数据夹具, 开发者可快速编写参数化策略测试

**独立测试**: 运行策略测试两次, 验证同一数据产生完全相同的结果(信号确定性)

### 用户故事 3 的实施

- [X] T013 [US3] 在 tests/fixtures/market_data.py 中创建市场行情数据集: (1) `bullish_trend()` 函数: 返回 30 根 K 线的 pandas DataFrame, 价格从 10.0 平滑上涨至 15.0, 含 open/high/low/close/volume 列, 日期从 2024-01-01 起连续交易日; (2) `bearish_trend()`: 价格从 15.0 下跌至 10.0; (3) `sideways_range()`: 价格在 12.0 ± 1.0 震荡; (4) `golden_cross_data()`: 构造 MACD 从负转正的精确数据(约 60 根 K 线); 所有数据使用固定随机种子或纯算法生成, 确保每次调用返回相同数据
- [X] T014 [US3] 在 tests/unit/test_strategy_signals.py 中创建策略信号参数化测试: (1) 创建 `mock_strategy_context` fixture, 模拟 gm.api Context 对象, 包含 data()/order_controller/account()/symbol 属性; (2) 使用 `@pytest.mark.parametrize` 参数化测试, 传入不同市场数据(bullish/bearish/sideways); (3) `test_strategy_signal_deterministic_same_data_same_result`: 对相同数据运行两次, 断言结果完全一致; (4) 测试使用 tests/fixtures/market_data.py 中的数据集; 注意: 由于策略类与掘金 SDK 深度耦合, 此测试可先验证数据夹具和 mock context 的正确性, 为后续策略全量测试奠定基础
- [X] T015 [US3] 验证: (1) 运行 `uv run pytest tests/unit/test_strategy_signals.py -v` 确认参数化测试全部通过; (2) 连续运行两次, 对比输出确认结果完全一致

**检查点**: 策略测试基础设施可用, 市场数据夹具和 mock context 就绪

---

## 阶段 6: 完善与横切关注点

**目的**: 全量验证和清理

- [X] T016 运行全量后端测试套件 `uv run pytest tests/ -v --cov=src/pytrading --cov-report=term-missing` 并确认全部通过, 无警告或错误
- [X] T017 [P] 运行全量前端测试套件 `cd frontend && npm test -- --coverage --watchAll=false` 并确认全部通过
- [X] T018 验证测试隔离性: 断开网络后运行全部后端和前端测试, 确认均可在无网络环境下通过(SC-005)

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置(阶段 1)**: 无依赖关系 - 可立即开始
- **基础(阶段 2)**: 依赖于设置完成 - 阻塞所有用户故事
- **用户故事 1(阶段 3)**: 依赖于基础阶段完成
- **用户故事 2(阶段 4)**: 依赖于基础阶段完成, 可与 US1 并行
- **用户故事 3(阶段 5)**: 依赖于基础阶段完成, 可与 US1/US2 并行
- **完善(阶段 6)**: 依赖于所有用户故事完成

### 用户故事依赖关系

- **用户故事 1(P1)**: 可在基础(阶段 2)后开始 - 无其他故事依赖
- **用户故事 2(P2)**: 可在基础(阶段 2)后开始 - 与 US1 完全独立(前端 vs 后端)
- **用户故事 3(P3)**: 可在基础(阶段 2)后开始 - 使用 US1 的 conftest.py fixtures, 但 fixtures 在基础阶段已创建

### 每个用户故事内部

- 标记 [P] 的任务可并行执行
- 验证任务(T009, T012, T015)必须在同故事的实施任务完成后执行
- 故事完成需通过检查点验证

### 并行机会

- T002 和 T003 可并行(不同目录, 无依赖)
- T004, T005, T006 中 T005 和 T006 可并行(不同文件)
- T007 和 T008 可并行(不同测试文件)
- T010 和 T011 可并行(不同测试文件)
- **US1 和 US2 可完全并行**(后端测试 vs 前端测试, 无交叉依赖)
- T016 和 T017 可并行(后端 vs 前端验证)

---

## 并行示例

### 阶段 1: 设置并行

```bash
# T001 完成后, 同时启动:
任务: "T002 创建后端测试目录结构"
任务: "T003 创建前端测试目录"
```

### 阶段 2: 基础并行

```bash
# T004 完成后(conftest.py 是基础), 同时启动:
任务: "T005 创建 lightweight-charts mock"
任务: "T006 更新 setupTests.ts"
```

### US1 + US2 完全并行

```bash
# 基础完成后, 同时启动两个故事:
# 开发者 A: 后端测试
任务: "T007 创建 Config 测试"
任务: "T008 创建 ORM 模型测试"

# 开发者 B: 前端测试
任务: "T010 创建工具函数测试"
任务: "T011 创建 App 组件测试"
```

---

## 实施策略

### 仅 MVP(仅用户故事 1)

1. 完成阶段 1: 设置(T001-T003)
2. 完成阶段 2: 基础(T004-T006)
3. 完成阶段 3: 用户故事 1(T007-T009)
4. **停止并验证**: `uv run pytest tests/ -v --cov` 全部通过
5. 后端开发者已可使用 pytest 进行测试驱动开发

### 增量交付

1. 完成设置 + 基础 → 基础就绪
2. 添加用户故事 1 → 独立测试 → 后端 pytest 可用 (MVP!)
3. 添加用户故事 2 → 独立测试 → 前端 Jest 可用
4. 添加用户故事 3 → 独立测试 → 策略参数化测试可用
5. 每个故事在不破坏先前故事的情况下增加价值

---

## 注意事项

- [P] 任务 = 不同文件, 无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务, 相同文件冲突, 破坏独立性的跨故事依赖
- gm.api mock 必须在 conftest.py 中 autouse=True 且 scope=session, 防止任何测试意外导入真实 SDK
