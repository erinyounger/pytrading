# Testing Patterns

**Analysis Date:** 2026-04-30

## Test Framework

**Python Backend:**
- **Runner:** pytest 8.0+
- **Assertion:** Built-in pytest assertions with `pytest-cov` for coverage
- **Async Support:** `pytest-asyncio` for async tests (`@pytest.mark.asyncio`)
- **Mocking:** `pytest-mock` + `unittest.mock`
- **Config:** `pyproject.toml` section `[tool.pytest.ini_options]`

**Frontend (React):**
- **Runner:** Create React App built-in Jest
- **Assertion:** `@testing-library/jest-dom` for DOM assertions
- **React Testing:** `@testing-library/react` for component tests
- **User Events:** `@testing-library/user-event`

## Run Commands

**Python Backend:**
```bash
pytest                           # Run all tests
pytest -v --tb=short            # Verbose with short traceback
pytest tests/unit/              # Unit tests only
pytest tests/integration/       # Integration tests only
pytest --cov=src/pytrading     # With coverage
pytest -k "test_name"          # Run specific test by name
```

**Frontend:**
```bash
cd frontend
npm test                         # Run tests in watch mode
npm test -- --watchAll=false    # Run once
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root (not co-located with source)
- Backend tests: `/home/eeric/code/pytrading/tests/`
- Frontend tests: `/home/eeric/code/pytrading/frontend/src/__tests__/`

**Python Structure:**
```
tests/
├── conftest.py              # Shared fixtures
├── __init__.py
├── unit/                    # Unit tests
│   ├── test_llm_service.py
│   ├── test_watchlist_service.py
│   └── ...
├── integration/             # Integration tests
│   └── test_watchlist_api.py
└── fixtures/               # Test data fixtures
    ├── __init__.py
    └── market_data.py
```

**Naming Conventions:**
- Python: `test_*.py` for test files, `Test*` for classes, `test_*` for methods
- TypeScript: `*.test.tsx` for components, `*.test.ts` for utilities

## Test Structure

**Python Test Class Pattern:**
```python
class TestLLMService:
    """LLM服务测试类"""

    def setup_method(self):
        """测试前准备"""
        self.llm_service = LLMService()
        # Setup test environment

    def test_format_prompt(self):
        """测试提示词格式化"""
        # Arrange
        analysis_data = {...}
        # Act
        prompt = self.llm_service.format_prompt("SHSE.600000", analysis_data)
        # Assert
        assert "SHSE.600000" in prompt
```

**Async Test Pattern:**
```python
@pytest.mark.asyncio
async def test_generate_insight_mock(self):
    """测试生成投顾见解（模拟）"""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "建议关注该股票。"

    mock_client_instance = AsyncMock()
    mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)

    original_client = self.llm_service._client
    self.llm_service._client = mock_client_instance

    try:
        result = await self.llm_service.generate_insight("SHSE.600000", analysis_data)
        assert len(result) > 0
    finally:
        self.llm_service._client = original_client
```

**Frontend Test Pattern:**
```typescript
describe('Watchlist 页面测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('页面渲染空列表', async () => {
    mockApi.getWatchlist.mockResolvedValue({ data: [], total: 0 });
    render(<Watchlist />);
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.queryByTestId('empty')).toBeInTheDocument();
  });
});
```

## Mocking

**Framework:** `unittest.mock` (Python), Jest mocks (JavaScript)

**Python Patterns:**

1. **Mocking gm.api (session-scoped, autouse):**
```python
@pytest.fixture(autouse=True, scope="session")
def mock_gm_api():
    """Mock 掘金量化 SDK, 防止测试中真实导入 gm.api."""
    mock_gm_api_module = types.ModuleType("gm.api")
    mock_gm_api_module.MODE_BACKTEST = 2
    mock_gm_api_module.MODE_LIVE = 1
    mock_gm_api_module.subscribe = MagicMock()
    sys.modules["gm"] = mock_gm
    sys.modules["gm.api"] = mock_gm_api_module
    yield mock_gm_api_module
```

2. **Patching object methods:**
```python
with patch.object(self.analyzer.akshare, 'get_stock_sentiment') as mock:
    mock.return_value = {"symbol": "SHSE.600000", "hot_rank": 10}
    result = await self.analyzer.analyze_sentiment("SHSE.600000")
```

3. **Temporary client swap:**
```python
original_client = self.llm_service._client
self.llm_service._client = mock_client_instance
try:
    result = await self.llm_service.generate_insight(...)
finally:
    self.llm_service._client = original_client
```

**Frontend Mocks:**
```typescript
jest.mock('antd', () => ({
  ...actual,
  Table: ({ dataSource }: any) => <div data-testid="table">{/* render */}</div>,
  message: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../services/api', () => ({
  apiService: { getWatchlist: jest.fn() },
}));
```

## Fixtures and Factories

**Shared Backend Fixtures** (`tests/conftest.py`):
- `mock_gm_api`: Session-scoped, autouse mock for gm SDK
- `db_engine`: SQLite in-memory database engine (session scope)
- `db_session`: Auto-rollback database session (function scope)
- `mock_config`: Config factory function with customizable parameters

**Database Fixture Pattern:**
```python
@pytest.fixture(scope="function")
def db_session(db_engine):
    """提供自动回滚的数据库会话"""
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()
```

**Market Data Fixtures** (`tests/fixtures/market_data.py`):
```python
def golden_cross_macd():
    """金叉场景: MACD 柱状图从负变正"""
    return {
        "diff": np.array([-0.15, -0.12, -0.08, -0.04, -0.01]),
        "dea": np.array([-0.10, -0.09, -0.07, -0.05, -0.03]),
        "macd": np.array([-0.10, -0.06, -0.02, -0.01, 0.04]),
    }
```

## Coverage

**Backend Requirements:**
- Minimum coverage target: not explicitly defined
- Source: `["src/pytrading"]`
- Omit: `src/pytrading/run/*`, `src/pytrading/py_trading.py`, `tests/*`

**Run with Coverage:**
```bash
pytest --cov=src/pytrading --cov-report=term-missing
```

**Excluded from Coverage:**
```python
[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if __name__ == .__main__.",
]
```

## Test Types

**Unit Tests:**
- Test individual services, models, utilities
- Use mocked dependencies
- Located in `tests/unit/`

**Integration Tests:**
- Test API endpoints with FastAPI TestClient
- Located in `tests/integration/`
- Example: `test_watchlist_api.py`

**Frontend Component Tests:**
- Test React components in isolation
- Mock external dependencies (API, Ant Design components)
- Located in `frontend/src/__tests__/`

## Test Naming

**Pattern:** `test_<场景>_<预期结果>`

Examples:
- `test_format_prompt` - test format_prompt function
- `test_format_prompt_no_events` - test format_prompt with no events
- `test_validate_response_valid` - test validate_response with valid input
- `test_generate_insight_error_fallback` - test error fallback

## Common Patterns

**Async Testing:**
```python
@pytest.mark.asyncio
async def test_something(self):
    result = await service.async_method()
    assert result is not None
```

**Error Testing:**
```python
def test_validate_response_empty(self):
    assert self.llm_service.validate_response("") is False
    assert self.llm_service.validate_response("   ") is False

def test_watchlist_item_unique_constraint(self, db_session):
    # ... create item1
    with pytest.raises(Exception):
        db_session.flush()
```

**Setup/Teardown:**
```python
def setup_method(self):
    """Runs before each test method"""
    self.service = MyService()

def teardown_method(self):
    """Runs after each test method"""
    pass  # cleanup if needed
```

---

*Testing analysis: 2026-04-30*
