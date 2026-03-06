"""
全局测试夹具 - PyTrading 后端测试基础设施

提供:
- mock_gm_api: 自动 mock 掘金 SDK, 防止真实导入 (autouse, session scope)
- db_engine: SQLite 内存数据库引擎 (session scope)
- db_session: 自动回滚的数据库会话 (function scope)
- mock_config: Config 工厂函数, 支持自定义配置
"""

import sys
import types
from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker


# ============================================================
# gm.api mock — 必须在所有其他 import 之前注入 sys.modules
# ============================================================

@pytest.fixture(autouse=True, scope="session")
def mock_gm_api():
    """Mock 掘金量化 SDK, 防止测试中真实导入 gm.api.

    使用 types.ModuleType 构建模块对象, 使 `from gm.api import *` 能正确
    导出常量 (MagicMock 不支持 `import *`).
    """
    # 构建 gm.api 模块, 支持 `from gm.api import *`
    mock_gm_api_module = types.ModuleType("gm.api")
    mock_gm_api_module.MODE_BACKTEST = 2
    mock_gm_api_module.MODE_LIVE = 1
    mock_gm_api_module.OrderSide_Unknown = 0
    mock_gm_api_module.OrderSide_Buy = 1
    mock_gm_api_module.OrderSide_Sell = 2
    mock_gm_api_module.subscribe = MagicMock()
    mock_gm_api_module.schedule = MagicMock()
    mock_gm_api_module.order_volume = MagicMock()
    mock_gm_api_module.order_target_percent = MagicMock()
    mock_gm_api_module.order_close_all = MagicMock()

    # 构建 gm 父模块
    mock_gm = types.ModuleType("gm")
    mock_gm.api = mock_gm_api_module

    # Mock talib (C 扩展库, 测试环境可能未安装)
    mock_talib = MagicMock()
    mock_talib.MACD = MagicMock(return_value=(None, None, None))
    mock_talib.ATR = MagicMock(return_value=[0.0])

    sys.modules["gm"] = mock_gm
    sys.modules["gm.api"] = mock_gm_api_module
    sys.modules["talib"] = mock_talib

    yield mock_gm_api_module

    # 清理
    sys.modules.pop("gm", None)
    sys.modules.pop("gm.api", None)
    sys.modules.pop("talib", None)


# ============================================================
# 数据库 fixtures
# ============================================================

@pytest.fixture(scope="session")
def db_engine(mock_gm_api):
    """创建 SQLite 内存引擎并初始化所有 ORM 表.

    scope=session: 整个测试会话共享同一引擎, 避免重复建表开销.
    """
    from pytrading.db.mysql import Base

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False,
    )

    # SQLite 默认不强制外键约束, 启用之
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine):
    """提供自动回滚的数据库会话.

    每个测试函数获得独立的 session, 测试结束后自动 rollback + close,
    保证测试之间数据完全隔离.
    """
    Session = sessionmaker(bind=db_engine)
    session = Session()

    yield session

    session.rollback()
    session.close()


# ============================================================
# 配置 fixture
# ============================================================

@pytest.fixture
def mock_config(mock_gm_api):
    """Config 工厂 fixture, 支持自定义配置参数.

    用法:
        def test_something(mock_config):
            config = mock_config(trading_mode='live', save_db=True)
            assert config.trading_mode == 1  # MODE_LIVE
    """
    from pytrading.config.settings import Config

    def _factory(**kwargs):
        defaults = {
            "trading_mode": "backtest",
            "save_db": False,
            "db_type": "mysql",
            "log_level": "INFO",
            "mysql_host": "localhost",
            "mysql_port": 3306,
            "mysql_username": "test",
            "mysql_password": "test",
            "mysql_database": "pytrading_test",
            "symbols": "",
            "index_symbol": "SHSE.000300",
            "start_time": "2024-01-01 09:00:00",
            "end_time": "2025-06-30 15:00:00",
        }
        defaults.update(kwargs)
        return Config(**defaults)

    return _factory
