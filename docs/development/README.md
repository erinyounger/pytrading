# 开发指南

## 概述

本文档为xTrading系统的开发者提供详细的开发规范、工具使用和工作流程指南。

## 开发环境搭建

### 1. 系统要求

**操作系统**
- Windows 10+ (推荐Windows 11)
- macOS 10.15+
- Linux (Ubuntu 20.04+)

**硬件要求**
- CPU: 4核心以上
- 内存: 16GB以上
- 硬盘: 100GB可用空间
- 网络: 稳定的互联网连接

### 2. 必需软件

#### Python开发环境
```bash
# 安装Python 3.9+
python --version  # 确认版本 >= 3.9

# 安装Poetry (Python包管理工具)
curl -sSL https://install.python-poetry.org | python3 -

# 或者使用pip安装
pip install poetry

# 验证安装
poetry --version
```

#### Node.js开发环境
```bash
# 安装Node.js 18+
node --version  # 确认版本 >= 18

# 安装pnpm (推荐的包管理器)
npm install -g pnpm

# 验证安装
pnpm --version
```

#### 开发工具
```bash
# 安装Git
git --version

# 安装Docker Desktop
docker --version

# 安装Kubernetes CLI
kubectl version --client
```

### 3. 项目克隆和初始化

```bash
# 克隆项目
git clone https://github.com/xtrading/pytrading.git
cd pytrading

# 安装Python依赖
poetry install

# 安装前端依赖
cd frontend/web-app
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，设置必要的环境变量

# 启动开发服务
make dev
```

## 代码规范

### 1. Python编码规范

#### PEP 8规范
- 使用Black进行代码格式化
- 行长度限制在88字符
- 使用isort进行导入排序
- 使用flake8进行代码检查

#### 类型提示
```python
from typing import List, Dict, Optional, Union

def calculate_returns(
    prices: List[float],
    window: int = 20
) -> Dict[str, float]:
    """
    计算移动平均收益率

    Args:
        prices: 价格列表
        window: 移动窗口大小

    Returns:
        包含收益率的字典

    Raises:
        ValueError: 当价格列表为空时
    """
    if not prices:
        raise ValueError("价格列表不能为空")

    returns: Dict[str, float] = {}
    # 计算逻辑...

    return returns
```

#### 文档字符串
```python
class MACDStrategy:
    """
    MACD趋势策略类

    该策略基于MACD指标进行趋势跟踪，通过金叉死叉信号
    进行买卖操作。

    Attributes:
        fast_period (int): 快线周期，默认12
        slow_period (int): 慢线周期，默认26
        signal_period (int): 信号线周期，默认9

    Example:
        >>> strategy = MACDStrategy(fast_period=12, slow_period=26)
        >>> signal = strategy.calculate_signal(price_data)
        >>> if signal.action == 'BUY':
        ...     execute_buy_order(signal)
    """

    def __init__(
        self,
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> None:
        """初始化MACD策略参数"""
        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period

    def calculate_signal(self, data: pd.DataFrame) -> Signal:
        """
        计算交易信号

        Args:
            data: 包含OHLCV数据的DataFrame

        Returns:
            Signal对象，包含买卖信号

        Note:
            当MACD线上穿信号线时产生买入信号，
            当MACD线下穿信号线时产生卖出信号
        """
        # 计算逻辑...
        pass
```

### 2. TypeScript编码规范

#### ESLint + Prettier配置
```json
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

#### 组件规范
```typescript
// 组件接口定义
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  data?: number[];
}

// 组件实现
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  data
}) => {
  // 组件逻辑

  return (
    <div className="metric-card">
      {/* 组件JSX */}
    </div>
  );
};

// 默认属性
MetricCard.defaultProps = {
  changeType: 'neutral'
};

// 导出类型
export type MetricCardType = MetricCardProps;
```

### 3. Git提交规范

#### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 提交示例
```bash
feat(strategy): add MACD trend following strategy

- Implement MACD signal generation
- Add ATR-based position sizing
- Include risk management

Closes #123
```

#### 提交钩子
```bash
# 安装pre-commit钩子
pre-commit install

# 手动运行检查
pre-commit run --all-files
```

## 项目结构

### 1. 目录结构
```
pytrading/
├── services/              # 微服务目录
│   ├── api-gateway/      # API网关
│   ├── user-service/     # 用户服务
│   ├── strategy-service/  # 策略服务
│   └── ...
├── frontend/            # 前端应用
│   ├── web-app/         # Web应用
│   ├── desktop-app/     # 桌面应用
│   └── mobile-app/      # 移动应用
├── shared/              # 共享代码
│   ├── types/           # 类型定义
│   └── utils/          # 工具函数
├── tests/               # 测试文件
├── docs/               # 项目文档
└── scripts/            # 脚本工具
```

### 2. 包管理

#### Python (Poetry)
```toml
# pyproject.toml
[tool.poetry]
name = "pytrading"
version = "2.0.0"
description = "xTrading量化交易系统"

