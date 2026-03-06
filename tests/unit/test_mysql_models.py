"""
ORM 模型单元测试

使用 SQLite 内存数据库验证模型 CRUD 操作和 fixture 隔离性.
命名遵循: test_<模型>_<场景>_<预期结果>
"""

import pytest
from datetime import datetime


class TestStrategyModel:
    """Strategy 模型测试"""

    def test_strategy_model_create_and_query_returns_record(self, db_session):
        """创建 Strategy 记录并查询验证字段值"""
        from pytrading.db.mysql import Strategy

        strategy = Strategy(
            name="macd",
            display_name="MACD策略",
            description="基于MACD指标的趋势跟踪策略",
            strategy_type="trend",
            is_active=True,
        )
        db_session.add(strategy)
        db_session.flush()

        result = db_session.query(Strategy).filter_by(name="macd").first()

        assert result is not None
        assert result.name == "macd"
        assert result.display_name == "MACD策略"
        assert result.strategy_type == "trend"
        assert result.is_active is True

    def test_strategy_model_parameters_stores_json(self, db_session):
        """验证 JSON 参数字段正确存储和读取"""
        from pytrading.db.mysql import Strategy

        params = {"fast_period": 12, "slow_period": 26, "signal_period": 9}
        strategy = Strategy(
            name="macd_custom",
            display_name="自定义MACD",
            strategy_type="trend",
            parameters=params,
        )
        db_session.add(strategy)
        db_session.flush()

        result = db_session.query(Strategy).filter_by(name="macd_custom").first()
        assert result.parameters == params


class TestBackTestResultModel:
    """BackTestResult 模型测试"""

    def test_backtest_result_model_stores_metrics_correctly(self, db_session):
        """创建 BackTestResult 并验证指标字段"""
        from pytrading.db.mysql import BackTestResult
        from decimal import Decimal

        result = BackTestResult(
            task_id="task-001",
            strategy_id=1,
            symbol="SHSE.600000",
            name="浦发银行",
            strategy_name="MACD",
            sharp_ratio=Decimal("1.5432"),
            max_drawdown=Decimal("-0.1234"),
            win_ratio=Decimal("0.6500"),
            pnl_ratio=Decimal("0.2345"),
            open_count=10,
            close_count=8,
            win_count=6,
            lose_count=2,
            total_trades=8,
            win_trades=6,
        )
        db_session.add(result)
        db_session.flush()

        record = db_session.query(BackTestResult).filter_by(symbol="SHSE.600000").first()

        assert record is not None
        assert record.task_id == "task-001"
        assert record.strategy_name == "MACD"
        assert float(record.sharp_ratio) == pytest.approx(1.5432, abs=0.001)
        assert float(record.max_drawdown) == pytest.approx(-0.1234, abs=0.001)
        assert float(record.win_ratio) == pytest.approx(0.65, abs=0.001)


class TestTradeRecordModel:
    """TradeRecord 模型测试"""

    def test_trade_record_create_with_all_actions(self, db_session):
        """验证四种交易动作(建/买/卖/平)均可正确存储"""
        from pytrading.db.mysql import TradeRecord

        actions = ["build", "buy", "sell", "close"]
        for i, action in enumerate(actions):
            record = TradeRecord(
                task_id="task-002",
                symbol="SHSE.600000",
                action=action,
                price=10.50 + i,
                volume=100 * (i + 1),
                bar_time=datetime(2024, 1, 1 + i, 10, 0),
            )
            db_session.add(record)

        db_session.flush()

        records = db_session.query(TradeRecord).filter_by(task_id="task-002").all()
        assert len(records) == 4
        stored_actions = {r.action for r in records}
        assert stored_actions == {"build", "buy", "sell", "close"}


class TestDbSessionIsolation:
    """验证 db_session fixture 的测试隔离性"""

    def test_db_session_insert_data_in_first_test(self, db_session):
        """在此测试中插入数据"""
        from pytrading.db.mysql import Strategy

        strategy = Strategy(
            name="isolation_test",
            display_name="隔离性测试",
            strategy_type="test",
        )
        db_session.add(strategy)
        db_session.flush()

        assert db_session.query(Strategy).filter_by(name="isolation_test").first() is not None

    def test_db_session_rollback_isolates_tests(self, db_session):
        """验证上一个测试的数据在此测试中不存在(已回滚)"""
        from pytrading.db.mysql import Strategy

        result = db_session.query(Strategy).filter_by(name="isolation_test").first()
        assert result is None, "上一个测试的数据应已回滚, 不应在此测试中可见"
