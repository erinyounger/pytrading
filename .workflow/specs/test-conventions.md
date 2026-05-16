---
title: "Test Conventions"
readMode: required
priority: high
category: test
keywords:
  - test
  - coverage
  - mock
  - fixture
  - assertion
  - framework
---

# Test Conventions

Auto-generated from project analysis. Update manually as patterns evolve.

## Framework

- **Framework**: pytest
- **Run command**: `pytest` (via pyproject.toml 配置)

## Directory Structure

- **Pattern**: `tests/` 目录 (与 `src/` 同级)
- **子目录**: `unit/`, `integration/`, `fixtures/`

## Naming Conventions

- **测试文件**: `test_*.py`
- **测试类**: `Test*`
- **测试函数**: `test_*`

## Pytest Configuration

```python
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
```

## Coverage

```python
[tool.coverage.run]
source = ["src/pytrading"]
omit = ["src/pytrading/run/*", "src/pytrading/py_trading.py", "tests/*"]
```

## Fixtures

- `conftest.py` 提供共享 fixtures
- `fixtures/` 目录存放测试数据

## Entries

