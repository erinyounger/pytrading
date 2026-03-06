# 研究报告: 测试基础设施搭建

**日期**: 2026-03-07
**分支**: `001-test-infra`

## 研究任务与发现

### R1: 后端数据库层测试策略

**Decision**: 使用 SQLite 内存模式替代 MySQL 进行测试

**Rationale**:
- SQLAlchemy ORM 层支持多数据库后端, 切换 engine 即可
- MySQLClient 类通过 `create_engine()` 创建连接, 可在测试中替换为 `sqlite:///:memory:`
- 8 个 ORM 模型(Strategy, StockSymbol, BacktestTask, BackTestResult 等)均基于 declarative_base, 与数据库无关
- `Base.metadata.create_all(engine)` 可在内存 SQLite 中创建全部表结构
- 需注意: SQLite 需设置 `check_same_thread=False`

**Alternatives considered**:
- 使用真实 MySQL 实例: 需要外部服务依赖, 测试不可独立运行
- 使用 testcontainers-python: 引入 Docker 依赖, 增加复杂度, 不适合轻量级测试

### R2: 策略类接口与可测试性

**Decision**: 通过 mock context 对象测试策略逻辑

**Rationale**:
- StrategyBase 接口极简: `setup(context)`, `run(context)`, `run_schedule(context)`
- 策略依赖通过 `context` 对象注入: `context.data()`, `context.order_controller`, `context.account()`
- context 来自 `gm.api.Context`(掘金 SDK 专有类), 必须完整 mock
- MACD 策略核心依赖: talib(纯数学运算, 可直接使用), gm.api(必须 mock)
- 策略输出为 Order 对象, 可通过捕获 mock 调用验证

**Alternatives considered**:
- 集成测试连接真实掘金 API: 需要有效 token, 网络依赖, 不可重复
- 仅测试辅助函数: 覆盖不足, 无法验证策略决策链

### R3: 外部 API mock 方案

**Decision**: 使用 pytest-mock + unittest.mock.patch 模拟 gm.api 和 akshare

**Rationale**:
- gm.api 是专有闭源 SDK, 通过 `from gm.api import *` 导入大量函数
- 关键 mock 目标: `subscribe()`, `schedule()`, `current_price()`, `context.data()`
- AkShareUtil 是单例类, 直接调用 `ak.stock_individual_info_em()` 等外部 HTTP 接口
- MyQuant wrapper (`utils/myquant.py`) 薄封装层, mock 底层 `gm.api` 即可

**Alternatives considered**:
- VCR.py 录制/回放: 掘金 SDK 不走标准 HTTP, 不适用
- 自建 mock server: 过度工程化, gm.api 非 HTTP 协议

### R4: 配置管理测试方案

**Decision**: 使用 pytest monkeypatch 覆盖环境变量

**Rationale**:
- Config 是 dataclass 单例, 在模块导入时从 `os.getenv()` 读取
- `load_dotenv()` 在模块顶层执行, 早于测试框架初始化
- 通过 `monkeypatch.setenv()` 在测试前设置环境变量, 再动态重新创建 Config 实例
- 关键变量: `TRADING_MODE`, `SAVE_DB`, `DB_TYPE`, `MYSQL_*`, `LOG_LEVEL`

**Alternatives considered**:
- 测试专用 .env.test 文件: 需修改 settings.py 加载逻辑, 侵入性强
- 直接修改 config 属性: dataclass frozen 后不可变, 不安全

### R5: 前端测试框架现状

**Decision**: 沿用 react-scripts 内置 Jest 配置, 补充 mock 工具和测试文件

**Rationale**:
- Jest 及 React Testing Library 已安装(v13.4.0 + v5.17.0)
- react-scripts 提供开箱即用的 Jest 配置, 无需 jest.config.js
- TypeScript strict 模式未开启(`"strict": false`), 测试代码应自行保持类型严格
- API 层使用 axios 实例 + apiService 对象, 适合 jest.mock 整体替换

**Alternatives considered**:
- 迁移到 Vite + Vitest: 全面重构构建系统, 超出测试基础设施范围
- 引入 MSW(Mock Service Worker): 功能强大但对初始基础设施来说过重

### R6: 前端第三方库 mock 方案

**Decision**: 对 lightweight-charts 整体 mock, 对 Ant Design 仅 mock message/Modal

**Rationale**:
- lightweight-charts 创建 DOM canvas 元素, Jest 的 jsdom 环境不支持 canvas
- StockChart 组件(523 行)重度依赖 `createChart()`, series 操作, 事件订阅
- 整体 mock lightweight-charts 模块, 返回带 spy 的链式调用对象
- Ant Design 组件在 jsdom 中可正常渲染, 仅需 mock `message.success/error` 等副作用

**Alternatives considered**:
- jest-canvas-mock: 只解决 canvas API, 不解决 lightweight-charts 内部逻辑
- Puppeteer/Playwright 集成测试: 适合 E2E, 不适合单元测试基础设施

### R7: 后端测试依赖选择

**Decision**: 添加 pytest + pytest-cov + pytest-mock 三个核心依赖

**Rationale**:
- pytest: 社区标准, 章程原则 III 明确要求
- pytest-cov: 章程要求 80% 覆盖率, 需要覆盖率收集和报告
- pytest-mock: 提供 `mocker` fixture, 简化 mock 语法
- 不引入 pytest-asyncio: 当前后端无 async 测试需求(FastAPI 测试不在本期范围)

**Alternatives considered**:
- unittest(标准库): 语法冗长, 不支持参数化测试, 不符合章程要求
- tox: 多环境测试, 当前只有 Python 3.11, 暂不需要

## 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| gm SDK 导入失败(未安装) | 测试无法导入策略模块 | conftest.py 中 mock gm.api 模块 |
| talib C 扩展编译问题 | 策略数学函数测试失败 | 提供 talib mock 作为后备 |
| SQLite 与 MySQL 语法差异 | 部分 SQL 功能不兼容 | 避免 MySQL 专有语法, ORM 层屏蔽差异 |
| 前端大组件(>500 行) | 测试复杂度高 | 示例测试聚焦核心交互, 非全覆盖 |