[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.104.0"
sqlalchemy = "^2.0.0"
pydantic = "^2.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
black = "^23.0.0"
isort = "^5.12.0"
mypy = "^1.7.0"

[tool.black]
line-length = 88
target-version = ['py39']

[tool.isort]
profile = "black"
multi_line_output = 3
```

#### Node.js (pnpm)
```json
// frontend/web-app/package.json
{
  "name": "xtrading-web",
  "version": "2.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vite": "^4.0.0"
  }
}
```

## 测试指南

### 1. 单元测试

#### Python测试
```python
# tests/unit/test_strategy.py
import pytest
from unittest.mock import Mock, patch
from src.strategy.macd_strategy import MACDStrategy

class TestMACDStrategy:
    """MACD策略单元测试"""

    @pytest.fixture
    def strategy(self):
        """测试夹具：创建策略实例"""
        return MACDStrategy(fast_period=12, slow_period=26)

    @pytest.fixture
    def sample_data(self):
        """测试夹具：示例价格数据"""
        return pd.DataFrame({
            'close': [100, 101, 102, 103, 104, 105, 104, 103, 102, 101]
        })

    def test_initialization(self, strategy):
        """测试策略初始化"""
        assert strategy.fast_period == 12
        assert strategy.slow_period == 26
        assert strategy.signal_period == 9

    def test_calculate_signal_bullish(self, strategy, sample_data):
        """测试看涨信号计算"""
        # 模拟MACD数据
        with patch.object(strategy, '_calculate_macd') as mock_macd:
            mock_macd.return_value = (1.5, 1.0, 0.5)

            signal = strategy.calculate_signal(sample_data)

            assert signal.action == 'BUY'
            assert signal.strength > 0.5

    def test_calculate_signal_bearish(self, strategy, sample_data):
        """测试看跌信号计算"""
        with patch.object(strategy, '_calculate_macd') as mock_macd:
            mock_macd.return_value = (-1.5, -1.0, -0.5)

            signal = strategy.calculate_signal(sample_data)

            assert signal.action == 'SELL'

    def test_invalid_data_raises_error(self, strategy):
        """测试无效数据抛出异常"""
        with pytest.raises(ValueError):
            strategy.calculate_signal(None)
