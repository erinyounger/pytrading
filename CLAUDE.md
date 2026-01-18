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
- [监控与日志](#监控与日志)

---

## 🎯 开发规范概述

### 规范目标

本文档定义了xTrading多平台量化交易系统的完整开发规范，确保代码质量、开发效率和系统可靠性。

### 适用范围

- **Python后端开发**: FastAPI、策略引擎、数据模型
- **前端开发**: Tauri桌面应用、React Web应用
- **移动端开发**: React Native应用
- **数据工程**: 数据模型、缓存策略、同步机制
- **运维开发**: Docker、Kubernetes、监控系统

### 核心原则

1. **代码质量优先**: 遵循DRY、KISS、SOLID原则
2. **安全第一**: 所有功能必须通过安全审查
3. **测试驱动**: 单元测试覆盖率不低于80%
4. **文档驱动**: 代码即文档，文档即代码
5. **持续集成**: 每次提交必须通过CI/CD流水线

---

## 💻 代码规范

### Python代码规范

#### 基础规范

遵循PEP 8标准，使用以下工具强制执行：

```bash
# 代码格式化
black src/ test/
isort src/ test/

# 代码检查
flake8 src/ test/
pylint src/

# 类型检查
mypy src/
```

#### 导入规范

```python
# 标准库导入
import os
import sys
from typing import Dict, List, Optional, Any

# 第三方库导入
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException

# 内部模块导入
from pytrading.strategy.base import StrategyBase
from pytrading.model.back_test import BackTest
from pytrading.config.settings import config
```

#### 文档字符串规范

```python
class MacdStrategy(StrategyBase):
    """MACD趋势跟踪策略

    该策略基于MACD指标进行趋势跟踪，使用ATR进行仓位管理。

    Attributes:
        fast_period (int): 快速EMA周期，默认12
        slow_period (int): 慢速EMA周期，默认26
        signal_period (int): 信号线周期，默认9

    Example:
        >>> strategy = MacdStrategy(fast_period=12, slow_period=26)
        >>> result = strategy.run(context)
    """

    def __init__(self, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        """初始化MACD策略

        Args:
            fast_period: 快速EMA周期，必须大于0
            slow_period: 慢速EMA周期，必须大于fast_period
            signal_period: 信号线周期，必须大于0

        Raises:
            ValueError: 当参数不满足条件时抛出
        """
        if fast_period <= 0 or slow_period <= fast_period or signal_period <= 0:
            raise ValueError("参数不满足条件")

        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
```

#### 错误处理规范

```python
from typing import Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

def calculate_pnl_ratio(start_value: float, end_value: float) -> Optional[float]:
    """计算收益率"""
    try:
        if start_value <= 0:
            logger.error(f"起始值必须大于0，当前值: {start_value}")
            return None

        ratio = (end_value - start_value) / start_value
        return round(ratio, 4)

    except ZeroDivisionError:
        logger.error(f"除零错误：起始值为{start_value}")
        return None
    except Exception as e:
        logger.exception(f"计算收益率时发生未知错误: {str(e)}")
        return None
```

#### 类型注解规范

```python
from typing import List, Dict, Optional, Union
from datetime import datetime
from decimal import Decimal

# 基础类型
user_id: int = 1001
username: str = "trader"
is_active: bool = True

# 复杂类型
positions: List[Dict[str, Any]] = []
config: Dict[str, Union[str, int, float]] = {}
optional_value: Optional[str] = None

# 自定义类型
from dataclasses import dataclass
from datetime import datetime

@dataclass
class TradeResult:
    """交易结果"""
    symbol: str
    side: str
    price: Decimal
    quantity: int
    timestamp: datetime
```

### TypeScript代码规范

#### 基础规范

使用ESLint和Prettier：

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

#### 导入规范

```typescript
// React相关导入
import React, { useState, useEffect, useCallback } from 'react';

// 第三方库导入
import { AxiosResponse } from 'axios';
import { format } from 'date-fns';

// 内部模块导入
import { BacktestService } from '@/services/backtestService';
import { MarketStore } from '@/stores/marketStore';
import { Button } from '@/components/ui/button';
```

#### 类型定义规范

```typescript
// 接口定义
interface BacktestConfig {
  /** 策略名称 */
  strategy: string;
  /** 股票代码 */
  symbols?: string[];
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 策略参数 */
  parameters?: Record<string, any>;
}

// 类型别名
type BacktestStatus = 'pending' | 'running' | 'completed' | 'failed';
type TradeSide = 'buy' | 'sell';

// 联合类型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

// 泛型
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
```

#### React组件规范

```typescript
import React, { memo, useMemo } from 'react';

// Props类型定义
interface BacktestCardProps {
  result: BacktestResult;
  onViewDetails: (id: string) => void;
  onDelete: (id: string) => void;
}

// 使用memo优化性能
export const BacktestCard = memo<BacktestCardProps>(({ result, onViewDetails, onDelete }) => {
  // useMemo缓存计算结果
  const performanceColor = useMemo(() => {
    return result.pnlRatio >= 0 ? 'text-green-600' : 'text-red-600';
  }, [result.pnlRatio]);

  // useCallback缓存事件处理函数
  const handleView = useCallback(() => {
    onViewDetails(result.id);
  }, [result.id, onViewDetails]);

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">{result.symbol}</h3>
      <p className={performanceColor}>
        收益率: {(result.pnlRatio * 100).toFixed(2)}%
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={handleView}>查看详情</Button>
        <Button variant="destructive" onClick={() => onDelete(result.id)}>
          删除
        </Button>
      </div>
    </div>
  );
});
```

### Rust代码规范

#### 基础规范

使用rustfmt和clippy：

```bash
# 代码格式化
cargo fmt

# 代码检查
cargo clippy
```

#### 错误处理规范

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {0}")]
    ConnectionError(String),

    #[error("Query failed: {0}")]
    QueryError(String),

    #[error("Transaction failed: {0}")]
    TransactionError(String),
}

