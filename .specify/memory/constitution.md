<!--
## 同步影响报告
- **版本变更**: 0.0.0 → 1.0.0 (MAJOR: 首次创建项目章程)
- **添加的原则**:
  - I. 代码质量至上
  - II. 量化交易数据可靠性
  - III. 后端单元测试标准
  - IV. 前端单元测试标准
  - V. 前端 UX 一致性
  - VI. 高可靠性
  - VII. 高扩展性
- **添加的部分**:
  - 技术栈约束与性能标准
  - 开发工作流与质量门控
  - 治理
- **删除的部分**: 无 (首次创建)
- **模板同步状态**:
  - `.specify/templates/plan-template.md` ✅ 无需更新 (章程检查部分已为通用引用)
  - `.specify/templates/spec-template.md` ✅ 无需更新 (模板结构兼容)
  - `.specify/templates/tasks-template.md` ✅ 无需更新 (测试任务模式兼容)
  - `.specify/templates/commands/*.md` ✅ 不存在, 无需处理
- **延迟项**: 无
-->

# PyTrading 项目章程

## 核心原则

### I. 代码质量至上

- 所有 Python 代码 MUST 使用类型注解(type hints), 公共函数和方法 MUST 包含参数类型与返回值类型
- 所有 TypeScript 代码 MUST 启用 strict 模式, 禁止使用 `any` 类型(第三方库适配除外)
- 函数体 SHOULD 控制在 50 行以内; 超过 50 行 MUST 提供拆分不可行的理由
- 类 MUST 遵循单一职责原则; 每个类只做一件事
- 禁止魔法数字: 所有业务常量 MUST 定义为命名常量或配置项
- 命名规范: Python 使用 snake_case, TypeScript 使用 camelCase, 组件使用 PascalCase, 常量使用 UPPER_SNAKE_CASE
- 代码重复: 相同逻辑出现 3 次以上 MUST 提取为公共函数或工具类

### II. 量化交易数据可靠性

- 金融数据精度: 价格计算 MUST 使用 Decimal 或保留足够浮点精度, 禁止对价格进行不受控的浮点运算
- 策略信号可复现: 相同输入数据 MUST 产生相同的交易信号, 禁止在策略逻辑中引入随机性
- 订单状态机: 交易状态转换 MUST 严格遵循 建→买→卖→平 的显式状态流转, 每次转换 MUST 记录日志
- 边界处理: 所有策略逻辑 MUST 处理停牌、涨跌停、数据缺失、非交易时段等异常场景
- 回测可审计: 回测结果 MUST 包含完整的交易记录、持仓变化和关键指标(夏普比率、最大回撤、胜率等), 支持事后复盘验证
- 外部数据隔离: MyQuant SDK 和 AKShare 的调用 MUST 通过适配器层封装, 禁止在策略逻辑中直接调用外部 API

### III. 后端单元测试标准

- 测试框架: MUST 使用 pytest 作为后端测试框架
- 覆盖率要求: 新增代码 MUST 达到 80% 以上的行覆盖率
- 策略测试: 每个交易策略 MUST 包含参数化测试(parametrize), 覆盖典型行情(上涨、下跌、震荡)和边界条件
- 数据库测试: 数据库操作 MUST 使用测试夹具(fixture)并在测试后回滚, 禁止测试污染生产数据
- 外部依赖模拟: 单元测试中 MUST 使用 mock 隔离 MyQuant SDK、AKShare 等外部服务调用
- 测试命名: 测试函数 MUST 使用 `test_<被测功能>_<场景>_<预期结果>` 格式
- 测试独立性: 每个测试用例 MUST 独立运行, 禁止测试间共享可变状态

### IV. 前端单元测试标准

- 测试框架: MUST 使用 Jest + React Testing Library
- 组件测试: 每个可交互组件 MUST 验证用户交互行为(点击、输入、选择等)
- API 层测试: services/api.ts 中的每个接口方法 MUST 包含 mock 测试, 覆盖成功和失败场景
- 图表组件: StockChart 等可视化组件 MUST 包含快照测试(snapshot test), 确保渲染输出稳定
- 覆盖率要求: 新增组件 MUST 达到 70% 以上的行覆盖率
- 测试优先级: 页面级组件(pages/) > 可复用组件(components/) > 工具函数(utils/)

### V. 前端 UX 一致性

- 设计系统: MUST 使用 Ant Design 作为唯一 UI 组件库, 禁止混用其他 UI 框架
- 主题: 暗色主题(Dark Theme)为主视觉风格, 所有自定义样式 MUST 与 Ant Design 暗色主题协调
- 语言: 界面文本 MUST 全部使用中文, 包括提示信息、按钮文字、表头等
- 图表配色: K 线图和所有图表 MUST 使用统一的配色方案(涨红跌绿), 通过共享常量管理颜色值
- 状态一致性: 加载(Loading)、错误(Error)、空数据(Empty)三种状态 MUST 在所有页面使用统一的展示模式
- 交互反馈: 所有异步操作 MUST 提供明确的加载指示; 所有破坏性操作 MUST 二次确认
- 响应式: 界面 MUST 支持 1280px 及以上宽度的桌面浏览器, 关键布局使用 Ant Design Grid 系统

