# 快速入门: 测试基础设施

**日期**: 2026-03-07
**分支**: `001-test-infra`

## 后端测试

### 运行全部测试
```bash
# 在项目根目录
uv run pytest tests/ -v --cov=src/pytrading --cov-report=term-missing
```

### 运行单个测试文件
```bash
uv run pytest tests/unit/test_settings.py -v
```

### 运行特定测试
```bash
uv run pytest tests/unit/test_settings.py::test_config_default_values_correct -v
```

### 查看覆盖率报告
```bash
uv run pytest tests/ --cov=src/pytrading --cov-report=html
# 在浏览器打开 htmlcov/index.html
```

## 前端测试

### 运行全部测试
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### 运行单个测试文件
```bash
cd frontend
npm test -- --testPathPattern="utils/index" --watchAll=false
```

### 交互式 watch 模式
```bash
cd frontend
npm test
# 按 p 过滤文件, 按 t 过滤测试名
```

## 编写新测试

### 后端测试模板

在 `tests/unit/` 下创建 `test_<模块名>.py`:

```python
import pytest
from pytrading.config.settings import Config

class TestConfig:
    """测试 Config 类"""

    def test_config_属性名_场景_预期结果(self):
        """验证特定场景下的行为"""
        # Arrange
        # Act
        # Assert
        assert result == expected
```

### 前端测试模板

在 `frontend/src/__tests__/` 下创建 `<组件名>.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '../components/ComponentName';

describe('ComponentName', () => {
  it('应该正确渲染初始状态', () => {
    render(<ComponentName />);
    expect(screen.getByText('期望文本')).toBeInTheDocument();
  });
});
```

## 目录结构

```
tests/                          # 后端测试
├── conftest.py                 # 全局 fixtures
├── unit/                       # 单元测试
│   ├── test_settings.py        # 配置测试示例
│   └── ...
├── integration/                # 集成测试
│   └── ...
└── fixtures/                   # 测试数据
    └── market_data.py          # 市场行情数据集

frontend/src/
├── __tests__/                  # 前端测试
│   ├── utils.test.ts           # 工具函数测试示例
│   └── ...
├── __mocks__/                  # 全局 mocks
│   └── lightweight-charts.ts   # 图表库 mock
└── setupTests.ts               # 测试环境配置(已存在)
```