pub struct DatabaseManager {
    conn: Connection,
}

impl DatabaseManager {
    pub fn new(conn: Connection) -> Self {
        Self { conn }
    }

    pub fn save_result(&self, result: &BacktestResult) -> Result<(), DatabaseError> {
        // 业务逻辑
        self.conn.execute(
            "INSERT INTO backtest_results ...",
        ).map_err(|e| DatabaseError::QueryError(e.to_string()))?;

        Ok(())
    }
}
```

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

### 持续集成(CI/CD)

#### 自动化检查

```bash
# 预提交钩子配置
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.9

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.3.0
    hooks:
      - id: mypy
```

---

## ✅ 质量标准

### 代码质量度量

#### 复杂度控制

- 函数圈复杂度不超过10
- 避免深层嵌套（不超过3层）
- 函数长度不超过50行
- 类长度不超过300行

#### 代码覆盖率要求

```
总体覆盖率: >= 80%
关键模块覆盖率: >= 90%
- 策略引擎: 95%
- 订单管理: 90%
- 数据模型: 85%
- API接口: 80%
```

#### 性能基准

```
回测性能:
- 单股票回测时间: < 5秒
- 100股票批量回测: < 300秒
- 内存使用: < 2GB

API性能:
- 响应时间 (P95): < 200ms
- 吞吐量: > 1000 QPS
- 并发连接数: > 500
```

### 质量检查工具

#### Python质量工具

```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88

[tool.flake8]
max-line-length = 88
extend-ignore = ["E203", "W503"]
exclude = [
    ".git",
    "__pycache__",
    "build",
    "dist"
]

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q --strict-markers"
testpaths = ["test"]