### VI. 高可靠性

- 结构化日志: 所有日志 MUST 包含上下文信息(策略名称、股票代码、时间戳), 使用统一的日志格式
- 优雅降级: 外部服务(MyQuant、AKShare、MySQL)不可用时, 系统 MUST 优雅降级而非崩溃, 并记录详细错误日志
- 数据库事务: 所有数据写入操作 MUST 在事务内执行, 失败时 MUST 回滚并记录错误
- 线程安全: 并发回测执行 MUST 确保线程安全, 共享资源 MUST 使用锁或线程安全数据结构
- 健康检查: `/health` 端点 MUST 验证所有关键依赖(数据库连接、外部服务可达性)的状态
- 进程管理: 后台任务 MUST 支持优雅停止, 避免中断正在执行的回测任务

### VII. 高扩展性

- 策略扩展: 新增交易策略 MUST 继承 StrategyBase 基类, 禁止修改基类以适配新策略
- 持久化抽象: 数据持久化 MUST 通过工厂模式(BacktestSaverFactory)创建, 支持替换存储后端而不影响业务逻辑
- 配置驱动: 运行时行为 MUST 通过 .env 配置控制, 禁止在代码中硬编码环境相关的值
- API 兼容性: API 接口变更 MUST 保持向后兼容; 破坏性变更 MUST 通过版本化路径(/api/v2/)隔离
- 开闭原则: 对扩展开放, 对修改关闭; 新功能 SHOULD 通过新增模块实现, 而非修改现有模块

## 技术栈约束与性能标准

### 技术栈

| 层级 | 技术选型 | 版本要求 |
|------|----------|----------|
| 后端语言 | Python | >= 3.11 |
| 后端框架 | FastAPI + Uvicorn | >= 0.104 |
| ORM | SQLAlchemy | >= 2.0 |
| 数据库 | MySQL + PyMySQL | - |
| 前端框架 | React + TypeScript | React 18, TS strict |
| UI 组件库 | Ant Design | >= 5.x |
| 图表库 | lightweight-charts | >= 5.x |
| 量化 SDK | MyQuant (gm) | >= 3.0.177 |
| 数据源 | AKShare | >= 1.12.0 |
| 包管理(后端) | uv | 最新稳定版 |
| 包管理(前端) | npm | - |

### 性能标准

- 单策略单股票回测执行时间 MUST < 30 秒
- API 数据查询响应时间 MUST < 500ms (p95)
- 前端首屏加载时间 SHOULD < 3 秒
- K 线图渲染 1000 根 K 线 MUST < 1 秒
- 并发回测任务数 MUST 支持 >= 5 个同时执行

## 开发工作流与质量门控

### 分支策略

- 功能开发使用 feature 分支, 从 master 分出
- 合并前 MUST 通过所有自动化测试
- 提交信息 MUST 使用中文 + 约定式格式: `<类型>: <描述>`, 类型包括 feat/fix/refactor/test/docs/chore

### 质量门控

- 后端: `pytest --cov` 通过且覆盖率 >= 80% (新代码)
- 前端: `npm test` 通过且覆盖率 >= 70% (新组件)
- 类型检查: TypeScript 编译零错误
- 代码审查: 涉及策略逻辑或数据处理的变更 MUST 经过 review

### 文件组织

- 后端代码: `src/pytrading/` 按职责分层(api/strategy/model/db/service/utils)
- 前端代码: `frontend/src/` 按功能分层(pages/components/services/types/styles/utils)
- 测试代码: 后端 `tests/`(unit/integration), 前端 `frontend/src/__tests__/`
- 配置文件: 项目根目录
- SQL 脚本: `sql/`

## 治理

- 本章程是项目所有开发实践的最高准则, 优先于任何其他约定
- 修订章程 MUST 记录变更内容、理由和影响范围
- 章程版本遵循语义版本控制: MAJOR(原则删除/重定义), MINOR(新原则/部分添加), PATCH(措辞优化)
- 所有 PR MUST 验证不违反章程原则; 如需违反, MUST 在 PR 描述中提供充分理由
- 复杂度引入 MUST 证明合理: 说明为什么更简单的替代方案不可行
- 运行时开发指导参见 `CLAUDE.md` 和 `.claude/` 目录

**版本**: 1.0.0 | **批准日期**: 2026-03-07 | **最后修订**: 2026-03-07
