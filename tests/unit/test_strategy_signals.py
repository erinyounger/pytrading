"""
MACD 策略信号单元测试

测试策略核心逻辑: 交叉检测、仓位管理、止损机制和订单生成.
所有测试不依赖 talib, 直接使用 numpy 数组验证信号检测方法.
命名遵循: test_<模块>_<场景>_<预期结果>
"""

import numpy as np
import pytest

from tests.fixtures.market_data import (
    golden_cross_macd,
    dead_cross_macd,
    up_cross_zero_axis,
    down_cross_zero_axis,
    bullish_trending,
    bearish_trending,
    sideways_market,
    no_cross_positive,
)


@pytest.fixture
def strategy():
    """创建 MacdStrategy 实例"""
    from pytrading.strategy.strategy_macd import MacdStrategy

    return MacdStrategy(short=12, long=26, period=3000, atr_multiplier=2.0)


@pytest.fixture
def macd_point_factory():
    """MACDPoint 工厂"""
    from pytrading.strategy.strategy_macd import MACDPoint

    def _create(diff, dea, macd, datetime="2024-06-01"):
        return MACDPoint(datetime=datetime, diff=diff, dea=dea, macd=macd)

    return _create


# ============================================================
# 一、交叉检测方法参数化测试
# ============================================================


class TestGoldenCrossDetection:
    """金叉检测 (is_golden_x)"""

    @pytest.mark.parametrize(
        "macd_values, expected",
        [
            (np.array([-0.05, 0.03]), True),  # 从负变正: 金叉
            (np.array([-0.01, 0.00]), True),  # 恰好为零: 金叉
            (np.array([0.03, 0.05]), False),  # 持续正值: 非金叉
            (np.array([-0.03, -0.01]), False),  # 持续负值: 非金叉
            (np.array([0.01, -0.03]), False),  # 从正变负: 死叉
        ],
        ids=["neg_to_pos", "neg_to_zero", "always_pos", "always_neg", "pos_to_neg"],
    )
    def test_golden_x_parametrized(self, strategy, macd_values, expected):
        """参数化验证金叉判定条件"""
        assert strategy.is_golden_x(macd_values) is expected

    def test_golden_x_with_fixture_data(self, strategy):
        """使用市场数据夹具验证金叉"""
        data = golden_cross_macd()
        assert strategy.is_golden_x(data["macd"]) is True

    def test_golden_x_rejects_dead_cross_data(self, strategy):
        """死叉数据不应被识别为金叉"""
        data = dead_cross_macd()
        assert strategy.is_golden_x(data["macd"]) is False

    def test_golden_x_short_array_returns_false(self, strategy):
        """不足两根数据时返回 False"""
        assert strategy.is_golden_x(np.array([0.01])) is False


class TestDeadCrossDetection:
    """死叉检测 (is_dead_x)"""

    @pytest.mark.parametrize(
        "macd_values, expected",
        [
            (np.array([0.05, -0.03]), True),  # 从正变负: 死叉
            (np.array([-0.01, -0.05]), False),  # 持续负值: 非死叉
            (np.array([0.03, 0.05]), False),  # 持续正值: 非死叉
            (np.array([-0.03, 0.01]), False),  # 从负变正: 金叉
            (np.array([0.00, -0.01]), True),  # 零变负: 死叉
        ],
        ids=["pos_to_neg", "always_neg", "always_pos", "neg_to_pos", "zero_to_neg"],
    )
    def test_dead_x_parametrized(self, strategy, macd_values, expected):
        """参数化验证死叉判定条件"""
        assert strategy.is_dead_x(macd_values) is expected

    def test_dead_x_with_fixture_data(self, strategy):
        """使用市场数据夹具验证死叉"""
        data = dead_cross_macd()
        assert strategy.is_dead_x(data["macd"]) is True


