# xTrading 开发规范

## 📋 目录

- [开发规范概述](#开发规范概述)
- [代码规范](#代码规范)
- [开发流程](#开发流程)
- [质量标准](#质量标准)
- [安全规范](#安全规范)
- [测试规范](#测试规范)
- [项目结构](#项目结构)
- [环境配置](#环境配置)
- [部署规范](#部署规范)

---

## 🎯 开发规范概述

### 规范目标

本文档定义了xTrading多平台量化交易系统的完整开发规范，确保代码质量、开发效率和系统可靠性。

### 适用范围

- **Python后端开发**: FastAPI、策略引擎、数据模型
- **前端开发**: Tauri桌面应用、React Web应用
- **移动端开发**: React Native应用
- **数据工程**: 数据模型、缓存策略、同步机制

### 核心原则

1. **代码质量优先**: 遵循DRY、KISS、SOLID原则
2. **安全第一**: 所有功能必须通过安全审查
3. **测试驱动**: 单元测试覆盖率不低于80%
4. **文档驱动**: 代码即文档，文档即代码

---

## 💻 代码规范

### Python代码规范

- 遵循PEP 8标准
- 使用black、isort格式化代码
- 使用flake8、pylint检查代码
- 使用mypy进行类型检查
- 所有公共API必须有文档字符串
- 使用类型注解

### TypeScript代码规范

- 使用ESLint和Prettier
- 使用TypeScript严格模式
- 所有组件使用React.FC类型定义
- 导入顺序：React → 第三方 → 内部模块
- 使用memo优化性能

### Rust代码规范

- 使用rustfmt格式化代码
- 使用clippy检查代码
- 遵循Rust错误处理模式
- 使用thiserror定义错误类型

---

## 🔄 开发流程

### Git工作流

#### 分支策略

使用Git Flow分支模型：

```bash
# 主分支
main: 生产环境代码
develop: 开发环境代码

# 功能分支
feature/功能名称: 新功能开发
bugfix/问题编号: Bug修复
hotfix/问题编号: 紧急修复
release/版本号: 版本发布准备
```

#### 提交规范

遵循Conventional Commits规范：

```bash
# 功能提交
git commit -m "feat(strategy): add MACD trend following strategy

- Implement MACD signal generation
- Add ATR-based position sizing
- Include risk management

Closes #123"

# 修复提交
git commit -m "fix(api): resolve database connection timeout

- Increase connection pool size
- Add retry mechanism
- Improve error logging

Closes #456"

# 文档提交
git commit -m "docs(readme): update installation guide

- Add Docker deployment steps
- Include environment setup
- Fix broken links

Refs #789"
```

#### Pull Request流程

1. **创建分支**: 从`develop`分支创建功能分支
2. **开发实现**: 按照代码规范进行开发
3. **运行测试**: 确保所有测试通过
4. **创建PR**: 使用PR模板，描述变更内容
5. **代码审查**: 至少2名审查者通过
6. **合并分支**: 使用squash merge方式合并

### 代码审查清单

#### 功能审查
- [ ] 代码实现符合需求
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 性能影响评估
- [ ] 安全漏洞检查

#### 代码质量
- [ ] 代码规范检查通过
- [ ] 单元测试覆盖率达到80%
- [ ] 文档字符串完整
- [ ] 类型注解正确
- [ ] 无硬编码配置

#### 测试要求
- [ ] 新增功能有对应测试
- [ ] 测试用例覆盖主要场景
- [ ] 集成测试通过
- [ ] 性能测试完成

---

## 🔒 安全规范

### 安全开发原则

- 输入验证：使用Pydantic模型验证所有用户输入
- SQL注入防护：使用参数化查询
- 敏感信息处理：加密存储和传输敏感数据
- 安全测试：定期进行渗透测试和安全审计

---

## 🧪 测试规范

### 测试金字塔

```
        /\
       /  \     E2E Tests (10%)
      / E2E \
     /______\
    /        \
   /Integration\  Integration Tests (20%)
  /  Tests     \
 /______________\
/                \
/   Unit Tests   \ Unit Tests (70%)
/________________\
```

### 测试规范
- 集成测试：使用TestClient（FastAPI）
- 测试驱动开发：先写测试，再写实现
---

## 📁 项目结构

```
pytrading/
├── src/pytrading/          # Python后端
│   ├── api/                # FastAPI服务
│   ├── config/             # 配置
│   ├── strategy/           # 策略模块
│   ├── model/              # 数据模型
│   └── utils/              # 工具
├── xTrading/               # 桌面端应用
│   ├── src/               # React前端
│   │   ├── components/    # 组件
│   │   ├── pages/        # 页面
│   │   └── services/     # 服务
│   └── src-tauri/         # Rust后端
├── test/                   # 测试文件
├── scripts/                # 脚本
├── docker/                 # Docker配置
├── docs/                   # 文档
├── CLAUDE.md              # 项目规范
└── run.py                 # 运行脚本
```

---

## ⚙️ 环境配置

### 开发环境配置

- Python 3.9+，使用虚拟环境
- Node.js 18+，使用nvm管理
- 安装开发依赖：pip install -e ".[dev]" / npm install
- 安装预提交钩子：pre-commit install
- 配置环境变量：cp .env.example .env

### 生产环境配置

- 使用Docker容器化部署
- 环境变量通过.env文件
- 数据库和缓存使用外部服务
- 启用监控和日志收集

---

## 🚀 部署规范

### 部署流程

- 使用Docker容器化部署
- 部署前必须通过健康检查
- 部署失败自动回滚
- 使用Git tags标记版本

### 监控规范

- 系统健康检查：数据库、缓存、外部API
- 业务指标监控：交易量、回测任务、系统性能
- 日志收集：结构化日志，便于分析
- 告警机制：关键指标异常时自动告警

---

## 📊 监控与日志

### 日志规范

- 使用结构化日志（JSON格式）
- 日志级别：DEBUG、INFO、WARNING、ERROR、CRITICAL
- 关键业务操作必须记录日志
- 错误日志包含完整堆栈信息

### 监控指标

- 交易指标：交易数量、交易时长、活跃持仓
- 回测指标：任务数量、任务状态、执行时长
- 系统指标：API请求量、响应时间、错误率
