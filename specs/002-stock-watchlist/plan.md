# 实施计划: 股票关注列表

**分支**: `002-stock-watchlist` | **日期**: 2026-03-07 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/002-stock-watchlist/spec.md` 的功能规范

## 摘要

实现股票关注列表功能，允许用户从回测结果中挑选股票加入关注列表，独立跟踪每支股票的回测指标（收益率、胜率、夏普比率、最大回撤、关注类型），支持手动触发批量回测更新指标，并在关注类型发生变化时高亮提醒用户。

技术方案：新增 `watchlist_items` 数据库表 + SQLAlchemy 模型 + WatchlistService 服务层 + FastAPI REST 接口 + React 关注列表页面（Ant Design 表格 + StockChart 弹窗），复用现有回测执行管道。

## 技术背景

**语言/版本**: Python >= 3.11（后端），TypeScript 4.9.5 strict（前端）
**主要依赖**: FastAPI + Uvicorn（后端），React 18 + Ant Design 5.x + lightweight-charts 5.1.0（前端）
**存储**: MySQL（PyMySQL 驱动，SQLAlchemy 2.0 ORM）
**测试**: pytest + pytest-cov（后端），Jest + React Testing Library（前端）
**目标平台**: Linux 服务器（后端），桌面浏览器 >= 1280px（前端）
**项目类型**: Web 应用（FastAPI 后端 API + React SPA 前端）
**性能目标**: 关注操作 < 3s，关注列表页加载 < 2s，50 支股票批量回测 < 10min，API p95 < 500ms
**约束条件**: 单用户，无鉴权，中文界面，暗色主题
**规模/范围**: 典型 < 50 支关注股票，> 50 为边界情况

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查.*

| 原则 | 要求 | 状态 | 说明 |
|------|------|------|------|
| I. 代码质量 | 类型注解、命名规范、单一职责 | ✅ 通过 | 沿用现有模式，Python snake_case，TS camelCase |
| II. 数据可靠性 | Decimal 精度、可复现信号 | ✅ 通过 | 指标字段使用 DECIMAL(10,4)，关注类型映射为确定性函数 |
| III. 后端测试 | pytest 覆盖 >= 80% | ✅ 通过 | 新增 WatchlistService 单元测试 + API 集成测试 |
| IV. 前端测试 | Jest 覆盖 >= 70% | ✅ 通过 | 新增 Watchlist 页面组件测试 + API mock 测试 |
| V. UX 一致性 | Ant Design 暗色主题、中文 | ✅ 通过 | 复用 darkTheme.ts，所有文本中文 |
| VI. 高可靠性 | 事务、日志、优雅降级 | ✅ 通过 | DB 操作在事务内，结构化日志，回测失败不影响列表展示 |
| VII. 高扩展性 | 策略扩展、配置驱动 | ✅ 通过 | 关注条目与策略解耦（仅存 strategy_id），不修改现有策略基类 |

**门控结论**: 全部通过，无违规需证明。

## 项目结构

### 文档（此功能）

```
specs/002-stock-watchlist/
├── plan.md              # 此文件
├── spec.md              # 功能规范
├── research.md          # 阶段 0: 研究决策
├── data-model.md        # 阶段 1: 数据模型设计
├── quickstart.md        # 阶段 1: 快速开始指南
├── contracts/           # 阶段 1: API 接口合同
│   └── rest-api.md      # REST API 端点定义
├── checklists/
│   └── requirements.md  # 需求检查清单
└── tasks.md             # 阶段 2: 任务列表（/speckit.tasks 生成）
```

### 源代码（涉及文件）

```
# 后端
src/pytrading/
├── config/
│   └── watch_type.py           # [新增] WatchType 枚举 + TrendingType 映射
├── db/
│   └── mysql.py                # [修改] 新增 WatchlistItem 模型
├── service/
│   └── watchlist_service.py    # [新增] 关注列表 CRUD + 回测触发
├── api/
│   └── main.py                 # [修改] 新增 6 个 REST 端点
sql/
└── watchlist_schema.sql        # [新增] watchlist_items 建表 SQL

# 后端测试
tests/
├── unit/
│   ├── test_watch_type.py      # [新增] 关注类型映射测试
│   └── test_watchlist_service.py # [新增] 服务层单元测试
└── integration/
    └── test_watchlist_api.py   # [新增] API 集成测试

# 前端
frontend/src/
├── types/
│   └── index.ts                # [修改] 新增 WatchlistItem 接口
├── services/
│   └── api.ts                  # [修改] 新增 watchlist API 方法
├── pages/
│   ├── Watchlist.tsx           # [新增] 关注列表页面
│   ├── BacktestResults.tsx     # [修改] 添加"关注"按钮
│   └── Dashboard.tsx           # [修改] 添加"关注"按钮
├── App.tsx                     # [修改] 新增路由 + 侧边栏菜单项

# 前端测试
frontend/src/__tests__/
└── Watchlist.test.tsx          # [新增] 关注列表页面测试
```

**结构决策**: Web 应用（选项 2）。后端在 `src/pytrading/` 按职责分层，前端在 `frontend/src/` 按功能分层。新增文件遵循现有目录约定，不引入新的顶层目录。

## 复杂度跟踪

> 无章程违规，此部分无需填写。
