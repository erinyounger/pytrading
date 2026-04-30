# Coding Conventions

**Analysis Date:** 2026-04-30

## Naming Patterns

**Files:**
- Python: `snake_case.py` (e.g., `llm_service.py`, `back_test.py`)
- React/TypeScript: `PascalCase.tsx` for components, `camelCase.ts` for utilities

**Functions:**
- Python: `snake_case` (e.g., `get_watchlist`, `format_prompt`)
- TypeScript: `camelCase` for functions, `PascalCase` for React components

**Variables:**
- Python: `snake_case` (e.g., `trading_mode`, `mysql_host`)
- TypeScript: `camelCase` (e.g., `watchType`, `sortOrder`)

**Types/Classes:**
- Python: `PascalCase` (e.g., `LLMService`, `BackTest`, `Config`)
- TypeScript: `PascalCase` for interfaces and types (e.g., `WatchlistItem`, `AIAnalysisResult`)

**Constants:**
- Python: `UPPER_SNAKE_CASE` (e.g., `MODE_BACKTEST`, `MAX_RETRIES`)
- TypeScript: `UPPER_SNAKE_CASE` or `camelCase` depending on context

**Private Members:**
- Python: Prefix with `_` (e.g., `_client`, `_internal_method`)
- TypeScript: Prefix with `_` or use `private` keyword

## Code Style

**Python:**
- PEP 8 compliance with max line length 88 (Black formatter)
- Functional style: prefer pure functions, list comprehensions, avoid mutable state
- Early returns / guard clauses over deep nesting
- Shebang line: `#!/usr/bin/env python` with `# -*- coding:utf-8 -*-` encoding declaration

**TypeScript/React:**
- ES5 target with React 18
- Strict mode disabled (`strict: false` in tsconfig)
- `noImplicitAny: false` - type annotations not enforced
- `allowJs: true` - JavaScript allowed
- React components use `react-jsx` jsx transform

**Import Organization:**
1. Standard library imports
2. Third-party imports
3. Local/relative imports

Python import example:
```python
# Standard library
import os
import json
from typing import Optional, Dict, Any

# Third-party
from openai import AsyncOpenAI
from sqlalchemy.orm import Session

# Local
from pytrading.logger import logger
from pytrading.config.settings import config
```

## Documentation

**Docstrings:**
- All public functions and classes must have docstrings
- Chinese comments preferred in this codebase
- Format:
```python
def format_prompt(self, symbol: str, analysis_data: Dict[str, Any]) -> str:
    """格式化投顾分析提示词

    Args:
        symbol: 股票代码
        analysis_data: 分析数据，包含technical_score, sentiment_score等

    Returns:
        str: 格式化后的提示词
    """
```

**File Headers:**
```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：[Brief description]
@Author  ：EEric
@Date    ：2026-04-26
"""
```

**Comments:**
- Comments explain 'why', not 'what' — code should be self-documenting
- Inline comments for non-obvious logic

## Error Handling

**Python Patterns:**
- Use `try/except/finally` with specific exception types
- Log errors before re-raising: `logger.error(f"... error: {e}")`
- Fallback responses for recoverable errors
- Global singleton pattern for services with lazy initialization

Example from `src/pytrading/service/llm_service.py`:
```python
try:
    logger.info(f"[LLM] {symbol} 正在调用LLM API...")
    response = await self.client.chat.completions.create(...)
    insight = response.choices[0].message.content.strip()
    return insight
except Exception as e:
    logger.error(f"[LLM] {symbol} LLM调用失败, error: {str(e)}")
    # Return fallback response
    return f"基于系统分析，{symbol}建议{rec}（置信度{conf:.0%}）。"
```

**Async Error Handling:**
- Use `asyncio.gather()` for parallel operations with individual try/except
- Async methods return default values on error (graceful degradation)

## Logging

**Framework:** Custom logger in `src/pytrading/logger.py`

**Patterns:**
```python
from pytrading.logger import logger

logger.info(f"[LLM] {symbol} 开始生成投资见解...")
logger.error(f"[AI分析] {symbol} 分析失败! error: {e}")
logger.warning(f"[AI分析] {symbol} LLM增强失败: {e}")
```

**Format:** Include context prefix in brackets like `[LLM]`, `[AI分析]`, `[组件名]`

## Function Design

**Size:** Single responsibility per function; prefer small focused functions

**Parameters:**
- Type hints required for public APIs
- Use `Optional[Type]` for nullable parameters
- Use `Dict[str, Any]` for flexible data structures

**Return Values:**
- Always return consistent types
- Use fallback values for error cases rather than raising

## Module Design

**Exports:**
- Single main export per file preferred
- Use `__all__` to explicitly define public API

**Module Organization:**
```
src/pytrading/
├── __init__.py           # Package marker
├── config/               # Configuration
├── db/                   # Database models
├── logger.py             # Logging
├── model/                # Data models
├── schemas/              # Pydantic schemas
├── service/              # Business logic services
├── strategy/             # Trading strategies
└── utils/                # Utilities
```

**Global Instances:**
- Services often have global singleton instances at module level:
```python
# 全局LLM服务实例
llm_service = LLMService()
```

## Testing Patterns

**See TESTING.md for detailed testing conventions.**

---

*Convention analysis: 2026-04-30*
