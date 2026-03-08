"""
WatchlistService 单元测试

验证关注列表服务的 ORM 模型和业务逻辑.
命名遵循: test_<场景>_<预期结果>
"""

import pytest
from datetime import datetime


class TestWatchlistItemModel:
    """测试 WatchlistItem ORM 模型"""

    def test_watchlist_item_create(self, db_session):
        """验证创建关注条目"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600300",
            name="测试股票",
            strategy_id=1,
            watch_type="无状态",
        )
        db_session.add(item)
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600300").first()

        assert result is not None
        assert result.symbol == "SHSE.600300"
        assert result.name == "测试股票"
        assert result.strategy_id == 1
        assert result.watch_type == "无状态"

    def test_watchlist_item_defaults(self, db_session):
        """验证默认值"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600301",
            name="测试股票",
            strategy_id=1,
        )
        db_session.add(item)
        db_session.flush()

        assert item.watch_type == "无状态"
        assert item.type_changed is False

    def test_watchlist_item_unique_constraint(self, db_session):
        """验证唯一约束"""
        from pytrading.db.mysql import WatchlistItem

        item1 = WatchlistItem(
            symbol="SHSE.600302",
            name="股票1",
            strategy_id=1,
        )
        db_session.add(item1)
        db_session.flush()

        item2 = WatchlistItem(
            symbol="SHSE.600302",
            name="股票2",
            strategy_id=1,
        )
        db_session.add(item2)

        with pytest.raises(Exception):
            db_session.flush()

    def test_watchlist_item_different_strategy(self, db_session):
        """验证不同策略可以有相同股票"""
        from pytrading.db.mysql import WatchlistItem

        item1 = WatchlistItem(symbol="SHSE.600303", name="股票", strategy_id=1)
        item2 = WatchlistItem(symbol="SHSE.600303", name="股票", strategy_id=2)
        db_session.add(item1)
        db_session.add(item2)
        db_session.flush()

        results = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600303").all()
        assert len(results) == 2


class TestWatchlistItemBacktestRef:
    """测试回测任务关联"""

    def test_store_backtest_task_id(self, db_session):
        """验证存储回测任务ID"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600304",
            name="测试",
            strategy_id=1,
            last_backtest_task_id="watchlist-abc12345",
        )
        db_session.add(item)
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600304").first()
        assert result.last_backtest_task_id == "watchlist-abc12345"

    def test_backtest_task_id_nullable(self, db_session):
        """验证回测任务ID可为空（新关注未回测）"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600305",
            name="测试",
            strategy_id=1,
        )
        db_session.add(item)
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600305").first()
        assert result.last_backtest_task_id is None


class TestWatchlistItemChangeTracking:
    """测试变化跟踪"""

    def test_type_changed_flag(self, db_session):
        """验证类型变化标志"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600306",
            name="测试",
            strategy_id=1,
            watch_type="趋势上涨",
            type_changed=True,
            type_changed_at=datetime.now(),
        )
        db_session.add(item)
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600306").first()
        assert result.type_changed is True

    def test_previous_watch_type(self, db_session):
        """验证保存上一次关注类型"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600307",
            name="测试",
            strategy_id=1,
            watch_type="趋势下行",
            previous_watch_type="趋势上涨",
        )
        db_session.add(item)
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600307").first()
        assert result.previous_watch_type == "趋势上涨"
        assert result.watch_type == "趋势下行"

    def test_mark_as_read(self, db_session):
        """验证标记已读"""
        from pytrading.db.mysql import WatchlistItem

        item = WatchlistItem(
            symbol="SHSE.600308",
            name="测试",
            strategy_id=1,
            watch_type="趋势上涨",
            type_changed=True,
        )
        db_session.add(item)
        db_session.flush()

        # 标记已读
        item.type_changed = False
        db_session.flush()

        result = db_session.query(WatchlistItem).filter_by(symbol="SHSE.600308").first()
        assert result.type_changed is False