class TestZeroAxisCross:
    """零轴线穿越检测"""

    @pytest.mark.parametrize(
        "diff_values, expected_up, expected_down",
        [
            (np.array([-0.02, 0.03]), True, False),  # 上穿
            (np.array([0.02, -0.03]), False, True),  # 下穿
            (np.array([0.01, 0.05]), False, False),  # 始终在上方
            (np.array([-0.05, -0.02]), False, False),  # 始终在下方
            (np.array([-0.01, 0.00]), True, False),  # 恰好到零: 算上穿
        ],
        ids=["up_cross", "down_cross", "always_above", "always_below", "to_zero"],
    )
    def test_zero_axis_cross_parametrized(
        self, strategy, diff_values, expected_up, expected_down
    ):
        """参数化验证零轴穿越方向"""
        assert strategy.is_up_cross_zero_axis(diff_values) is expected_up
        assert strategy.is_down_cross_zero_axis(diff_values) is expected_down

    def test_up_cross_with_fixture(self, strategy):
        """使用市场数据夹具验证上穿零轴"""
        data = up_cross_zero_axis()
        assert strategy.is_up_cross_zero_axis(data["diff"]) is True

    def test_down_cross_with_fixture(self, strategy):
        """使用市场数据夹具验证下穿零轴"""
        data = down_cross_zero_axis()
        assert strategy.is_down_cross_zero_axis(data["diff"]) is True

    def test_short_array_returns_false(self, strategy):
        """不足两根数据时返回 False"""
        assert strategy.is_up_cross_zero_axis(np.array([0.01])) is False
        assert strategy.is_down_cross_zero_axis(np.array([-0.01])) is False


class TestZeroAxisPosition:
    """零轴位置判断"""

    @pytest.mark.parametrize(
        "diff_values, above, under",
        [
            (np.array([0.05]), True, False),
            (np.array([-0.05]), False, True),
            (np.array([0.0]), False, True),  # 零点归类为下方
        ],
        ids=["above", "below", "at_zero"],
    )
    def test_axis_position(self, strategy, diff_values, above, under):
        assert strategy.is_above_zero_axis(diff_values) is above
        assert strategy.is_under_zero_axis(diff_values) is under


# ============================================================
# 二、DIF 连续涨跌检测
# ============================================================


class TestDiffTrending:
    """DIF 连续上涨/下跌检测"""

    def test_rising_3day_with_bullish_data(self, strategy):
        """看涨数据应检测到连续上涨"""
        data = bullish_trending()
        assert strategy.is_diff_rising_nday(data["diff"], nday=3) is True

    def test_rising_3day_with_bearish_data(self, strategy):
        """看跌数据不应检测到上涨"""
        data = bearish_trending()
        assert strategy.is_diff_rising_nday(data["diff"], nday=3) is False

    def test_declining_3day_with_bullish_data(self, strategy):
        """看涨数据应检测到 DIF 下降 (数值虽在上升, 但 declining 计算逻辑反向)"""
        data = bullish_trending()
        assert strategy.is_diff_declining_nday(data["diff"], nday=3) is False

    def test_sideways_not_rising(self, strategy):
        """横盘数据不应检测到连续上涨"""
        data = sideways_market()
        assert strategy.is_diff_rising_nday(data["diff"], nday=3) is False


# ============================================================
# 三、仓位管理
# ============================================================


class TestVolumeManagement:
    """仓位管理 (add_volume)"""

    @pytest.mark.parametrize(
        "additions, expected",
        [
            ([0.3], 0.3),  # 单次加仓
            ([0.3, 0.2], 0.5),  # 两次加仓
            ([0.5, 0.6], 1.0),  # 超过100%限制为1.0
            ([0.3, -0.5], 0.0),  # 减仓到零
            ([0.3, -0.1], 0.2),  # 部分减仓
        ],
        ids=["single_add", "double_add", "cap_at_100", "reduce_to_zero", "partial_reduce"],
    )
    def test_add_volume_parametrized(self, strategy, additions, expected):
        """参数化验证仓位增减计算"""
        for vol in additions:
            strategy.add_volume(vol)
        assert strategy.percent_volume == pytest.approx(expected, abs=0.001)

    def test_add_volume_returns_current_percent(self, strategy):
        """add_volume 返回当前仓位百分比"""
        result = strategy.add_volume(0.4)
        assert result == pytest.approx(0.4, abs=0.001)


# ============================================================
# 四、止损机制
# ============================================================


class TestATRStopLoss:
    """ATR 动态止损"""

    def test_atr_stop_loss_calculation(self, strategy):
        """计算止损价: 成本价 - ATR × 倍数"""
        stop = strategy.calculate_atr_stop_loss(cost_price=10.0, atr_value=0.5)
        # 10.0 - 0.5 * 2.0 = 9.0
        assert stop == pytest.approx(9.0, abs=0.01)

    def test_atr_stop_loss_none_inputs(self, strategy):
        """输入为 None 时返回 None"""
        assert strategy.calculate_atr_stop_loss(None, 0.5) is None
        assert strategy.calculate_atr_stop_loss(10.0, None) is None

    @pytest.mark.parametrize(
        "current_price, cost_price, percent_volume, atr_value, expected",
        [
            (8.5, 10.0, 0.5, 0.5, True),  # 8.5 <= 10.0 - 0.5*2.0 = 9.0 → 触发
            (9.5, 10.0, 0.5, 0.5, False),  # 9.5 > 9.0 → 不触发
            (8.5, 10.0, 0.0, 0.5, False),  # 无仓位 → 不触发
            (8.5, None, 0.5, 0.5, False),  # 无成本价 → 不触发
        ],
        ids=["triggered", "not_triggered", "no_position", "no_cost"],
    )
    def test_check_atr_stop_loss(
        self, strategy, current_price, cost_price, percent_volume, atr_value, expected
    ):
        """参数化验证 ATR 止损触发条件"""
        strategy.cost_price = cost_price
        strategy.percent_volume = percent_volume
        assert strategy.check_atr_stop_loss(current_price, atr_value) is expected


