"""
WatchType 枚举和映射函数单元测试

验证关注类型枚举、TrendingType 到 WatchType 的映射逻辑.
命名遵循: test_<场景>_<预期结果>
"""

import pytest
from pytrading.config.watch_type import WatchType
from pytrading.config.strategy_enum import TrendingType


class TestWatchTypeEnumValues:
    """测试 WatchType 枚举值"""

    def test_watch_type_has_correct_values(self):
        """验证所有关注类型枚举值正确"""
        assert WatchType.NO_STATE.value == "无状态"
        assert WatchType.WATCHING.value == "关注中"
        assert WatchType.TREND_UP.value == "趋势上涨"
        assert WatchType.TREND_DOWN.value == "趋势下行"
        assert WatchType.TREND_END.value == "趋势结束"


class TestWatchTypeFromTrendingType:
    """测试 from_trending_type 映射函数"""

    def test_from_trending_type_unknown_returns_no_state(self):
        """验证 Unknown 映射为无状态"""
        # TrendingType 是字符串常量类，不是枚举
        result = WatchType.from_trending_type(TrendingType.TrendingUnknown)
        assert result == WatchType.NO_STATE

    def test_from_trending_type_up_down_returns_no_state(self):
        """验证 UpDown (横盘震荡) 映射为无状态"""
        result = WatchType.from_trending_type(TrendingType.UpAndDown)
        assert result == WatchType.NO_STATE

    def test_from_trending_type_observing_returns_watching(self):
        """验证 Observing 映射为关注中"""
        result = WatchType.from_trending_type(TrendingType.Observing)
        assert result == WatchType.WATCHING

    def test_from_trending_type_rising_up_returns_trend_up(self):
        """验证 RisingUp 映射为趋势上涨"""
        result = WatchType.from_trending_type(TrendingType.RisingUp)
        assert result == WatchType.TREND_UP

    def test_from_trending_type_zero_axis_up_returns_trend_up(self):
        """验证 ZeroAxisUp 映射为趋势上涨"""
        result = WatchType.from_trending_type(TrendingType.ZeroAxisRisingUp)
        assert result == WatchType.TREND_UP

    def test_from_trending_type_dead_x_down_returns_trend_down(self):
        """验证 DeadXDown 映射为趋势下行"""
        result = WatchType.from_trending_type(TrendingType.DeadXDecliningDown)
        assert result == WatchType.TREND_DOWN

    def test_from_trending_type_falling_down_returns_trend_down(self):
        """验证 FallingDown 映射为趋势下行"""
        result = WatchType.from_trending_type(TrendingType.ContinueDecliningDown)
        assert result == WatchType.TREND_DOWN

    def test_from_trending_type_with_close_signal_returns_trend_end(self):
        """验证有清仓信号时返回趋势结束(最高优先级)"""
        result = WatchType.from_trending_type(
            TrendingType.RisingUp,
            has_close_signal=True
        )
        assert result == WatchType.TREND_END

    def test_from_trending_type_none_returns_no_state(self):
        """验证 None 输入返回无状态"""
        result = WatchType.from_trending_type(None)
        assert result == WatchType.NO_STATE

    def test_from_trending_type_empty_string_returns_no_state(self):
        """验证空字符串输入返回无状态"""
        result = WatchType.from_trending_type("")
        assert result == WatchType.NO_STATE

    def test_from_trending_type_unknown_value_returns_no_state(self):
        """验证未知 TrendingType 值返回无状态"""
        result = WatchType.from_trending_type("UnknownType")
        assert result == WatchType.NO_STATE


class TestWatchTypeParticipatesInChangeDetection:
    """测试 participates_in_change_detection 方法"""

    def test_no_state_does_not_participate(self):
        """验证无状态不参与变化检测"""
        assert WatchType.NO_STATE.participates_in_change_detection() is False

    def test_watching_participates(self):
        """验证关注中参与变化检测"""
        assert WatchType.WATCHING.participates_in_change_detection() is True

    def test_trend_up_participates(self):
        """验证趋势上涨参与变化检测"""
        assert WatchType.TREND_UP.participates_in_change_detection() is True

    def test_trend_down_participates(self):
        """验证趋势下行参与变化检测"""
        assert WatchType.TREND_DOWN.participates_in_change_detection() is True

    def test_trend_end_participates(self):
        """验证趋势结束参与变化检测"""
        assert WatchType.TREND_END.participates_in_change_detection() is True


class TestWatchTypeDisplayName:
    """测试 display_name 属性"""

    def test_display_name_returns_value(self):
        """验证 display_name 返回中文值"""
        assert WatchType.TREND_UP.display_name == "趋势上涨"
        assert WatchType.TREND_DOWN.display_name == "趋势下行"
        assert WatchType.WATCHING.display_name == "关注中"
        assert WatchType.NO_STATE.display_name == "无状态"
        assert WatchType.TREND_END.display_name == "趋势结束"