```

#### TypeScript测试
```typescript
// tests/unit/MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(
      <MetricCard
        title="Total Value"
        value="¥1,000,000"
      />
    );

    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
  });

  it('displays positive change correctly', () => {
    render(
      <MetricCard
        title="Return"
        value="+5.5%"
        change="+2.3%"
        changeType="positive"
      />
    );

    expect(screen.getByText('+2.3%')).toHaveClass('text-green-500');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(
      <MetricCard
        title="Click Me"
        value="100"
        onClick={handleClick}
      />
    );

    screen.getByText('Click Me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. 集成测试

```python
# tests/integration/test_backtest_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestBacktestAPI:
    """回测API集成测试"""

    def test_create_backtest_success(self, auth_headers):
        """测试成功创建回测任务"""
        response = client.post(
            "/api/v1/backtest",
            json={
                "strategy_id": "str_123",
                "symbols": ["SHSE.600000"],
                "start_time": "2024-01-01",
                "end_time": "2024-12-31",
                "initial_capital": 1000000
            },
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "pending"

    def test_create_backtest_invalid_strategy(self, auth_headers):
        """测试无效策略创建回测"""
        response = client.post(
            "/api/v1/backtest",
            json={
                "strategy_id": "invalid_strategy",
                "symbols": ["SHSE.600000"],
                "start_time": "2024-01-01",
                "end_time": "2024-12-31"
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        assert "strategy not found" in response.json()["error"]["message"]

    def test_get_backtest_status(self, auth_headers, created_task):
        """测试获取回测状态"""
        response = client.get(
            f"/api/v1/backtest/{created_task['task_id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == created_task["task_id"]
        assert "status" in data
```

### 3. E2E测试

```typescript
// tests/e2e/backtest.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Backtest Flow', () => {
  test('complete backtest workflow', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@example.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-button]');

    // 导航到回测页面
    await page.click('[data-testid=nav-backtest]');

    // 创建回测
    await page.click('[data-testid=create-backtest]');
    await page.selectOption('[data-testid=strategy-select]', 'MACD');
    await page.selectOption('[data-testid=symbol-select]', 'SHSE.600000');
    await page.fill('[data-testid=start-date]', '2024-01-01');
    await page.fill('[data-testid=end-date]', '2024-12-31');
    await page.click('[data-testid=start-backtest]');

    // 验证任务创建
    await expect(page.locator('[data-testid=backtest-success]')).toBeVisible();

    // 等待回测完成
    await page.waitForSelector('[data-testid=backtest-complete]', { timeout: 300000 });

    // 查看结果
    await page.click('[data-testid=view-results]');
    await expect(page.locator('[data-testid=total-return]')).toContainText('%');
  });
});
```

## 调试技巧

### 1. Python调试

#### 使用pdb
```python
def calculate_indicators(self, data):
    """计算技术指标"""
    import pdb; pdb.set_trace()  # 设置断点

    macd_line = data['close'].ewm(span=12).mean() - data['close'].ewm(span=26).mean()
    signal_line = macd_line.ewm(span=9).mean()

    return macd_line, signal_line
```

#### 使用PyCharm调试
```python
# 配置远程调试
# 1. 安装debugpy: pip install debugpy
# 2. 在代码中添加:
import debugpy
debugpy.listen(5678)
print("Waiting for debugger attach")
debugpy.wait_for_client()

# 3. 在PyCharm中配置远程调试连接到5678端口
```

### 2. TypeScript调试

#### 使用Chrome DevTools
```typescript
// 在代码中添加断点
const calculateMACD = (prices: number[]) => {
  debugger; // 浏览器会自动在此处暂停

  const fastEMA = calculateEMA(prices, 12);
  const slowEMA = calculateEMA(prices, 26);

  return fastEMA - slowEMA;
};
```

#### VSCode调试配置
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vite/bin/vite",
      "args": ["--debug"],
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/dist/**"]
    }
  ]
}
```

## 性能优化

### 1. Python性能优化

#### 使用cProfile分析
```python
import cProfile
import pstats

def profile_code():
    """分析代码性能"""
    pr = cProfile.Profile()
    pr.enable()

    # 运行要分析的代码
    run_strategy_backtest()

    pr.disable()

    # 生成性能报告
    stats = pstats.Stats(pr)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # 显示前20个最耗时的函数
```

#### 使用NumPy向量化
```python
# 避免循环，使用向量化操作
import numpy as np

# 错误的写法
def calculate_returns_slow(prices):
    returns = []
    for i in range(1, len(prices)):
        returns.append((prices[i] - prices[i-1]) / prices[i-1])
    return returns

# 正确的写法
def calculate_returns_fast(prices):
    price_array = np.array(prices)
    return np.diff(price_array) / price_array[:-1]
```

### 2. 前端性能优化

#### React.memo优化
```typescript
// 避免不必要的重渲染
const MetricCard = React.memo<MetricCardProps>(({ title, value, change }) => {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <span>{value}</span>
      {change && <span>{change}</span>}
    </div>
  );
});
```

#### useMemo缓存计算结果
```typescript
const ExpensiveCalculation: React.FC<{ data: number[] }> = ({ data }) => {
  const result = useMemo(() => {
    return data.reduce((sum, val) => sum + val, 0);
  }, [data]); // 只有当data变化时重新计算

  return <div>Result: {result}</div>;
};
```

## 部署指南

### 1. 本地开发部署

```bash
# 使用Docker Compose启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 启动后端开发服务
make backend-dev

# 启动前端开发服务
make frontend-dev

# 运行测试
make test

# 代码检查
make lint
```

### 2. 生产部署

```bash
# 构建生产镜像
make build

# 部署到Kubernetes
kubectl apply -f kubernetes/production/

# 检查部署状态
make status

# 查看日志
make logs
```

## 常见问题

### Q: 如何重置开发环境？
```bash
# 重置所有数据
make reset

# 重新安装依赖
make install

# 重置数据库
make db-reset
```

### Q: 如何添加新的微服务？
```bash
# 使用模板创建新服务
make create-service SERVICE_NAME=notification-service

# 自动生成基础代码和配置
```

### Q: 如何处理数据库迁移？
```bash
# 生成迁移文件
alembic revision --autogenerate -m "Add new table"

# 执行迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### Q: 如何调试API接口？
```bash
# 使用curl测试API
curl -X GET "http://localhost:8000/api/v1/strategies" \
  -H "Authorization: Bearer <token>"

# 使用Swagger UI
# 访问 http://localhost:8000/docs
```

## 总结

通过遵循本开发指南，开发者可以：

1. **快速上手**：详细的环境搭建和项目初始化步骤
2. **代码规范**：统一的编码规范和最佳实践
3. **测试驱动**：完整的测试策略和工具支持
4. **高效调试**：多种调试技巧和工具
5. **性能优化**：前后端性能优化方法
6. **持续集成**：自动化的测试和部署流程

遵循这些规范和流程，可以确保代码质量，提高开发效率，降低维护成本。
