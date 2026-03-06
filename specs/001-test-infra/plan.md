# 实施计划: 测试基础设施搭建

**分支**: `001-test-infra` | **日期**: 2026-03-07 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-test-infra/spec.md` 的功能规范

## 摘要

为 PyTrading 量化交易系统建立完整的自动化测试基础设施. 后端引入 pytest + pytest-cov + pytest-mock, 配置 SQLite 内存数据库夹具、掘金 SDK mock 工厂和市场行情数据集; 前端补充 Jest 测试文件, 配置 API mock、lightweight-charts mock 和 Ant Design 适配. 交付可运行的示例测试, 为后续开发建立标准测试模式.

## 技术背景

**语言/版本**: Python 3.11, TypeScript (ES5 target, strict=false)
**主要依赖**: FastAPI, SQLAlchemy 2.0, React 18, Ant Design 5.x, lightweight-charts 5.x
**存储**: MySQL (生产) / SQLite 内存 (测试)
**测试**: pytest + pytest-cov + pytest-mock (后端), Jest + React Testing Library (前端)
**目标平台**: Linux (WSL2), 浏览器 (桌面 1280px+)
**项目类型**: Web 应用 (FastAPI + React)
**性能目标**: 测试套件执行 < 30 秒
**约束条件**: 测试必须在无网络、无外部数据库环境中运行
**规模/范围**: 后端 ~15 个模块, 前端 ~14 个 TypeScript 文件

## 章程检查

*门控: 阶段 0 研究前通过. 阶段 1 设计后重新检查.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. 代码质量至上 | ✅ 通过 | 新增代码使用类型注解, 遵循命名规范 |
| II. 量化交易数据可靠性 | ✅ 通过 | 策略测试夹具使用确定性数据, 保证信号可复现 |
| III. 后端单元测试标准 | ✅ 通过 | 本功能正是实现此原则的基础设施 |
| IV. 前端单元测试标准 | ✅ 通过 | 本功能正是实现此原则的基础设施 |
| V. 前端 UX 一致性 | ⚪ 不适用 | 本功能不涉及 UI 变更 |
| VI. 高可靠性 | ✅ 通过 | 测试配置不影响生产代码可靠性 |
| VII. 高扩展性 | ✅ 通过 | 夹具和 mock 工厂采用工厂模式, 易于扩展 |

## 项目结构

### 文档(此功能)

```
specs/001-test-infra/
├── plan.md              # 此文件
├── spec.md              # 功能规范
├── research.md          # 阶段 0 研究报告
├── data-model.md        # 数据模型设计
├── quickstart.md        # 快速入门指南
└── checklists/
    └── requirements.md  # 规范质量检查清单
```

### 源代码(仓库根目录)

```
# 后端测试结构 (新增)
tests/
├── __init__.py
├── conftest.py              # 全局 fixtures: db_session, mock_gm_api, mock_config
├── unit/
│   ├── __init__.py
│   └── test_settings.py     # 示例: Config 类单元测试
├── integration/
│   └── __init__.py
└── fixtures/
    ├── __init__.py
    └── market_data.py       # 市场行情数据集 (上涨/下跌/震荡)

# 前端测试结构 (新增)
frontend/src/
├── __tests__/
│   ├── utils.test.ts        # 示例: 工具函数测试
│   └── App.test.tsx         # 示例: App 组件渲染 + 路由测试
├── __mocks__/
│   └── lightweight-charts.ts # lightweight-charts 全模块 mock
└── setupTests.ts            # 已存在, 可能需补充全局 mock

# 配置变更
pyproject.toml               # 新增 pytest 开发依赖 + [tool.pytest] 配置
```

**结构决策**: 采用现有的分离式结构 — 后端代码在 `src/pytrading/`, 前端在 `frontend/src/`. 后端测试放在项目根的 `tests/` 目录(而非 `src/` 内), 遵循 pytest 社区惯例. 前端测试放在 `frontend/src/__tests__/`, 遵循 CRA 默认发现规则.

## 复杂度跟踪

> **无章程违规, 本节无需填写**