class TestFixedDrawdownStop:
    """固定回撤止损"""

    def test_drawdown_triggered(self, strategy):
        """回撤超过阈值触发止损"""
        strategy.max_price = 10.0
        strategy.percent_volume = 0.5
        strategy.max_drawdown_ratio = 0.08
        # 回撤 = (10.0 - 9.1) / 10.0 = 0.09 > 0.08
        order = strategy.check_fixed_drawdown_stop(9.1)
        assert order is not None
        assert order.signal_action == "close"
        assert order.signal_type == "fixed_drawdown_stop"

    def test_drawdown_not_triggered(self, strategy):
        """回撤未超过阈值不触发"""
        strategy.max_price = 10.0
        strategy.percent_volume = 0.5
        strategy.max_drawdown_ratio = 0.08
        # 回撤 = (10.0 - 9.5) / 10.0 = 0.05 < 0.08
        order = strategy.check_fixed_drawdown_stop(9.5)
        assert order is None

    def test_drawdown_no_position_skip(self, strategy):
        """无仓位时不触发"""
        strategy.max_price = 10.0
        strategy.percent_volume = 0.0
        assert strategy.check_fixed_drawdown_stop(5.0) is None

    def test_drawdown_no_max_price_skip(self, strategy):
        """无最高价记录时不触发"""
        strategy.percent_volume = 0.5
        strategy.max_price = None
        assert strategy.check_fixed_drawdown_stop(5.0) is None


# ============================================================
# 五、成本价管理
# ============================================================


class TestCostPriceManagement:
    """成本价和最高价跟踪"""

    def test_first_buy_sets_cost_price(self, strategy):
        """首次买入设置成本价和最高价"""
        strategy.percent_volume = 0.3
        strategy.update_cost_price(current_price=10.0, volume_change=0.3)
        assert strategy.cost_price == pytest.approx(10.0)
        assert strategy.max_price == pytest.approx(10.0)

    def test_add_position_updates_weighted_average(self, strategy):
        """加仓更新加权平均成本"""
        strategy.percent_volume = 0.5
        strategy.cost_price = 10.0
        strategy.max_price = 10.0
        # 加仓: 原来0.3仓位成本10, 新加0.2仓位成本12
        # percent_volume已是0.5, volume_change=0.2
        strategy.update_cost_price(current_price=12.0, volume_change=0.2)
        # 加权: (10.0 * 0.3 + 12.0 * 0.2) / 0.5 = 5.4 / 0.5 = 10.8
        assert strategy.cost_price == pytest.approx(10.8, abs=0.01)
        assert strategy.max_price == pytest.approx(12.0)

    def test_sell_keeps_cost_price(self, strategy):
        """卖出不改变成本价"""
        strategy.percent_volume = 0.5
        strategy.cost_price = 10.0
        strategy.max_price = 10.0
        strategy.update_cost_price(current_price=11.0, volume_change=-0.2)
        assert strategy.cost_price == pytest.approx(10.0)
        assert strategy.max_price == pytest.approx(11.0)  # 更新最高价


# ============================================================
# 六、清仓状态重置
# ============================================================


class TestSetClear:
    """清仓重置所有状态"""

    def test_set_clear_resets_all_signals(self, strategy):
        """set_clear 重置所有信号点和状态"""
        from pytrading.config.strategy_enum import TrendingType

        # 设置各种状态
        strategy.first_golden_x = "something"
        strategy.second_golden_x = "something"
        strategy.zero_axis_point = "something"
        strategy.first_dead_x = "something"
        strategy.second_dead_x = "something"
        strategy.percent_volume = 0.8
        strategy.trending_type = TrendingType.RisingUp
        strategy.cost_price = 10.0
        strategy.max_price = 12.0

        strategy.set_clear()

        assert strategy.first_golden_x is None
        assert strategy.second_golden_x is None
        assert strategy.zero_axis_point is None
        assert strategy.first_dead_x is None
        assert strategy.second_dead_x is None
        assert strategy.percent_volume == 0
        assert strategy.trending_type == TrendingType.TrendingUnknown
        assert strategy.cost_price is None
        assert strategy.max_price is None


