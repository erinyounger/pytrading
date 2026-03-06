"""
Config 类单元测试

验证统一配置管理的默认值、环境变量覆盖和交易模式映射.
命名遵循: test_config_<场景>_<预期结果>
"""

import pytest


class TestConfigDefaults:
    """测试 Config 默认值"""

    def test_config_default_values_correct(self, mock_config):
        """验证 Config 各属性默认值"""
        config = mock_config()

        assert config.save_db is False
        assert config.db_type == "mysql"
        assert config.log_level == "INFO"
        assert config.mysql_host == "localhost"
        assert config.mysql_port == 3306
        assert config.index_symbol == "SHSE.000300"

    def test_config_default_trading_mode_is_backtest(self, mock_config):
        """验证默认交易模式为回测"""
        config = mock_config()
        # MODE_BACKTEST = 2 (from mock)
        assert config.trading_mode == 2

    def test_config_default_symbols_empty_list(self, mock_config):
        """验证默认股票列表为空"""
        config = mock_config(symbols="")
        assert config.symbols == []


class TestConfigOverrides:
    """测试环境变量覆盖"""

    def test_config_custom_env_overrides_defaults(self, mock_config):
        """使用自定义参数覆盖默认值"""
        config = mock_config(
            save_db=True,
            db_type="sqlite",
            log_level="DEBUG",
            mysql_host="192.168.1.100",
            mysql_port=3307,
        )

        assert config.save_db is True
        assert config.db_type == "sqlite"
        assert config.log_level == "DEBUG"
        assert config.mysql_host == "192.168.1.100"
        assert config.mysql_port == 3307

    def test_config_symbols_parsed_from_comma_string(self, mock_config):
        """验证逗号分隔的股票代码字符串正确解析为列表"""
        config = mock_config(symbols="SHSE.600000, SZSE.000001, SHSE.600036")
        assert config.symbols == ["SHSE.600000", "SZSE.000001", "SHSE.600036"]

    def test_config_symbols_strips_whitespace(self, mock_config):
        """验证股票代码前后空白被去除"""
        config = mock_config(symbols="  SHSE.600000 ,  SZSE.000001  ")
        assert config.symbols == ["SHSE.600000", "SZSE.000001"]


class TestConfigTradingMode:
    """测试交易模式映射"""

    def test_config_trading_mode_backtest_maps_to_constant(self, mock_config):
        """验证 'backtest' 映射为 MODE_BACKTEST 常量"""
        config = mock_config(trading_mode="backtest")
        # mock_gm_api.MODE_BACKTEST = 2
        assert config.trading_mode == 2

    def test_config_trading_mode_live_maps_to_constant(self, mock_config):
        """验证 'live' 映射为 MODE_LIVE 常量"""
        config = mock_config(trading_mode="live")
        # mock_gm_api.MODE_LIVE = 1
        assert config.trading_mode == 1

    def test_config_strategy_id_follows_trading_mode(self, mock_config):
        """验证策略 ID 跟随交易模式切换"""
        config = mock_config(
            trading_mode="backtest",
            backtest_strategy_id="bt-123",
            live_strategy_id="live-456",
        )
        assert config.strategy_id == "bt-123"

    def test_config_token_follows_trading_mode(self, mock_config):
        """验证 token 跟随交易模式切换"""
        config = mock_config(
            trading_mode="live",
            backtest_trading_token="bt-token",
            live_trading_token="live-token",
        )
        assert config.token == "live-token"


class TestConfigAccessors:
    """测试配置访问方法"""

    def test_config_getitem_returns_attribute(self, mock_config):
        """验证 [] 访问返回属性值"""
        config = mock_config(db_type="mysql")
        assert config["db_type"] == "mysql"

    def test_config_get_returns_default_for_missing(self, mock_config):
        """验证 get() 对不存在的属性返回默认值"""
        config = mock_config()
        assert config.get("nonexistent", "fallback") == "fallback"

    def test_config_to_dict_returns_all_fields(self, mock_config):
        """验证 to_dict() 包含所有公共字段"""
        config = mock_config()
        d = config.to_dict()
        assert "db_type" in d
        assert "save_db" in d
        assert "trading_mode" in d