[tool.coverage.run]
source = ["src/pytrading"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/.venv/*"
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError"
]
```

#### TypeScript质量工具

```json
// package.json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "eslintConfig": {
    "extends": [
      "@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint", "react", "react-hooks"],
    "rules": {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  "prettier": {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 80,
    "tabWidth": 2
  }
}
```

---

## 🔒 安全规范

### 安全开发原则

#### 输入验证

```python
from pydantic import BaseModel, validator, Field
from typing import List, Optional
from datetime import datetime

class BacktestRequest(BaseModel):
    """回测请求模型"""
    strategy: str = Field(..., regex="^(MACD|BOLL|TURTLE)$")
    symbols: Optional[List[str]] = None
    start_time: datetime
    end_time: datetime
    max_position: float = Field(default=0.1, le=1.0, ge=0.0)

    @validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('结束时间必须大于开始时间')
        return v

    @validator('symbols')
    def validate_symbols(cls, v):
        if v and len(v) > 100:
            raise ValueError('股票数量不能超过100只')
        return v
```

#### SQL注入防护

```python
# 使用参数化查询
from sqlalchemy import text

def get_backtest_results(user_id: int, symbol: Optional[str] = None):
    query = text("""
        SELECT * FROM backtest_results
        WHERE user_id = :user_id
        AND (:symbol IS NULL OR symbol = :symbol)
    """)

    return db.execute(query, {
        'user_id': user_id,
        'symbol': symbol
    })
```

#### 敏感信息处理

```python
import os
from cryptography.fernet import Fernet

class SecureConfig:
    """安全配置管理"""

    def __init__(self):
        self._cipher = Fernet(os.environ['ENCRYPTION_KEY'].encode())

    def get_token(self) -> str:
        encrypted_token = os.environ['TRADING_TOKEN']
        return self._cipher.decrypt(encrypted_token.encode()).decode()

    def mask_sensitive_info(self, info: str) -> str:
        """脱敏处理"""
        if len(info) <= 8:
            return '*' * len(info)
        return info[:4] + '*' * (len(info) - 8) + info[-4:]
```

### 安全测试

```
1. 输入验证测试
   - SQL注入测试
   - XSS攻击测试
   - 命令注入测试

2. 认证授权测试
   - 身份绕过测试
   - 权限提升测试
   - 会话管理测试

3. 数据安全测试
   - 数据加密测试
   - 传输安全测试
   - 数据脱敏测试
```

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

### 单元测试规范

#### Python单元测试

```python
import pytest
from unittest.mock import Mock, patch
from pytrading.strategy.strategy_macd import MacdStrategy

class TestMacdStrategy:
    """MACD策略测试类"""

    @pytest.fixture
    def strategy(self):
        """测试夹具"""
        return MacdStrategy(fast_period=12, slow_period=26, signal_period=9)

    def test_initialization(self, strategy):
        """测试策略初始化"""
        assert strategy.fast_period == 12
        assert strategy.slow_period == 26
        assert strategy.signal_period == 9
        assert strategy.name == "MACD"
```

#### TypeScript单元测试

```typescript
// src/__tests__/BacktestService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BacktestService } from '../services/BacktestService';
import { apiClient } from '../services/apiClient';

vi.mock('../services/apiClient');

describe('BacktestService', () => {
  let service: BacktestService;

  beforeEach(() => {
    service = new BacktestService();
    vi.clearAllMocks();
  });

  describe('createBacktest', () => {
    it('should create backtest successfully', async () => {
      const config = {
        strategy: 'MACD',
        symbols: ['SZSE.000625'],
        startTime: '2024-01-01',
        endTime: '2024-06-30'
      };

      const expectedResponse = {
        taskId: 'task_123',
        status: 'started' as const
      };

      vi.mocked(apiClient.post).mockResolvedValue(expectedResponse);

      const result = await service.createBacktest(config);

      expect(result).toEqual(expectedResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/backtest/start', config);
    });
  });
});
```

### 集成测试规范

#### API集成测试

```python
import pytest
from fastapi.testclient import TestClient
from pytrading.api.main import app

client = TestClient(app)

class TestBacktestAPI:
    """回测API集成测试"""

    def test_start_backtest_success(self):
        """测试成功启动回测"""
        request_data = {
            "strategy": "MACD",
            "mode": "single",
            "symbol": "SZSE.000625",
            "start_time": "2024-01-01 09:00:00",
            "end_time": "2024-06-30 15:00:00"
        }

        response = client.post("/api/backtest/start", json=request_data)

        assert response.status_code == 200
        assert "task_id" in response.json()
        assert response.json()["status"] == "started"
```

#### E2E测试规范

```typescript
// e2e/backtest.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Backtest Flow', () => {
  test('should complete full backtest workflow', async ({ page }) => {
    // 1. 访问回测页面
    await page.goto('/backtest');

    // 2. 填写回测配置
    await page.selectOption('#strategy', 'MACD');
    await page.fill('#symbol', 'SZSE.000625');
    await page.fill('#startTime', '2024-01-01');
    await page.fill('#endTime', '2024-06-30');

    // 3. 启动回测
    await page.click('#startBacktest');

    // 4. 等待任务完成
    await expect(page.locator('#taskStatus')).toHaveText('completed', {
      timeout: 30000
    });

    // 5. 验证结果
    await expect(page.locator('#backtestResults')).toBeVisible();
  });
});
```

---

## 📁 项目结构

```
pytrading/
├── src/                          # Python后端源码
│   ├── pytrading/
│   │   ├── api/                 # FastAPI Web服务
│   │   │   ├── main.py         # 主入口
│   │   │   ├── models.py       # 数据模型
│   │   │   ├── deps.py         # 依赖注入
│   │   │   └── middleware/     # 中间件
│   │   ├── config/              # 配置管理
│   │   ├── controller/          # 控制器
│   │   ├── db/                  # 数据库
│   │   ├── model/              # 数据模型
│   │   ├── run/                # 运行脚本
│   │   ├── strategy/            # 策略模块
│   │   ├── utils/              # 工具模块
│   │   ├── services/           # 服务层
│   │   ├── cache/              # 缓存
│   │   ├── logger.py            # 日志系统
│   │   └── exceptions.py        # 自定义异常
│   └── tests/                   # 后端测试
├── xTrading/                    # 桌面端应用 (Tauri)
│   ├── src/                   # React前端源码
│   │   ├── components/         # React组件
│   │   │   ├── ui/            # 基础UI组件
│   │   │   ├── charts/         # 图表组件
│   │   │   ├── forms/          # 表单组件
│   │   │   └── layout/         # 布局组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard/     # 仪表板
│   │   │   ├── Market/        # 行情页面
│   │   │   ├── Backtest/       # 回测页面
│   │   │   ├── Strategy/       # 策略页面
│   │   │   ├── Signals/        # 信号页面
│   │   │   ├── Risk/           # 风险页面
│   │   │   └── Reports/        # 报告页面
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── store/             # 状态管理
│   │   ├── services/          # API服务
│   │   ├── types/             # TypeScript类型
│   │   ├── utils/             # 工具函数
│   │   ├── styles/            # 样式文件
│   │   ├── App.tsx           # 主应用组件
│   │   └── main.tsx          # 应用入口
│   ├── src-tauri/            # Rust后端
│   │   ├── src/              # Rust源码
│   │   ├── Cargo.toml         # Rust依赖
│   │   └── tauri.conf.json   # Tauri配置
│   └── package.json          # Node.js依赖
├── docs/                     # 文档
├── scripts/                  # 脚本文件
│   ├── setup/               # 环境设置脚本
│   ├── deploy/              # 部署脚本
│   ├── backup/              # 备份脚本
│   └── maintenance/         # 维护脚本
├── test/                     # 测试文件
│   ├── unit/                # 单元测试
│   ├── integration/         # 集成测试
│   └── e2e/                # 端到端测试
├── docker/                  # Docker配置
├── k8s/                    # Kubernetes配置
├── monitoring/             # 监控配置
├── .github/               # GitHub配置
├── .vscode/               # VS Code配置
├── .pre-commit-config.yaml # 预提交钩子
├── pyproject.toml         # Python项目配置
├── package.json           # Node.js项目配置
├── docker-compose.yml     # Docker编排
├── .env.example         # 环境变量模板
├── .gitignore          # Git忽略文件
├── CLAUDE.md           # 项目说明文档
├── TASK.md             # 任务管理文档
├── README.md           # 项目说明文档
└── run.py             # 主运行脚本
```

---

## ⚙️ 环境配置

### 开发环境配置

#### Python环境

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 安装开发依赖
pip install -e ".[dev]"

# 安装预提交钩子
pre-commit install

# 设置环境变量
cp .env.example .env
```

#### Node.js环境

```bash
# 安装Node.js (使用nvm)
nvm install 18
nvm use 18

# 安装全局依赖
npm install -g @tauri-apps/cli typescript

# 安装项目依赖
cd xTrading
npm install

# 启动开发服务
npm run tauri dev
```

### 生产环境配置

#### 环境变量

```bash
# .env.production
NODE_ENV=production

# API配置
API_BASE_URL=https://api.pytrading.com
WEBSOCKET_URL=wss://ws.pytrading.com

# 数据库配置
MYSQL_HOST=prod-mysql-host
MYSQL_PORT=3306
MYSQL_DATABASE=pytrading
MYSQL_USER=pytrading_user
MYSQL_PASSWORD=secure_password

# Redis配置
REDIS_HOST=prod-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 安全配置
ENCRYPTION_KEY=your_encryption_key_here
JWT_SECRET_KEY=your_jwt_secret_here

# 监控配置
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
```

---

## 🚀 部署规范

### 部署流程

#### 自动化部署

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "开始部署 xTrading..."

# 1. 检查环境
if [ "$ENVIRONMENT" != "production" ]; then
    echo "错误: 仅允许在生产环境部署"
    exit 1
fi

# 2. 备份当前版本
./scripts/backup/backup-db.sh
./scripts/backup/backup-files.sh

# 3. 构建新版本
docker build -f Dockerfile.prod -t pytrading:$VERSION .

# 4. 运行数据库迁移
docker run --rm pytrading:$VERSION python -m pytrading.db.migrate

# 5. 更新服务
docker-compose -f docker-compose.prod.yml up -d --remove-orphans

# 6. 健康检查
./scripts/health-check.sh

# 7. 清理旧镜像
docker image prune -f

echo "部署完成: $VERSION"
```

#### 蓝绿部署

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

BLUE_VERSION=$1
GREEN_VERSION=$2

echo "开始蓝绿部署..."

# 1. 检查版本
if [ -z "$BLUE_VERSION" ] || [ -z "$GREEN_VERSION" ]; then
    echo "用法: $0 <blue_version> <green_version>"
    exit 1
fi

# 2. 部署到绿色环境
docker-compose -f docker-compose.green.yml up -d

# 3. 运行冒烟测试
./scripts/smoke-test.sh

# 4. 切换流量
./scripts/switch-traffic.sh green

# 5. 监控新版本
sleep 300
./scripts/monitor-deploy.sh

# 6. 回滚或确认部署
if [ "$DEPLOY_STATUS" == "success" ]; then
    # 关闭蓝色环境
    ./scripts/switch-traffic.sh blue
    docker-compose -f docker-compose.blue.yml down

    # 更新版本标签
    docker tag pytrading:$GREEN_VERSION pytrading:latest

    echo "部署成功: $GREEN_VERSION"
else
    # 回滚到蓝色环境
    ./scripts/switch-traffic.sh blue
    docker-compose -f docker-compose.green.yml down

    echo "部署失败，已回滚到: $BLUE_VERSION"
    exit 1
fi
```

### 监控规范

#### 健康检查

```python
# src/pytrading/health/health_checker.py
import asyncio
import time
from typing import Dict, Any
from dataclasses import dataclass
from enum import Enum

class HealthStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"

@dataclass
class HealthCheckResult:
    name: str
    status: HealthStatus
    response_time: float
    message: str
    details: Dict[str, Any] = None

class HealthChecker:
    """健康检查器"""

    def __init__(self):
        self.checks = [
            self.check_database,
            self.check_redis,
            self.check_external_apis,
            self.check_disk_space,
            self.check_memory
        ]

    async def run_all_checks(self) -> Dict[str, HealthCheckResult]:
        """运行所有健康检查"""
        results = {}

        for check in self.checks:
            try:
                result = await check()
                results[result.name] = result
            except Exception as e:
                results[check.__name__] = HealthCheckResult(
                    name=check.__name__,
                    status=HealthStatus.UNHEALTHY,
                    response_time=0.0,
                    message=str(e)
                )

        return results

    async def check_database(self) -> HealthCheckResult:
        """检查数据库健康状态"""
        start_time = time.time()

        try:
            # 执行简单查询
            result = await self.db.fetch_one("SELECT 1 as test")

            response_time = time.time() - start_time

            if response_time < 0.1:
                status = HealthStatus.HEALTHY
                message = "数据库连接正常"
            else:
                status = HealthStatus.DEGRADED
                message = "数据库响应较慢"

            return HealthCheckResult(
                name="database",
                status=status,
                response_time=response_time,
                message=message,
                details={"test_result": result}
            )

        except Exception as e:
            response_time = time.time() - start_time
            return HealthCheckResult(
                name="database",
                status=HealthStatus.UNHEALTHY,
                response_time=response_time,
                message=f"数据库连接失败: {str(e)}"
            )
```

---

## 📊 监控与日志

### 日志规范

#### 结构化日志

```python
import structlog
from pythonjsonlogger import jsonlogger

# 配置结构化日志
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# 使用结构化日志
def execute_trade(symbol: str, side: str, quantity: int, price: float):
    """执行交易"""
    logger.info(
        "trade_executed",
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=price,
        user_id=get_current_user_id(),
        timestamp=datetime.now().isoformat()
    )
```

#### 日志级别规范

```
日志级别使用规范:

DEBUG (10):
    - 开发调试信息
    - 函数调用轨迹
    - 变量值变化
    - 示例: logger.debug("处理数据: {data}", data=data)

INFO (20):
    - 业务流程关键节点
    - 系统启动关闭
    - 配置加载
    - 示例: logger.info("回测任务完成: {task_id}", task_id=task_id)

WARNING (30):
    - 非关键错误
    - 性能警告
    - 配置异常
    - 示例: logger.warning("API响应缓慢: {duration}s", duration=response_time)

ERROR (40):
    - 功能错误但不影响其他模块
    - 数据处理异常
    - 示例: logger.error("数据解析失败: {error}", error=str(e))

CRITICAL (50):
    - 系统级严重错误
    - 数据丢失风险
    - 安全漏洞
    - 示例: logger.critical("数据库连接失败，服务不可用")
```

### 监控指标

#### 业务指标

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# 交易指标
trade_counter = Counter('trades_total', 'Total number of trades', ['strategy', 'symbol'])
trade_duration = Histogram('trade_duration_seconds', 'Time spent executing trades')
active_positions = Gauge('active_positions', 'Number of active positions')

# 回测指标
backtest_tasks_total = Counter('backtest_tasks_total', 'Total backtest tasks', ['status'])
backtest_duration = Histogram('backtest_duration_seconds', 'Time spent on backtests')

# 系统指标
api_requests_total = Counter('api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
api_request_duration = Histogram('api_request_duration_seconds', 'API request duration')

class MetricsCollector:
    """指标收集器"""

    def record_trade(self, strategy: str, symbol: str, duration: float):
        """记录交易指标"""
        trade_counter.labels(strategy=strategy, symbol=symbol).inc()
        trade_duration.observe(duration)

    def record_backtest(self, status: str, duration: float):
        """记录回测指标"""
        backtest_tasks_total.labels(status=status).inc()
        backtest_duration.observe(duration)
```

---

## 📝 总结

本开发规范文档定义了xTrading多平台量化交易系统的完整开发标准，包括：

1. **代码规范**: Python、TypeScript、Rust代码标准
2. **开发流程**: Git工作流、代码审查、CI/CD
3. **质量标准**: 覆盖率、性能、安全要求
4. **测试规范**: 单元测试、集成测试、E2E测试
5. **部署规范**: 自动化部署、监控、日志

遵循本规范可以确保：
- 代码质量和可维护性
- 开发效率和协作效率
- 系统稳定性和安全性
- 用户体验和产品质量

所有团队成员必须严格遵守本规范，确保项目的高质量交付。

---

**文档版本**: 2.0
**最后更新**: 2026-01-18
**维护者**: xTrading开发团队