# ============================================================
# 七、订单生成和信号元数据
# ============================================================


class TestOrderGeneration:
    """Order/OrderAction 测试"""

    def test_order_volume_creates_buy_order(self):
        """order_volume 创建指定量买入单"""
        from pytrading.config.order_enum import OrderAction

        order = OrderAction.order_volume(side="buy", trade_n=100)
        assert order.order_type == "order_volume"
        assert order.trade_n == 100
        assert order.side == "buy"

    def test_order_target_percent_creates_order(self):
        """order_target_percent 创建目标仓位单"""
        from pytrading.config.order_enum import OrderAction

        order = OrderAction.order_target_percent(side="buy", trade_n=0.9)
        assert order.order_type == "order_target_percent"
        assert order.trade_n == pytest.approx(0.9)

    def test_order_close_all_creates_order(self):
        """order_close_all 创建清仓单"""
        from pytrading.config.order_enum import OrderAction

        order = OrderAction.order_close_all()
        assert order.order_type == "order_close_all"
        assert order.trade_n is None
        assert order.side is None

    def test_with_signal_attaches_metadata(self):
        """with_signal 附加信号元数据并返回 self"""
        from pytrading.config.order_enum import OrderAction

        order = OrderAction.order_volume(side="buy", trade_n=100)
        result = order.with_signal("build", "建", "second_golden_x_under_zero")

        assert result is order  # 返回自身 (链式调用)
        assert order.signal_action == "build"
        assert order.signal_label == "建"
        assert order.signal_type == "second_golden_x_under_zero"

    @pytest.mark.parametrize(
        "action, label, signal_type",
        [
            ("build", "建", "second_golden_x_under_zero"),
            ("buy", "买90%", "up_cross_zero_axis"),
            ("sell", "卖50%", "first_dead_x"),
            ("close", "平", "atr_stop_loss"),
        ],
        ids=["build", "buy", "sell", "close"],
    )
    def test_signal_metadata_four_actions(self, action, label, signal_type):
        """验证四种交易动作的信号元数据"""
        from pytrading.config.order_enum import OrderAction

        order = OrderAction.order_volume(side="buy", trade_n=100)
        order.with_signal(action, label, signal_type)

        assert order.signal_action == action
        assert order.signal_label == label
        assert order.signal_type == signal_type


# ============================================================
# 八、MACDPoint 数据容器
# ============================================================


class TestMACDPoint:
    """MACDPoint 数据容器"""

    def test_macd_point_stores_values(self, macd_point_factory):
        """验证 MACDPoint 正确存储 MACD 三线值"""
        data = golden_cross_macd()
        point = macd_point_factory(data["diff"], data["dea"], data["macd"])
        diff, dea, macd = point.get_macd()
        np.testing.assert_array_equal(diff, data["diff"])
        np.testing.assert_array_equal(dea, data["dea"])
        np.testing.assert_array_equal(macd, data["macd"])

    def test_macd_point_position(self, macd_point_factory):
        """验证 MACDPoint 持仓信息设置"""
        data = golden_cross_macd()
        point = macd_point_factory(data["diff"], data["dea"], data["macd"])
        assert point.volume == 0
        assert point.available_now == 0

        point.set_position(volume=500, available_now=300)
        assert point.volume == 500
        assert point.available_now == 300


# ============================================================
# 九、策略初始化参数
# ============================================================


class TestStrategyInit:
    """策略初始化参数验证"""

    def test_default_parameters(self):
        """验证默认参数"""
        from pytrading.strategy.strategy_macd import MacdStrategy

        s = MacdStrategy()
        assert s.short == 12
        assert s.long == 26
        assert s.period == 3000
        assert s.atr_multiplier == 2.0

    def test_custom_parameters(self):
        """验证自定义参数"""
        from pytrading.strategy.strategy_macd import MacdStrategy

        s = MacdStrategy(short=5, long=20, period=1000, atr_multiplier=3.0)
        assert s.short == 5
        assert s.long == 20
        assert s.period == 1000
        assert s.atr_multiplier == 3.0

    def test_initial_state(self, strategy):
        """验证策略初始状态"""
        from pytrading.config.strategy_enum import TrendingType

        assert strategy.trending_type == TrendingType.TrendingUnknown
        assert strategy.percent_volume == 0.0
        assert strategy.cost_price is None
        assert strategy.max_price is None
        assert strategy.first_golden_x is None
        assert strategy.second_golden_x is None
