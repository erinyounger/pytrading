# xTrading 多平台量化交易系统 - 完整架构设计文档

## 📋 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [多平台支持](#多平台支持)
- [API 文档](#api-文档)
- [开发指南](#开发指南)
- [部署指南](#部署指南)
- [运维监控](#运维监控)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 🎯 项目概述

xTrading 是一个现代化的多平台量化交易系统，基于 Python 构建并集成了掘金量化平台。系统支持桌面端、移动端和 Web 端，为量化交易者提供完整的策略开发、回测和实盘交易解决方案。

### 核心优势

- **🚀 高性能并行处理**: 支持多股票并行回测，大幅提升策略验证效率
- **🛡️ 安全的交易执行**: 分离策略开发和交易执行，确保策略安全
- **📊 丰富的数据分析**: 完整的性能指标和可视化分析
- **🔧 模块化架构**: 高度解耦的组件设计，易于扩展和维护
- **📱 多平台支持**: 桌面端、移动端、Web 端统一体验

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        xTrading 多平台架构                       │
├─────────────────────────────────────────────────────────────────┤
│  前端层 (Frontend)                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   桌面端      │  │   移动端      │  │   Web 端     │          │
│  │ Tauri+React  │  │ React Native │  │  React SPA   │          │
│  │ TypeScript   │  │ TypeScript   │  │ TypeScript   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  API 网关层 (API Gateway)                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              FastAPI Web 服务                                │ │
│  │  • RESTful API  • WebSocket  • GraphQL  • 认证授权          │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  核心交易层 (Trading Core)                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  策略引擎    │ │  订单管理   │ │  回测引擎   │ │  实时监控   │ │
│  │ Strategy    │ │   Order     │ │ Backtest   │ │  Monitor    │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  数据层 (Data Layer)                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   MySQL     │ │   Redis     │ │   文件缓存  │ │  掘金数据   │ │
│  │ 交易数据存储  │ │    缓存     │ │   K线数据   │ │   实时行情  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  外部接口 (External APIs)                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              掘金量化平台 (MyQuant)                           │ │
│  │    • 行情数据  • 交易执行  • 账户管理  • 策略回测            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ 核心特性

### 🔄 多模式交易支持

- **回测模式**: 历史数据验证，支持多股票并行处理
- **实盘模式**: 实时交易执行，安全可控
- **仿真模式**: 实时数据仿真，无真实资金风险

### 📈 内置策略库

- **MACD 趋势策略**: 基于 MACD 指标的趋势跟踪，使用 ATR 进行仓位管理
- **布林带策略**: 基于布林带的均值回归策略
- **海龟策略**: 经典的海龟交易突破策略
- **自定义策略**: 灵活的策略开发框架

### 🎛️ 高级功能

- **任务调度系统**: 后台任务管理和进度跟踪
- **实时日志**: 分布式日志收集和分析
- **性能监控**: 完整的系统性能指标
- **风险控制**: 内置风险管理和止损机制
- **数据可视化**: 丰富的图表和分析工具

---

## 🏗️ 技术栈

### 后端技术栈

| 层级 | 技术 | 版本 | 作用 |
|------|------|------|------|
| 运行时 | Python | 3.9+ | 核心开发语言 |
| Web 框架 | FastAPI | 0.104+ | 高性能 API 服务 |
| 数据库 | MySQL | 8.0+ | 交易数据存储 |
| 缓存 | Redis | 6.0+ | 高性能缓存 |
| 量化数据 | 掘金 SDK | 3.0.177+ | 行情和交易接口 |
| 技术分析 | TA-Lib | 0.4.25 | 技术指标计算 |
| ORM | SQLAlchemy | 2.0+ | 数据库操作 |
| 异步 | asyncio | 内置 | 异步任务处理 |

### 桌面端技术栈

| 层级 | 技术 | 版本 | 作用 |
|------|------|------|------|
| 框架 | Tauri | 2.0+ | 桌面应用框架 |
| 前端 | React | 18+ | UI 框架 |
| 语言 | TypeScript | 5+ | 类型安全 |
| 构建 | Vite | 6+ | 快速构建 |
| 状态管理 | Zustand | latest | 轻量级状态管理 |
| UI 组件 | shadcn/ui | v4 | 现代 UI 组件库 |
| 样式 | Tailwind CSS | v3 | 原子化 CSS 框架 |

### 移动端技术栈

| 层级 | 技术 | 版本 | 作用 |
|------|------|------|------|
| 框架 | React Native | 0.72+ | 跨平台移动开发 |
| 语言 | TypeScript | 5+ | 类型安全 |
| 导航 | React Navigation | v6 | 移动端导航 |
| 状态管理 | Zustand | latest | 状态管理 |
| 图表 | Victory | latest | 数据可视化 |
| 动画 | Reanimated | v3 | 高性能动画 |

---

## 🚀 快速开始

### 环境要求

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Python**: 3.9 或更高版本
- **Node.js**: 16.0 或更高版本
- **MySQL**: 8.0 或更高版本
- **Redis**: 6.0 或更高版本 (可选)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/pytrading.git
cd pytrading
```

#### 2. 安装 Python 依赖

```bash
# 使用 uv (推荐)
uv sync

# 或使用 pip
pip install -r requirements.txt
```

#### 3. 安装 Node.js 依赖

```bash
# 安装前端依赖
cd xTrading
npm install
# 或使用 yarn
yarn install
```

#### 4. 配置环境变量

```bash
# 复制环境配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

#### 5. 数据库初始化

```bash
# 初始化数据库结构
python -m pytrading.db.init_db

# 测试数据库连接
python test/test_mysql.py
```

#### 6. 启动服务

```bash
# 启动 FastAPI 服务
python -m pytrading.api.main

# 启动桌面端应用 (开发模式)
cd xTrading
npm run tauri dev
```

### Docker 快速部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

---

## 📱 多平台支持

### 桌面端应用 (Tauri)

桌面端提供了完整的交易管理功能，包括策略编辑、实时监控和数据分析。

#### 主要功能

- **策略管理**: 可视化策略配置和编辑
- **实时监控**: 实时行情显示和交易状态
- **回测管理**: 批量回测和结果分析
- **系统设置**: 交易参数和风险控制设置

#### 构建和安装

```bash
# 开发模式
cd xTrading
npm run tauri dev

# 生产构建
npm run tauri build

# 安装应用包
# Windows: xTrading/src-tauri/target/release/bundle/msi/pytrading.msi
# macOS: xTrading/src-tauri/target/release/bundle/dmg/pytrading.dmg
# Linux: xTrading/src-tauri/target/release/bundle/deb/pytrading_amd64.deb
```

### 移动端应用 (React Native)

移动端专注于实时监控和紧急交易操作。

#### 主要功能

- **实时监控**: 持仓和收益实时更新
- **快速交易**: 一键买卖和止损设置
- **消息推送**: 重要交易信号推送
- **离线数据**: 本地缓存历史数据

#### 开发环境搭建

```bash
# 安装 React Native CLI
npm install -g @react-native-community/cli

# iOS 开发
cd mobile
npm install
react-native run-ios

# Android 开发
react-native run-android

# 打包发布
# iOS: react-native bundle --platform ios
# Android: ./gradlew assembleRelease
```

### Web 端应用

Web 端提供完整的数据分析和管理功能。

#### 主要功能

- **策略开发**: 在线策略编辑和调试
- **数据可视化**: 丰富的图表和分析工具
- **回测分析**: 详细的回测报告和性能分析
- **用户管理**: 多用户权限和账户管理

#### 部署方式

```bash
# 开发模式
cd frontend
npm install
npm run dev

# 生产构建
npm run build

# 部署到 Nginx
sudo cp -r dist/* /var/www/html/
sudo systemctl reload nginx
```

---

## 📚 API 文档

### REST API

#### 基础信息

- **基础 URL**: `http://localhost:8000/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON

#### 核心端点

##### 1. 回测管理

```http
# 启动回测任务
POST /backtest/start
Content-Type: application/json

{
  "strategy": "MACD",
  "mode": "index",
  "index_symbol": "SHSE.000300",
  "start_time": "2024-01-01 09:00:00",
  "end_time": "2024-06-30 15:00:00",
  "parameters": {
    "fast_period": 12,
    "slow_period": 26,
    "signal_period": 9
  }
}

# 响应
{
  "task_id": "index_SHSE.000300_20241005180052",
  "status": "started",
  "message": "回测任务已创建",
  "symbol_count": 0
}
```

```http
# 获取回测状态
GET /backtest/status/{task_id}

# 响应
{
  "task_id": "index_SHSE.000300_20241005180052",
  "status": "running",
  "progress": 45,
  "start_time": "2024-01-01 09:00:00",
  "end_time": "2024-06-30 15:00:00",
  "message": "任务进行中"
}
```

```http
# 获取回测结果
GET /backtest-results?symbol=SZSE.000625&page=1&per_page=10&sort_by=pnl_ratio&sort_order=desc

# 响应
{
  "data": [
    {
      "symbol": "SZSE.000625",
      "name": "长安汽车",
      "strategy_name": "MACD",
      "pnl_ratio": 0.1523,
      "sharp_ratio": 1.245,
      "max_drawdown": 0.0892,
      "win_ratio": 0.6875,
      "open_count": 45,
      "close_count": 44,
      "current_price": 18.52
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "total_pages": 1
}
```

##### 2. 策略管理

```http
# 获取策略列表
GET /strategies

# 响应
{
  "data": [
    {
      "name": "MACD",
      "display_name": "MACD趋势策略",
      "description": "基于MACD指标的趋势跟踪策略，使用ATR进行仓位管理",
      "parameters": [
        {
          "name": "fast_period",
          "type": "int",
          "default": 12,
          "description": "快速EMA周期"
        }
      ]
    }
  ]
}
```

##### 3. 系统监控

```http
# 获取系统状态
GET /system-status

# 响应
{
  "trading_mode": "backtest",
  "system_status": "running",
  "active_strategies": 15,
  "total_positions": 3,
  "total_pnl": 125680.50,
  "last_update": "2024-10-05 18:20:15"
}
```

##### 4. 日志查询

```http
# 获取任务日志
GET /logs/task/{task_id}?after_id=0&limit=500

# 响应
{
  "data": [
    {
      "id": 1001,
      "timestamp": "2024-10-05 18:20:15",
      "level": "INFO",
      "message": "策略执行开始",
      "symbol": "SZSE.000625"
    }
  ],
  "has_more": true
}
```

### WebSocket API

#### 连接信息

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to xTrading WebSocket');

  // 订阅任务状态更新
  ws.send(JSON.stringify({
    type: 'subscribe_task',
    task_id: 'index_SHSE.000300_20241005180052'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'task_update') {
    console.log('Task progress:', data.progress);
  }
};
```

#### 消息格式

```typescript
interface WebSocketMessage {
  type: 'task_update' | 'trade_signal' | 'system_alert';
  data: any;
}

interface TaskUpdateMessage extends WebSocketMessage {
  type: 'task_update';
  data: {
    task_id: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message: string;
  };
}
```

### GraphQL API

#### 查询示例

```graphql
query GetBacktestResults($filter: BacktestFilter!) {
  backtestResults(filter: $filter) {
    edges {
      node {
        id
        symbol
        strategyName
        pnlRatio
        sharpRatio
        maxDrawdown
        winRatio
        currentPrice
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}

# 变量
{
  "filter": {
    "symbol": "SZSE.000625",
    "strategy": "MACD",
    "pnlRatio": {
      "min": 0.1
    }
  }
}
```

#### 变更示例

```graphql
mutation StartBacktest($input: StartBacktestInput!) {
  startBacktest(input: $input) {
    task {
      id
      status
      progress
    }
    clientMutationId
  }
}

# 变量
{
  "input": {
    "strategy": "MACD",
    "mode": "INDEX",
    "indexSymbol": "SHSE.000300",
    "startTime": "2024-01-01T09:00:00Z",
    "endTime": "2024-06-30T15:00:00Z"
  }
}
```

---

## 💻 开发指南

### 项目结构

```
pytrading/
├── src/                        # Python 后端源码
│   ├── pytrading/
│   │   ├── api/               # FastAPI Web 服务
│   │   │   ├── main.py         # 主入口
│   │   │   ├── models.py       # 数据模型
│   │   │   └── __init__.py
│   │   ├── config/             # 配置管理
│   │   │   ├── settings.py     # 主配置
│   │   │   ├── strategy_enum.py # 策略枚举
│   │   │   ├── order_enum.py    # 订单枚举
│   │   │   └── __init__.py
│   │   ├── controller/         # 控制器
│   │   │   ├── order_controller.py  # 订单控制器
│   │   │   ├── stock_api_adapter.py  # 股票API适配器
│   │   │   └── __init__.py
│   │   ├── db/                 # 数据库
│   │   │   ├── mysql.py        # MySQL 客户端
│   │   │   ├── init_db.py      # 数据库初始化
│   │   │   ├── log_repository.py # 日志仓库
│   │   │   └── __init__.py
│   │   ├── model/              # 数据模型
│   │   │   ├── back_test.py    # 回测模型
│   │   │   ├── back_test_saver.py      # 回测结果保存器
│   │   │   ├── back_test_saver_factory.py # 保存器工厂
│   │   │   ├── mysql_back_test_saver.py   # MySQL 保存器
│   │   │   └── __init__.py
│   │   ├── run/                # 运行脚本
│   │   │   ├── run_strategy.py # 策略运行入口
│   │   │   └── gmcache/        # 掘金缓存
│   │   ├── strategy/           # 策略模块
│   │   │   ├── base.py         # 策略基类
│   │   │   ├── strategy_macd.py # MACD 策略
│   │   │   ├── strategy_boll.py # 布林带策略
│   │   │   ├── strategy_turtle.py # 海龟策略
│   │   │   └── __init__.py
│   │   ├── utils/              # 工具模块
│   │   │   ├── process.py      # 进程管理
│   │   │   ├── thread_pool.py  # 线程池
│   │   │   └── __init__.py
│   │   └── logger.py           # 日志系统
│   └── pytrading.egg-info/     # 包信息
├── xTrading/                   # 桌面端应用 (Tauri)
│   ├── src/                   # React 前端源码
│   │   ├── components/         # React 组件
│   │   ├── pages/            # 页面组件
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── store/            # 状态管理
│   │   ├── services/         # API 服务
│   │   ├── types/            # TypeScript 类型
│   │   ├── utils/            # 工具函数
│   │   └── App.tsx          # 主应用组件
│   ├── src-tauri/            # Rust 后端
│   │   ├── src/             # Rust 源码
│   │   │   ├── main.rs      # 主入口
│   │   │   ├── commands.rs  # Tauri 命令
│   │   │   ├── config.rs    # 配置管理
│   │   │   └── database.rs  # 数据库操作
│   │   ├── Cargo.toml       # Rust 依赖
│   │   └── tauri.conf.json  # Tauri 配置
│   ├── public/              # 静态资源
│   ├── package.json         # Node.js 依赖
│   ├── tsconfig.json        # TypeScript 配置
│   └── vite.config.ts       # Vite 构建配置
├── test/                     # 测试文件
│   ├── demo.py              # 示例测试
│   ├── jk.py               # 功能测试
│   ├── realtime.py          # 实时交易测试
│   ├── test.py              # 基础测试
│   ├── test_mysql.py        # MySQL 测试
│   ├── trend.py             # 趋势测试
│   └── talib_test.py        # TA-Lib 测试
├── docs/                     # 文档
│   ├── api/                 # API 文档
│   ├── deployment/          # 部署文档
│   └── development/         # 开发文档
├── scripts/                  # 脚本文件
│   ├── setup.sh             # 环境设置脚本
│   ├── deploy.sh            # 部署脚本
│   └── backup.sh            # 备份脚本
├── docker/                   # Docker 配置
│   ├── Dockerfile           # Docker 镜像定义
│   ├── docker-compose.yml   # 容器编排
│   └── nginx.conf           # Nginx 配置
├── .env.example             # 环境变量模板
├── .gitignore              # Git 忽略文件
├── .python-version         # Python 版本文件
├── CLAUDE.md              # 项目说明文档
├── LICENSE                # 开源协议
├── pyproject.toml         # Python 项目配置
├── README.md             # 项目说明文档
└── run.py                # 主运行脚本
```

### 开发环境搭建

#### Python 开发环境

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 安装开发依赖
pip install -e ".[dev]"

# 设置预提交钩子
pre-commit install

# 运行测试
pytest test/ -v

# 代码格式化
black src/ test/
isort src/ test/

# 类型检查
mypy src/
```

#### 前端开发环境

```bash
cd xTrading

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build

# 代码检查
npm run lint
npm run type-check
```

### 代码规范

#### Python 代码规范

遵循 PEP 8 标准，使用 Black 进行代码格式化：

```python
# src/pytrading/strategy/strategy_macd.py
#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：MACD 趋势策略实现
@Author        ：xTrading Team
@Date          ：2024-10-05
"""

from typing import Dict, Any, Optional
from gm.api import *
from pytrading.strategy.base import StrategyBase
from pytrading.logger import logger


class MacdStrategy(StrategyBase):
    """MACD 趋势跟踪策略"""

    def __init__(self, fast_period: int = 12, slow_period: int = 26, signal_period: int = 9):
        """
        初始化 MACD 策略

        Args:
            fast_period: 快速 EMA 周期，默认 12
            slow_period: 慢速 EMA 周期，默认 26
            signal_period: 信号线周期，默认 9
        """
        super().__init__()
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period
        self.name = "MACD"

    def setup(self, context) -> None:
        """策略初始化"""
        logger.info(f"初始化 MACD 策略: fast={self.fast_period}, slow={self.slow_period}, signal={self.signal_period}")

        # 设置订阅数据
        subscribe(context.symbol, '1d')

    def run(self, context) -> Optional[Dict[str, Any]]:
        """策略执行逻辑"""
        try:
            # 获取历史数据
            data = context.data(context.symbol, '1d', count=50, end_time=context.now)

            if len(data) < self.slow_period + self.signal_period:
                logger.warning("数据不足，跳过执行")
                return None

            # 计算 MACD 指标
            macd, signal, histogram = MACD(
                data['close'].values,
                fastperiod=self.fast_period,
                slowperiod=self.slow_period,
                signalperiod=self.signal_period
            )

            # 生成交易信号
            current_macd = macd[-1]
            current_signal = signal[-1]
            current_histogram = histogram[-1]

            prev_histogram = histogram[-2]

            # 金叉买入信号
            if current_histogram > 0 and prev_histogram <= 0:
                return {
                    'action': 'buy',
                    'price': data['close'][-1],
                    'reason': 'MACD金叉'
                }

            # 死叉卖出信号
            elif current_histogram < 0 and prev_histogram >= 0:
                return {
                    'action': 'sell',
                    'price': data['close'][-1],
                    'reason': 'MACD死叉'
                }

            return None

        except Exception as e:
            logger.error(f"策略执行出错: {str(e)}")
            return None
```

#### TypeScript 代码规范

使用 ESLint 和 Prettier 进行代码规范：

```typescript
// src/services/api.ts
import { z } from 'zod';

// 请求和响应类型定义
export interface BacktestRequest {
  strategy: string;
  mode: 'single' | 'index';
  symbols?: string[];
  indexSymbol?: string;
  startTime: string;
  endTime: string;
  parameters?: Record<string, any>;
}

export interface BacktestResponse {
  taskId: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  message: string;
  symbolCount: number;
}

// API 客户端类
export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * 设置认证令牌
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 启动回测任务
   */
  async startBacktest(request: BacktestRequest): Promise<BacktestResponse> {
    const response = await fetch(`${this.baseUrl}/backtest/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 获取回测状态
   */
  async getBacktestStatus(taskId: string): Promise<BacktestStatus> {
    const response = await fetch(`${this.baseUrl}/backtest/status/${taskId}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}
```

### 测试策略

#### 单元测试

```python
# test/test_strategy_macd.py
import pytest
from unittest.mock import Mock, patch
from pytrading.strategy.strategy_macd import MacdStrategy


class TestMacdStrategy:
    """MACD 策略测试类"""

    def setup_method(self):
        """每个测试方法执行前的设置"""
        self.strategy = MacdStrategy(fast_period=12, slow_period=26, signal_period=9)

    def test_strategy_initialization(self):
        """测试策略初始化"""
        assert self.strategy.fast_period == 12
        assert self.strategy.slow_period == 26
        assert self.strategy.signal_period == 9
        assert self.strategy.name == "MACD"

    @patch('pytrading.strategy.strategy_macd.logger')
    def test_setup(self, mock_logger):
        """测试策略设置"""
        mock_context = Mock()
        self.strategy.setup(mock_context)

        mock_logger.info.assert_called_once()
        assert "初始化 MACD 策略" in str(mock_logger.info.call_args)

    def test_run_with_insufficient_data(self):
        """测试数据不足的情况"""
        mock_context = Mock()
        mock_context.data.return_value = []

        result = self.strategy.run(mock_context)
        assert result is None

    def test_run_with_buy_signal(self):
        """测试买入信号生成"""
        # 创建模拟数据
        import numpy as np

        mock_context = Mock()
        mock_data = {
            'close': pd.Series(np.random.randn(30))
        }
        mock_context.data.return_value = mock_data
        mock_context.now = '2024-10-05 15:00:00'

        with patch('pytrading.strategy.strategy_macd.MACD') as mock_macd:
            mock_macd.return_value = (
                np.array([0.1, 0.2, 0.3]),    # macd
                np.array([0.0, 0.1, 0.2]),    # signal
                np.array([-0.1, -0.05, 0.05]) # histogram
            )

            result = self.strategy.run(mock_context)
            assert result is not None
            assert result['action'] == 'buy'
```

#### 集成测试

```python
# test/test_integration.py
import pytest
import asyncio
from pytrading.py_trading import xTrading
from pytrading.config import config


class TestIntegration:
    """集成测试"""

    @pytest.mark.asyncio
    async def test_backtest_execution(self):
        """测试回测执行流程"""
        py_trading = xTrading(
            symbols=['SZSE.000625'],
            start_time='2024-01-01 09:00:00',
            end_time='2024-06-30 15:00:00',
            strategy_name='MACD'
        )

        # 执行回测
        result = await asyncio.create_task(
            asyncio.to_thread(py_trading.run_strategy)
        )

        assert result is not None
        # 更多断言...

    def test_database_operations(self):
        """测试数据库操作"""
        from pytrading.db.mysql import MySQLClient

        db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )

        # 测试数据库连接
        assert db_client.get_session() is not None
```

### 调试指南

#### Python 调试

```python
# 使用 pdb 进行调试
import pdb; pdb.set_trace()

# 使用 rich 进行美化输出
from rich import print
from rich.panel import Panel

# 详细的错误追踪
import traceback
try:
    # 代码逻辑
    pass
except Exception as e:
    print(Panel(f"[red]{traceback.format_exc()}[/red]", title="错误详情"))
```

#### 前端调试

```typescript
// 使用 React Developer Tools
// Chrome DevTools 中的 Performance 标签
// VS Code 调试配置 (.vscode/launch.json)

{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Tauri",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/xTrading/node_modules/.bin/vite",
      "args": ["tauri", "dev"],
      "env": {
        "VITE_DEBUG": "true"
      }
    }
  ]
}
```

---

## 🚢 部署指南

### Docker 部署

#### 1. 单容器部署

```bash
# 构建镜像
docker build -t pytrading:latest .

# 运行容器
docker run -d \
  --name pytrading \
  -p 8000:8000 \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/.env:/app/.env \
  pytrading:latest
```

#### 2. Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  # xTrading API 服务
  pytrading-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - TRADING_MODE=backtest
      - MYSQL_HOST=mysql
      - REDIS_HOST=redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./.env:/app/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  # MySQL 数据库
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root123
      - MYSQL_DATABASE=pytrading
      - MYSQL_USER=pytrading
      - MYSQL_PASSWORD=pytrading123
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    restart: unless-stopped

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - pytrading-api
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

启动服务：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f pytrading-api
```

#### 3. Kubernetes 部署

```yaml
# k8s/pytrading-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pytrading-api
  labels:
    app: pytrading-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pytrading-api
  template:
    metadata:
      labels:
        app: pytrading-api
    spec:
      containers:
      - name: pytrading-api
        image: pytrading:latest
        ports:
        - containerPort: 8000
        env:
        - name: TRADING_MODE
          value: "backtest"
        - name: MYSQL_HOST
          value: "mysql-service"
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: pytrading-service
spec:
  selector:
    app: pytrading-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

### 生产环境配置

#### 1. 系统要求

- **CPU**: 4 核心或以上
- **内存**: 8GB 或以上
- **磁盘**: 100GB SSD 或以上
- **网络**: 稳定的互联网连接

#### 2. 安全配置

```bash
# 防火墙设置
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API

# SSL 证书配置
sudo certbot --nginx -d your-domain.com

# 数据库安全
mysql_secure_installation
```

#### 3. 性能优化

```python
# 生产环境配置
# src/pytrading/config/production.py
import os
from .settings import Config

class ProductionConfig(Config):
    """生产环境配置"""

    # 数据库配置
    MYSQL_POOL_SIZE = 20
    MYSQL_POOL_MAX_OVERFLOW = 30
    MYSQL_POOL_TIMEOUT = 30
    MYSQL_POOL_RECYCLE = 3600

    # Redis 配置
    REDIS_POOL_SIZE = 20
    REDIS_TIMEOUT = 5

    # 日志配置
    LOG_LEVEL = 'WARNING'
    LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5

    # 缓存配置
    CACHE_TYPE = 'redis'
    CACHE_DEFAULT_TIMEOUT = 300

    # API 限流
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100/hour"

    # 安全配置
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'

    @staticmethod
    def init_app(app):
        Config.init_app(app)

        # 生产环境特定的初始化
        import logging
        from logging.handlers import RotatingFileHandler

        if not app.debug:
            # 文件日志
            file_handler = RotatingFileHandler(
                'logs/pytrading.log',
                maxBytes=10240000,
                backupCount=10
            )
            file_handler.setFormatter(logging.Formatter(
                '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
            ))
            file_handler.setLevel(logging.WARNING)
            app.logger.addHandler(file_handler)

            app.logger.setLevel(logging.WARNING)
```

#### 4. 监控配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'pytrading-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql-exporter:9104']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

```yaml
# monitoring/grafana/dashboard.json
{
  "dashboard": {
    "title": "xTrading 监控面板",
    "panels": [
      {
        "title": "API 响应时间",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "数据库连接数",
        "type": "graph",
        "targets": [
          {
            "expr": "mysql_threads_connected"
          }
        ]
      },
      {
        "title": "Redis 内存使用",
        "type": "graph",
        "targets": [
          {
            "expr": "redis_memory_used_bytes / redis_memory_max_bytes * 100"
          }
        ]
      }
    ]
  }
}
```

### 备份和恢复

#### 1. 数据库备份

```bash
#!/bin/bash
# scripts/backup.sh

# 配置变量
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pytrading"
DB_USER="pytrading"
DB_PASS="your_password"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u$DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  $DB_NAME > $BACKUP_DIR/pytrading_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/pytrading_$DATE.sql

# 删除 7 天前的备份
find $BACKUP_DIR -name "pytrading_*.sql.gz" -mtime +7 -delete

echo "数据库备份完成: pytrading_$DATE.sql.gz"
```

#### 2. 自动备份配置

```bash
# 添加到 crontab
# 每天凌晨 2 点执行备份
0 2 * * * /path/to/pytrading/scripts/backup.sh >> /var/log/pytrading-backup.log 2>&1

# 每小时同步到远程存储
0 * * * * rsync -avz /backup/mysql/ user@backup-server:/backup/pytrading/mysql/
```

#### 3. 恢复数据库

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1
DB_NAME="pytrading"
DB_USER="pytrading"
DB_PASS="your_password"

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <backup_file.sql.gz>"
    exit 1
fi

# 解压备份文件
gunzip -c $BACKUP_FILE | mysql -u$DB_USER -p$DB_PASS $DB_NAME

echo "数据库恢复完成: $BACKUP_FILE"
```

---

## 📊 运维监控

### 日志管理

#### 1. 结构化日志

```python
# src/pytrading/logger.py
import logging
import json
import structlog
from pythonjsonlogger import jsonlogger
from datetime import datetime
from typing import Any, Dict

class TradingLogger:
    """量化交易专用日志器"""

    def __init__(self, name: str = "pytrading"):
        self.logger = structlog.get_logger(name)
        self.setup_logging()

    def setup_logging(self):
        """设置结构化日志"""
        logging.basicConfig(
            format="%(message)s",
            stream=sys.stdout,
            level=logging.INFO,
        )

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

    def log_trade(self, symbol: str, action: str, price: float, volume: int, **kwargs):
        """记录交易日志"""
        self.logger.info(
            "trade_executed",
            symbol=symbol,
            action=action,
            price=price,
            volume=volume,
            timestamp=datetime.now().isoformat(),
            **kwargs
        )

    def log_strategy(self, strategy_name: str, signal: str, **kwargs):
        """记录策略日志"""
        self.logger.info(
            "strategy_signal",
            strategy=strategy_name,
            signal=signal,
            timestamp=datetime.now().isoformat(),
            **kwargs
        )

    def log_performance(self, pnl: float, sharp_ratio: float, max_drawdown: float, **kwargs):
        """记录性能日志"""
        self.logger.info(
            "performance_update",
            pnl=pnl,
            sharp_ratio=sharp_ratio,
            max_drawdown=max_drawdown,
            timestamp=datetime.now().isoformat(),
            **kwargs
        )
```

#### 2. 日志聚合

```yaml
# docker/fluentd.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter pytrading.**>
  @type parser
  key_name log
  reserve_data true
  <parse>
    @type json
  </parse>
</filter>

<match pytrading.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name pytrading-logs
  type_name _doc
</match>
```

### 性能监控

#### 1. 自定义指标

```python
# src/pytrading/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# 定义指标
trade_counter = Counter('trades_total', 'Total number of trades', ['strategy', 'symbol'])
trade_duration = Histogram('trade_duration_seconds', 'Time spent executing trades')
active_positions = Gauge('active_positions', 'Number of active positions')
portfolio_value = Gauge('portfolio_value', 'Current portfolio value')
pnl_total = Gauge('pnl_total', 'Total profit and loss')

class MetricsCollector:
    """指标收集器"""

    def __init__(self, port: int = 8001):
        self.port = port

    def start_server(self):
        """启动指标服务器"""
        start_http_server(self.port)
        print(f"指标服务器启动在端口 {self.port}")

    def record_trade(self, strategy: str, symbol: str, duration: float):
        """记录交易指标"""
        trade_counter.labels(strategy=strategy, symbol=symbol).inc()
        trade_duration.observe(duration)

    def update_portfolio(self, value: float, pnl: float):
        """更新投资组合指标"""
        portfolio_value.set(value)
        pnl_total.set(pnl)
```

#### 2. 监控面板

```typescript
// src/components/MonitoringDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricsData {
  trades: number;
  pnl: number;
  portfolioValue: number;
  activePositions: number;
  dailyReturns: number[];
  strategyPerformance: { name: string; value: number }[];
}

const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // 每5秒更新
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('获取指标失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!metrics) return <div>数据加载失败</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 关键指标卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>总交易次数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.trades.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>总盈亏</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${metrics.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.pnl >= 0 ? '+' : ''}{metrics.pnl.toFixed(2)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>投资组合价值</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ¥{metrics.portfolioValue.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>活跃持仓</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.activePositions}</div>
        </CardContent>
      </Card>

      {/* 收益曲线 */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>日收益率曲线</CardTitle>
        </CardHeader>
        <CardContent>
          <Line
            data={{
              labels: metrics.dailyReturns.map((_, i) => `第${i + 1}天`),
              datasets: [
                {
                  label: '收益率',
                  data: metrics.dailyReturns,
                  borderColor: 'rgb(75, 192, 192)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.1
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `${value}%`
                  }
                }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* 策略表现 */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>策略表现分布</CardTitle>
        </CardHeader>
        <CardContent>
          <Doughnut
            data={{
              labels: metrics.strategyPerformance.map(s => s.name),
              datasets: [
                {
                  data: metrics.strategyPerformance.map(s => s.value),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                  ]
                }
              ]
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;
```

### 告警系统

#### 1. 告警规则

```yaml
# monitoring/alerts.yml
groups:
- name: pytrading.rules
  rules:
  # 高风险交易告警
  - alert: HighRiskTrade
    expr: position_risk_ratio > 0.8
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "高风险交易告警"
      description: "投资组合风险比例超过 80%"

  # 连续亏损告警
  - alert: ConsecutiveLosses
    expr: consecutive_losses > 5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "连续亏损告警"
      description: "连续亏损次数达到 {{ $value }} 次"

  # 系统响应慢告警
  - alert: SlowResponse
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "API 响应慢告警"
      description: "95% 的 API 请求响应时间超过 2 秒"

  # 数据库连接数告警
  - alert: HighDBConnections
    expr: mysql_threads_connected > 150
    for: 1m
    labels:
      severity: warning
    annotations:
      summary: "数据库连接数过高"
      description: "MySQL 连接数达到 {{ $value }}"
```

#### 2. 告警通知

```python
# src/pytrading/monitoring/alerts.py
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import requests
from typing import Dict, Any

class AlertManager:
    """告警管理器"""

    def __init__(self, config: Dict[str, Any]):
        self.smtp_server = config.get('smtp_server')
        self.smtp_port = config.get('smtp_port')
        self.smtp_user = config.get('smtp_user')
        self.smtp_password = config.get('smtp_password')
        self.dingtalk_webhook = config.get('dingtalk_webhook')
        self.slack_webhook = config.get('slack_webhook')

    def send_email(self, subject: str, message: str, to_emails: list):
        """发送邮件告警"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject

            msg.attach(MimeText(message, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)
            server.quit()

            print(f"邮件告警发送成功: {subject}")
        except Exception as e:
            print(f"邮件告警发送失败: {str(e)}")

    def send_dingtalk(self, message: str):
        """发送钉钉告警"""
        try:
            data = {
                'msgtype': 'text',
                'text': {
                    'content': message
                }
            }

            response = requests.post(
                self.dingtalk_webhook,
                json=data,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                print("钉钉告警发送成功")
            else:
                print(f"钉钉告警发送失败: {response.status_code}")
        except Exception as e:
            print(f"钉钉告警发送失败: {str(e)}")

    def send_slack(self, message: str):
        """发送 Slack 告警"""
        try:
            data = {
                'text': message,
                'username': 'xTrading Bot',
                'icon_emoji': ':chart_with_upwards_trend:'
            }

            response = requests.post(
                self.slack_webhook,
                json=data,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                print("Slack 告警发送成功")
            else:
                print(f"Slack 告警发送失败: {response.status_code}")
        except Exception as e:
            print(f"Slack 告警发送失败: {str(e)}")

    def handle_alert(self, alert: Dict[str, Any]):
        """处理告警"""
        severity = alert.get('severity', 'info')
        summary = alert.get('annotations', {}).get('summary', '未知告警')
        description = alert.get('annotations', {}).get('description', '')

        message = f"""
        <h3>{summary}</h3>
        <p><strong>严重级别:</strong> {severity}</p>
        <p><strong>描述:</strong> {description}</p>
        <p><strong>时间:</strong> {alert.get('startsAt', '')}</p>
        """

        # 根据严重级别选择通知方式
        if severity == 'critical':
            self.send_email(f"严重告警: {summary}", message, ['admin@example.com'])
            self.send_dingtalk(f"🚨 严重告警: {summary}\n{description}")
            self.send_slack(f"🚨 *Critical Alert*\n{summary}\n{description}")
        elif severity == 'warning':
            self.send_dingtalk(f"⚠️ 警告: {summary}\n{description}")
            self.send_slack(f"*Warning Alert*\n{summary}\n{description}")
        else:
            self.send_slack(f"ℹ️ Info\n{summary}")
```

### 故障排查

#### 1. 常见问题

```bash
#!/bin/bash
# scripts/troubleshoot.sh

echo "=== xTrading 故障排查脚本 ==="

# 检查服务状态
echo "1. 检查服务状态..."
docker-compose ps

# 检查端口占用
echo "2. 检查端口占用..."
netstat -tuln | grep -E ':(8000|3000|3306|6379)'

# 检查磁盘空间
echo "3. 检查磁盘空间..."
df -h

# 检查内存使用
echo "4. 检查内存使用..."
free -h

# 检查进程状态
echo "5. 检查进程状态..."
ps aux | grep -E '(python|node|docker)'

# 检查日志
echo "6. 检查错误日志..."
tail -n 100 logs/trading.log | grep ERROR

# 检查数据库连接
echo "7. 检查数据库连接..."
python test/test_mysql.py

# 检查网络连通性
echo "8. 检查网络连通性..."
curl -f http://localhost:8000/api/health || echo "API 服务不可达"

echo "=== 排查完成 ==="
```

#### 2. 性能诊断

```python
# src/pytrading/diagnostics/perf.py
import psutil
import time
import cProfile
import pstats
from functools import wraps
from typing import Callable

def profile_function(func: Callable) -> Callable:
    """性能分析装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()

        stats = pstats.Stats(profiler)
        stats.sort_stats('cumulative')
        stats.print_stats(10)  # 显示前 10 个最耗时的函数

        return result
    return wrapper

class SystemDiagnostics:
    """系统诊断工具"""

    @staticmethod
    def get_system_info():
        """获取系统信息"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': dict(psutil.virtual_memory()._asdict()),
            'disk': dict(psutil.disk_usage('/')._asdict()),
            'network': dict(psutil.net_io_counters()._asdict()),
            'processes': [
                {
                    'pid': p.pid,
                    'name': p.name(),
                    'cpu_percent': p.cpu_percent(),
                    'memory_percent': p.memory_percent(),
                    'create_time': p.create_time()
                }
                for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'create_time'])
            ]
        }

    @staticmethod
    def monitor_performance(duration: int = 60):
        """性能监控"""
        start_time = time.time()
        samples = []

        while time.time() - start_time < duration:
            sample = {
                'timestamp': time.time(),
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_io': psutil.disk_io_counters(),
                'network_io': psutil.net_io_counters()
            }
            samples.append(sample)
            time.sleep(5)

        return samples

    @staticmethod
    def analyze_bottlenecks(performance_data):
        """分析性能瓶颈"""
        cpu_samples = [s['cpu_percent'] for s in performance_data]
        memory_samples = [s['memory_percent'] for s in performance_data]

        bottlenecks = []

        if max(cpu_samples) > 80:
            bottlenecks.append({
                'type': 'high_cpu',
                'description': 'CPU 使用率过高',
                'max_value': max(cpu_samples),
                'recommendation': '考虑优化算法或增加 CPU 资源'
            })

        if max(memory_samples) > 80:
            bottlenecks.append({
                'type': 'high_memory',
                'description': '内存使用率过高',
                'max_value': max(memory_samples),
                'recommendation': '检查内存泄漏或增加内存资源'
            })

        return bottlenecks
```

---

## 🤝 贡献指南

### 贡献流程

1. **Fork 项目**: 在 GitHub 上 fork 本仓库
2. **创建分支**: `git checkout -b feature/your-feature-name`
3. **开发**: 按照代码规范进行开发
4. **测试**: 编写测试用例并确保通过
5. **提交**: `git commit -m 'feat: add new feature'`
6. **推送**: `git push origin feature/your-feature-name`
7. **创建 PR**: 在 GitHub 上创建 Pull Request

### 代码规范

#### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型 (type):
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建或辅助工具变动

示例：
```bash
feat(strategy): add turtle trading strategy implementation

- Add turtle entry and exit rules
- Implement position sizing based on ATR
- Add risk management features

Closes #123
```

#### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 包含适当的测试用例
- [ ] 文档已更新
- [ ] 无安全漏洞
- [ ] 性能影响已评估
- [ ] 向后兼容性检查

### 开发路线图

#### v1.1.0 (计划中)

**新增功能**:
- [ ] 机器学习策略支持
- [ ] 实时数据流处理
- [ ] 移动端应用发布
- [ ] 高级图表分析
- [ ] 多账户管理

**技术改进**:
- [ ] 数据库性能优化
- [ ] 缓存策略升级
- [ ] 微服务架构改造
- [ ] API 版本控制
- [ ] 监控告警增强

#### v1.2.0 (远期规划)

**高级功能**:
- [ ] 期货交易支持
- [ ] 期权策略框架
- [ ] 跨市场套利
- [ ] 社交交易功能
- [ ] AI 策略推荐

**平台扩展**:
- [ ] Web3 集成
- [ ] 加密货币交易
- [ ] 外汇交易支持
- [ ] 商品期货支持
- [ ] 债券交易模块

### 问题反馈

#### Bug 报告模板

```markdown
**Bug 描述**
简洁明了地描述 bug

**复现步骤**
1. 打开...
2. 点击...
3. 滚动到...
4. 看到错误

**预期行为**
描述你预期会发生什么

**实际行为**
描述实际发生了什么

**屏幕截图**
如果适用，请添加屏幕截图

**环境信息**
- 操作系统: [e.g. Windows 11]
- Python 版本: [e.g. 3.9.7]
- xTrading 版本: [e.g. 1.0.0]
- 浏览器: [e.g. Chrome 95]

**额外信息**
添加任何其他关于这个问题的信息
```

#### 功能请求模板

```markdown
**功能描述**
简洁描述你希望的功能

**问题背景**
描述这个问题或需求

**预期解决方案**
描述你期望的解决方案

**替代方案**
描述任何你考虑过的替代解决方案

**额外上下文**
添加任何其他关于功能请求的上下文或截图
```

### 社区参与

#### 讨论渠道

- **GitHub Issues**: Bug 报告和功能请求
- **GitHub Discussions**: 通用讨论和问答
- **技术博客**: [https://blog.pytrading.com](https://blog.pytrading.com)
- **QQ 群**: 123456789
- **微信群**: 扫描二维码加入

#### 文档贡献

我们欢迎文档改进！请查看 [docs/README.md](docs/README.md) 了解如何贡献文档。

#### 翻译贡献

如果你会说多种语言，我们欢迎你帮助翻译项目文档和界面文本。

翻译状态:
- ✅ 简体中文
- ✅ 繁体中文
- 🔄 English (进行中)
- ❌ 日本語 (寻找贡献者)
- ❌ 한국어 (寻找贡献者)

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

```
MIT License

Copyright (c) 2024 xTrading Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 支持与联系

### 技术支持

- **邮箱**: support@pytrading.com
- **QQ 群**: 123456789
- **微信**: xTradingSupport
- **工作时间**: 周一至周五 9:00-18:00 (GMT+8)

### 商业合作

- **邮箱**: business@pytrading.com
- **电话**: +86-400-123-4567
- **地址**: 北京市朝阳区xxx大厦xxx层

### 社交媒体

- **GitHub**: [@pytrading](https://github.com/pytrading)
- **微博**: [@xTrading量化](https://weibo.com/pytrading)
- **知乎**: [xTrading量化交易](https://zhihu.com/pytrading)
- **B站**: [xTrading官方](https://space.bilibili.com/123456789)

---

## 🙏 致谢

感谢所有为 xTrading 项目做出贡献的开发者和用户！

特别感谢以下开源项目：

- [掘金量化平台](https://www.myquant.cn/) - 强大的量化交易基础设施
- [FastAPI](https://fastapi.tiangolo.com/) - 现代高性能 Web 框架
- [Tauri](https://tauri.app/) - 安全的桌面应用框架
- [React](https://reactjs.org/) - 用户界面库
- [MySQL](https://www.mysql.com/) - 可靠的关系型数据库
- [Redis](https://redis.io/) - 高性能内存数据库

---

## 📈 项目统计

![GitHub stars](https://img.shields.io/github/stars/pytrading/pytrading?style=social)
![GitHub forks](https://img.shields.io/github/forks/pytrading/pytrading?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/pytrading/pytrading?style=social)

![GitHub issues](https://img.shields.io/github/issues/pytrading/pytrading)
![GitHub pull requests](https://img.shields.io/github/issues-pr/pytrading/pytrading)
![GitHub contributors](https://img.shields.io/github/contributors/pytrading/pytrading)

![Lines of code](https://img.shields.io/tokei/lines/github/pytrading/pytrading)
![GitHub license](https://img.shields.io/github/license/pytrading/pytrading)
![GitHub last commit](https://img.shields.io/github/last-commit/pytrading/pytrading)

---

**© 2024 xTrading Team. All rights reserved.**

---

*本文档持续更新中，最新版本请访问 [GitHub](https://github.com/pytrading/pytrading) 查看。*

*最后更新时间: 2024年10月5日*
