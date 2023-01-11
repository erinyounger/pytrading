#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：macd_signal
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/6 22:42 
"""
import pandas as pd

from gm.api import *
from pytrading.logger import logger
from pytrading.strategy.base import StrategyBase
from pytrading.model.order_enum import OrderAction, Order
from pytrading.model.strategy_enum import TrendingType


class MACDPoint:
    datetime = None
    diff = 0
    dea = 0
    macd = 0

    volume = 0  # 总持仓量
    available_now = 0  # 当前可用仓位

    def __init__(self, datetime, diff: pd.DataFrame, dea: pd.DataFrame, macd: pd.DataFrame):
        self.datetime = datetime
        self.diff = diff
        self.dea = dea
        self.macd = macd

    def get_macd(self):
        return self.diff, self.dea, self.macd

    def get_datetime(self):
        return self.datetime

    def set_position(self, volume, available_now):
        self.volume = volume
        self.available_now = available_now


class XPointType:
    """金/死叉定义"""
    type = "GoldenX"  # 叉类型：GoldenX - 金叉，   DeadX - 死叉，  Axis0 - 零轴线
    diff = 0
    dea = 0
    macd = 0

    def __init__(self, xtype, diff, dea, macd):
        self.type = xtype
        self.diff = diff
        self.dea = dea
        self.macd = macd

    def is_golden(self):
        """是否金叉"""
        return self.type == "GoldenX"


class MACDSignalStrategy(StrategyBase):
    """交易信号"""
    order = None  # type: Order
    side = None  # 交易方向，OrderSide_Unknown - 不操作，  OrderSide_Buy - 买入，  OrderSide_Sell - 卖出
    order_type = OrderAction.order_unknown  # 交易单类型

    _clear = False  # 清仓标记

    first_golden_x = None  # 信号1：0轴线下方第一个金叉
    zero_axis_point = None  # 信号2：0轴线
    second_golden_x = None  # 信号3：第二个金叉

    first_dead_x = None  # 第一个死叉
    second_dead_x = None  # 第二个死叉

    trending_type = None  # 股票趋势类型
    percent_volume = 0.0  # type: float

    def __init__(self):
        self.side = OrderSide_Unknown
        self.trending_type = TrendingType.TrendingUnknown

    def create_golden_x(self, diff, dea, macd):
        """创建金叉"""
        return XPointType("GoldenX", diff, dea, macd)

    def create_zero_axis(self, diff, dea, macd):
        """创建金叉"""
        return XPointType("Axis0", diff, dea, macd)

    def create_dead_axis(self, diff, dea, macd):
        """创建死叉"""
        return XPointType("DeadX", diff, dea, macd)

    def check_and_set_first_golden_x(self, macd_point: MACDPoint):
        """检测和设置0轴线下第一个金叉"""
        diff, dea, macd = macd_point.get_macd()
        # if diff[-1] > 0:
        #     # 快线在0轴线上方，不在检查范围，直接返回
        #     return False

        # 出现0轴线下方金叉，且上一个状态是非交易状态，说明第一信号出现，需要关注
        if self.is_golden_x(macd) and self.trending_type == TrendingType.TrendingUnknown:
            self.first_golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            self.trending_type = TrendingType.Observing
            logger.info("[{}] First GoldenX, observing.".format(macd_point.get_datetime()))
            return True
        return False

    def is_golden_x(self, macd):
        """判断是否是金叉"""
        if len(macd) < 2:
            return False
        # MACD指标从负变为正即为金叉
        if macd[-1] >= 0 and macd[-2] < 0:
            return True
        return False

    def is_dead_x(self, macd):
        """判断是否是死叉"""
        if macd[-1] < 0 and macd[-2] >= 0:
            return True
        return False

    def is_observing(self):
        """判断是否是要关注该票"""
        return self.trending_type == TrendingType.Observing

    def is_up_cross_zero_axis(self, diff):
        """判断是否穿过0轴线"""
        if len(diff) < 2:
            return False
        if diff[-1] >= 0 and diff[-2] < 0:
            return True
        else:
            return False

    def is_down_cross_zero_axis(self, diff):
        """判断是否是0轴线"""
        if len(diff) < 2:
            return False
        elif diff[-1] < 0 and diff[-2] >= 0:
            return True
        else:
            return False

    def is_under_zero_axis(self, diff):
        """在零轴线下方"""
        return not self.is_above_zero_axis(diff)

    def is_above_zero_axis(self, diff):
        """是否在零轴线上方"""
        if diff[-1] > 0:
            return True
        elif diff[-1] < 0:
            return False
        return False

    def add_volume(self, volume: float):
        """增加仓位"""
        self.percent_volume += volume
        if self.percent_volume > 1.0:
            self.percent_volume = 1.0
        if self.percent_volume <= 0:
            self.percent_volume = 0
        return self.percent_volume

    def is_diff_declining_nday(self, diff, nday: int, step: float = 0.0):
        result = list()
        nday_diff = list(reversed(diff))[:nday]
        for idx, value in enumerate(nday_diff):
            if idx + 1 < nday:
                result.append((nday_diff[idx + 1] - value) > step and value > 0)
        return all(result)

    def is_diff_rising_nday(self, diff, nday: int, step: float = 0):
        """快线连续上涨n天"""
        result = list()
        nday_diff = list(reversed(diff))[:nday]
        for idx, value in enumerate(nday_diff):
            if idx + 1 < nday:
                result.append((value - nday_diff[idx + 1]) > step and value > 0)
        return all(result)

    def cmp_golden_x(self, goldenx1: XPointType, goldenx2: XPointType, step: float = 0):
        """对比两个金叉快线的大小"""
        return goldenx2.diff - goldenx1.diff > step

    def is_shocking(self):
        """买入时判断是否在震荡状态，震荡状态不进行操作"""
        # 震荡状态的判断
        # 1. 零轴线与下方第一或第二金叉离得太近
        # 2. 连续多根MACD柱子高度都矮，不操作
        if self.second_golden_x and self.zero_axis_point:
            return not self.cmp_golden_x(self.second_golden_x, self.zero_axis_point, step=0.2)
        if self.first_golden_x and self.zero_axis_point:
            return not self.cmp_golden_x(self.first_golden_x, self.zero_axis_point, step=0.2)
        # todo 通过macd柱子高度判断
        return True

    def run_order_100(self, macd_point: MACDPoint):
        """Debug 测试，买入100"""
        return OrderAction.order_volume(OrderSide_Buy, trade_n=100)

    def run_double_averages(self, macd_point: MACDPoint):
        """双均线交易策略"""
        # 初始化趋势交易状态，确认并且设置0轴线下是否出现第一个金叉，第一观察点出现
        self.check_and_set_first_golden_x(macd_point)
        # 0. 非趋势交易状态，直接退出
        if self.trending_type == TrendingType.TrendingUnknown:
            return
        diff, dea, macd = macd_point.get_macd()

        if not self.zero_axis_point \
                and self.first_golden_x \
                and self.is_up_cross_zero_axis(diff):
            self.zero_axis_point = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            self.trending_type = TrendingType.ZeroAxisRisingUp
            self.first_golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            percent_volume = self.add_volume(1.0)
            logger.info("[{}] Under ZeroAxis GoldenX, Buy Target To: {}".format(
                macd_point.get_datetime(), percent_volume))
            return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)

        if self.first_golden_x and self.is_dead_x(macd=macd):
            self.trending_type = TrendingType.DeadXDecliningDown
            self.first_dead_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            logger.info("[{}] DeadX, Sel Out 100%.".format(macd_point.get_datetime()))
            self.set_clear()
            return OrderAction.order_close_all()

    def run_macd(self, macd_point: MACDPoint):
        """MACD趋势交易具体实现"""

        # 初始化趋势交易状态，确认并且设置0轴线下是否出现第一个金叉，第一观察点出现
        if self.check_and_set_first_golden_x(macd_point):
            # 趋势交易初始化成功，本次直接退出
            return
        # 0. 非趋势交易状态，直接退出
        if self.trending_type == TrendingType.TrendingUnknown:
            return
        diff, dea, macd = macd_point.get_macd()

        # ---------------- 一、买入场景 ------------------
        # 买入场景1： 0轴线下方再次出现金叉，有可能不仅仅出现一次
        # 2.1：假如出现的金叉比第一个观察点的金叉快线高时，说明向上趋势出现，入场100
        # 2.2：假如出现的金叉比第一个观察点金叉快线低，说明还是向下趋势，继续观察，不入场
        if self.is_under_zero_axis(diff=diff) and self.is_golden_x(macd=macd):
            golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            if self.cmp_golden_x(self.first_golden_x, golden_x) <= 0:
                logger.info("[{}] Second golden x is smaller than first, Keep Observing".format(
                    macd_point.get_datetime()))
                self.first_golden_x = golden_x
                return
            if not self.second_golden_x and self.cmp_golden_x(self.first_golden_x, golden_x) > 0:
                self.trending_type = TrendingType.RisingUp
                self.second_golden_x = golden_x  # 暂不考虑second为None多次上串的场景
                logger.info("[{}] Second GoldenX Under Zero Axis, Buy count: 100".format(macd_point.get_datetime()))
                return OrderAction.order_volume(OrderSide_Buy, trade_n=100)

        # 买入场景2：零轴线下有最近一个是金叉，且刚好向上穿过零轴线，买入90%仓位
        if not self.zero_axis_point \
                and (self.first_golden_x or self.second_golden_x) \
                and self.is_up_cross_zero_axis(diff):
            # 买点：没有第二个金叉，直接0轴线，仓位调整买入至90%
            self.zero_axis_point = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            # if self.is_shocking():
            #     logger.warning("Stock is in Shocking Status, Skip Buy 90%.")
            #     return
            self.trending_type = TrendingType.ZeroAxisRisingUp
            percent_volume = self.add_volume(0.9)
            logger.info("[{}] Up Cross Zero Axis Line, Buy Target To: {}".format(
                macd_point.get_datetime(), percent_volume))
            # 调整仓位至80%
            return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)

        # 买入场景3：零轴线上方，且连续上涨N天
        if self.is_above_zero_axis(diff=diff):
            # 连续n天，快线增长超过0.1
            if self.is_diff_rising_nday(diff, nday=3, step=0.1) and self.percent_volume < 1.0:
                percent_volume = self.add_volume(0.15)
                logger.info("[{}] Rising Up 3 days, Add 15% Buy Target To: {}".format(
                    macd_point.get_datetime(), percent_volume))
                self.trending_type = TrendingType.ZeroAxisRisingUp
                return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)
            if self.is_golden_x(macd=macd):
                # 零轴线上方出现金叉上升趋势，增加仓位30%
                percent_volume = self.add_volume(0.3)
                logger.info("[{}] Above Zero Upper GoldenX, Add 30% Buy Target To: {}".format(
                    macd_point.get_datetime(), percent_volume))
                return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)
        # ---------------- 二、卖出场景 ------------------
        if self.is_above_zero_axis(diff):
            if not self.first_dead_x and self.is_dead_x(macd=macd):
                # 卖出场景1：零轴线上方出现第一个死叉，卖出50%
                self.first_dead_x = self.create_dead_axis(diff[-1], dea[-1], macd[-1])
                self.trending_type = TrendingType.DeadXDecliningDown
                percent_volume = self.add_volume(-0.5)
                logger.info("[{}] First DeadX Above Zero Axis, Sell 50% Target To: {}".format(
                    macd_point.get_datetime(), percent_volume))
                return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)
            if not self.second_dead_x and self.first_dead_x and self.is_dead_x(macd=macd) \
                    and self.percent_volume > 0:
                # 卖出场景2：零轴线上方出现第二个死叉，清仓卖出
                self.second_dead_x = self.create_dead_axis(diff[-1], dea[-1], macd[-1])
                logger.info("[{}] Second DeadX Above Zero Axis, Sell 100%".format(macd_point.get_datetime()))
                self.set_clear()
                return OrderAction.order_close_all()
            # 快线下降超过0.1，每下降一次
            if self.is_diff_declining_nday(diff, 2, step=0.1) \
                    and not self.first_dead_x \
                    and self.percent_volume > 0:
                # 卖出场景4：零轴线上方快线diff出现下降趋势，每次卖出5%
                percent_volume = self.add_volume(-0.15)
                self.trending_type = TrendingType.ContinueDecliningDown
                logger.info("[{}] Start Declining in 2 Days, Sell 15% Target To: {}".format(
                    macd_point.get_datetime(), percent_volume))
                return OrderAction.order_target_percent(OrderSide_Buy, trade_n=percent_volume)

        if (self.first_dead_x and self.is_dead_x(macd)) \
                or self.is_down_cross_zero_axis(diff) \
                and self.percent_volume > 0:
            # 卖出场景5：0轴线上第二个死叉，或往下零轴线，清仓
            logger.info("[{}] Second DeadX or Down Cross Zero Axis, Sell Out 100%.".format(macd_point.get_datetime()))
            self.set_clear()
            return OrderAction.order_close_all()
        if self.first_dead_x and self.is_down_cross_zero_axis(diff) \
                and self.percent_volume > 0:
            # 卖出场景5：上方死叉后直接0轴线，清仓
            logger.info("[{}] DeadX and Zero Axis, Sell Out 100%".format(macd_point.get_datetime()))
            self.set_clear()
            return OrderAction.order_close_all()

    def run_bak(self, macd_point: MACDPoint):
        """执行策略"""
        # 1. 判断是否已进入趋势，没有的话设置第一关注点
        diff, dea, macd = macd_point.get_macd()
        if self.check_and_set_first_golden_x(macd_point):
            return
        # 2. 买入：判断是否有第一次买入点
        if not self.is_above_zero_axis(diff):
            # 买点：0轴线下出现金叉，入场观察，买1手
            if self.is_golden_x(macd) and not self.second_golden_x:
                # - 0轴线下方第二个金叉
                self.second_golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
                order = OrderAction.order_volume(OrderSide_Buy, trade_n=100)
                logger.info("[{}] Second GoldenX Under Zero Axis, Buy count: 100".format(macd_point.get_datetime()))
                return order
        elif self.is_above_zero_axis(diff):
            # 买点：0轴线上买入逻辑，出现金叉，且出现死叉，仓位调整买入至20%
            if self.is_golden_x(macd) and self.first_dead_x:
                order = OrderAction.order_target_percent(OrderSide_Buy, trade_n=0.2)
                logger.info("[{}] GoldenX Upper ZeroAxis, Buy Target To: 20%".format(
                    macd_point.get_datetime()))
                return order
        if not self.second_golden_x and self.is_up_cross_zero_axis(diff):
            # 买点：没有第二个金叉，直接0轴线，仓位调整买入至70%
            self.zero_axis_point = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            # 买入剩余仓位70%
            order = OrderAction.order_target_percent(OrderSide_Buy, trade_n=0.7)
            logger.info("[{}] Zero Axis Line, Buy Target To: 70%".format(macd_point.get_datetime()))
            return order
        if self.second_golden_x and self.is_up_cross_zero_axis(diff):
            # - 0轴线下方第二金叉 且过0轴线，全仓买入，100%持仓
            # 买入所有剩余仓位
            order = OrderAction.order_target_percent(OrderSide_Buy, trade_n=1)
            logger.info("[{}] Second GoldenX and Zero Axis, All In, Buy Target To: 100%".format(
                macd_point.get_datetime()))
            return order

        # if self.is_cleared():
        #     return
        # 3. 卖出：
        if self.is_above_zero_axis(diff) and self.is_dead_x(macd) and not self.first_dead_x:
            # 买点：0轴线上方第一个死叉出现,调仓至30%，相当于满仓时候卖出70%，
            self.first_dead_x = self.create_dead_axis(diff[-1], dea[-1], macd[-1])
            order = OrderAction.order_target_percent(OrderSide_Sell, trade_n=0.3)
            logger.info("[{}] First DeadX, Sell 30%.".format(macd_point.get_datetime()))
            return order
        if (self.first_dead_x and self.is_dead_x(macd)) \
                or self.is_down_cross_zero_axis(diff) \
                and self.percent_volume > 0:
            # 0轴线上第二个死叉，或往下零轴线，清仓
            order = OrderAction.order_close_all()
            logger.info("[{}] Second DeadX, Sell Out 100%.".format(macd_point.get_datetime()))
            self.set_clear()
            return order
        if self.first_dead_x and self.is_up_cross_zero_axis(diff) \
                and self.percent_volume > 0:
            # 上方死叉后直接0轴线，清仓
            self.set_clear()
            order = OrderAction.order_close_all()
            logger.info("[{}] DeadX and Zero Axis, Sell Out 100%".format(macd_point.get_datetime()))
            return order
        # if self.is_above_zero_axis(diff) and self.is_macd_fall_down_n(diff, times=3):
        #     self.sell(self.current * 0.1)
        #     logger.info("[{}] MACD FallDown 3 times, Sell 10%. Count: {}".format(macd_point.get_datetime(), self.trade_n))
        #     return True
        # 无操作，等待

    def is_macd_fall_down_n(self, macd: pd.DataFrame, times=2):
        """MACD连续N次下降"""
        if len(macd) < 2:
            return False
        for n in range(1, times + 1):
            if macd[-n] < macd[-n - 1]:
                return False
        return True

    def set_clear(self):
        """设置清仓信号"""
        self.first_golden_x = None
        self.second_golden_x = None
        self.zero_axis_point = None
        self.first_dead_x = None
        self.second_dead_x = None
        self.percent_volume = 0
        self.trending_type = TrendingType.TrendingUnknown

    def is_cleared(self):
        """是否需要清仓"""
        return self._clear

    def clear(self):
        """一个趋势结束，清仓后清空初始化数据"""
        if self._clear:
            self.first_golden_x = None
            self.second_golden_x = None
            self.zero_axis_point = None
            self.first_dead_x = None
            self.second_dead_x = None
