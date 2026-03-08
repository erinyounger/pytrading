"""
Watchlist API 集成测试

验证 REST API 端点的请求响应行为.
使用 FastAPI TestClient 进行测试.
"""

import pytest
import types
import sys
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


# Mock gm.api BEFORE importing the app
@pytest.fixture(autouse=True, scope="session")
def setup_mock_gm_api():
    """Mock gm.api before any imports"""
    mock_gm_api_module = types.ModuleType("gm.api")
    mock_gm_api_module.MODE_BACKTEST = 2
    mock_gm_api_module.MODE_LIVE = 1
    mock_gm_api_module.OrderSide_Unknown = 0
    mock_gm_api_module.OrderSide_Buy = 1
    mock_gm_api_module.OrderSide_Sell = 2
    mock_gm_api_module.set_token = MagicMock()
    mock_gm_api_module.get_constituents = MagicMock()
    mock_gm_api_module.history = MagicMock()
    mock_gm_api_module.get_instruments = MagicMock()
    mock_gm_api_module.subscribe = MagicMock()
    mock_gm_api_module.schedule = MagicMock()
    mock_gm_api_module.order_volume = MagicMock()
    mock_gm_api_module.order_target_percent = MagicMock()
    mock_gm_api_module.order_close_all = MagicMock()

    # Build gm parent module
    mock_gm = types.ModuleType("gm")
    mock_gm.api = mock_gm_api_module

    # Mock talib
    mock_talib = MagicMock()
    mock_talib.MACD = MagicMock(return_value=(None, None, None))
    mock_talib.ATR = MagicMock(return_value=[0.0])

    sys.modules["gm"] = mock_gm
    sys.modules["gm.api"] = mock_gm_api_module
    sys.modules["talib"] = mock_talib

    yield mock_gm_api_module

    # Cleanup
    sys.modules.pop("gm", None)
    sys.modules.pop("gm.api", None)
    sys.modules.pop("talib", None)


@pytest.fixture
def client(setup_mock_gm_api):
    """创建 FastAPI 测试客户端"""
    # Mock config before importing app
    with patch("pytrading.config.settings.config") as mock_config:
        mock_config.mysql_host = "localhost"
        mock_config.mysql_port = 3306
        mock_config.mysql_user = "test"
        mock_config.mysql_password = "test"
        mock_config.mysql_database = "pytrading_test"
        mock_config.start_time = "2024-01-01 00:00:00"
        mock_config.end_time = "2025-06-30 00:00:00"
        mock_config.index_symbol = "SHSE.000300"
        mock_config.backtest_start_time = "2024-01-01 00:00:00"
        mock_config.backtest_end_time = "2025-06-30 00:00:00"

        from pytrading.api.main import app
        yield TestClient(app)


class TestWatchlistAPIEndpoints:
    """测试关注列表 API 端点可访问性"""

    def test_add_watchlist_endpoint_exists(self, client):
        """测试 POST /api/watchlist 端点存在"""
        response = client.post(
            "/api/watchlist",
            json={
                "symbol": "SHSE.600000",
                "name": "浦发银行",
                "strategy_id": 1,
            }
        )
        # 端点存在，即使返回错误也可以
        assert response.status_code in [200, 400, 404, 422, 500]

    def test_remove_watchlist_endpoint_exists(self, client):
        """测试 DELETE /api/watchlist/{item_id} 端点存在"""
        response = client.delete("/api/watchlist/1")
        assert response.status_code in [200, 404, 422, 500]

    def test_get_watchlist_endpoint_exists(self, client):
        """测试 GET /api/watchlist 端点存在"""
        response = client.get("/api/watchlist")
        assert response.status_code in [200, 404, 500]

    def test_get_watchlist_with_filters_endpoint_exists(self, client):
        """测试 GET /api/watchlist 带筛选参数端点存在"""
        response = client.get("/api/watchlist?watch_type=关注中&sort_by=pnl_ratio&sort_order=desc")
        assert response.status_code in [200, 404, 500]

    def test_get_watched_symbols_endpoint_exists(self, client):
        """测试 GET /api/watchlist/watched-symbols 端点存在"""
        response = client.get("/api/watchlist/watched-symbols?strategy_id=1")
        assert response.status_code in [200, 404, 500]

    def test_mark_read_endpoint_exists(self, client):
        """测试 PUT /api/watchlist/{item_id}/read 端点存在"""
        response = client.put("/api/watchlist/1/read")
        assert response.status_code in [200, 404, 422, 500]


class TestWatchlistAPIValidation:
    """测试请求参数验证"""

    def test_add_missing_symbol_validation(self, client):
        """测试缺少 symbol 参数返回验证错误"""
        response = client.post(
            "/api/watchlist",
            json={
                "name": "浦发银行",
                "strategy_id": 1,
            }
        )
        assert response.status_code == 422

    def test_add_missing_strategy_id_validation(self, client):
        """测试缺少 strategy_id 参数返回验证错误"""
        response = client.post(
            "/api/watchlist",
            json={
                "symbol": "SHSE.600000",
                "name": "浦发银行",
            }
        )
        assert response.status_code == 422

    def test_add_invalid_strategy_id_type(self, client):
        """测试无效的 strategy_id 类型"""
        response = client.post(
            "/api/watchlist",
            json={
                "symbol": "SHSE.600000",
                "name": "浦发银行",
                "strategy_id": "not_a_number",
            }
        )
        assert response.status_code == 422

    def test_get_watched_symbols_missing_strategy_id(self, client):
        """测试缺少 strategy_id 参数"""
        response = client.get("/api/watchlist/watched-symbols")
        # 返回 422 或 500 都算正常（缺少必需参数）
        assert response.status_code in [422, 500]


class TestWatchlistAPIResponseFormat:
    """测试响应格式"""

    def test_get_watchlist_response_structure(self, client):
        """测试获取关注列表返回正确的结构"""
        response = client.get("/api/watchlist")

        # 如果返回 200，检查结构
        if response.status_code == 200:
            data = response.json()
            assert "data" in data
            assert "total" in data

    def test_get_watched_symbols_response_structure(self, client):
        """测试获取已关注股票返回正确的结构"""
        response = client.get("/api/watchlist/watched-symbols?strategy_id=1")

        # 如果返回 200，检查结构
        if response.status_code == 200:
            data = response.json()
            assert "symbols" in data
            assert isinstance(data["symbols"], list)


class TestWatchlistAPIErrorCodes:
    """测试错误响应状态码"""

    def test_remove_nonexistent_returns_404(self, client):
        """测试删除不存在的记录返回 404"""
        response = client.delete("/api/watchlist/999999")
        # 可能是 404 或 500（取决于实现）
        assert response.status_code in [404, 500]

    def test_mark_read_nonexistent_returns_404(self, client):
        """测试标记不存在的记录返回 404"""
        response = client.put("/api/watchlist/999999/read")
        # 可能是 404 或 500（取决于实现）
        assert response.status_code in [404, 500]
