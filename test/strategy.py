#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：strategy
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/4 22:20 
"""
import os
import talib
import pandas as pd
from decimal import Decimal

from gm.api import *
from pytrading.logger import logger


class MACDPoint:
    datetime = None
    diff = 0
    dea = 0
    macd = 0

    volume = 0  # 总持仓量
    # volume_today = 0    # 今日买入量
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
    """金叉定义"""
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


class TradeSignal:
    """交易信号"""
    side = None  # 交易方向，OrderSide_Unknown - 不操作，  OrderSide_Buy - 买入，  OrderSide_Sell - 卖出
    total_volume = 0  # 本票计划交易的总数量
    current = 0  # 持有量
    trade_n = 0  # 本次交易数量

    _clear = False  # 清仓标记

    first_golden_x = None  # 0轴线下方第一个金叉
    zero_axis_point = None  # 0轴线
    second_golden_x = None  # 第二个金叉

    first_dead_x = None  # 第一个死叉
    second_dead_x = None  # 第二个死叉

    def __init__(self):
        self.side = OrderSide_Unknown

    def create_golden_x(self, diff, dea, macd):
        """创建金叉"""
        return XPointType("GoldenX", diff, dea, macd)

    def create_zero_axis(self, diff, dea, macd):
        """创建金叉"""
        return XPointType("Axis0", diff, dea, macd)

    def create_dead_axis(self, diff, dea, macd):
        """创建死叉"""
        return XPointType("DeadX", diff, dea, macd)

    def set_first_golden_x(self, macd_point: MACDPoint):
        """设置0轴线下第一个金叉"""
        diff, dea, macd = macd_point.get_macd()
        if diff[-1] > 0:
            # 0轴线上方，直接返回
            return
        if self.is_golden_x(macd) and not self.has_first_care():
            logger.info("[{}] First GoldenX Under Zero Axis, observing.".format(macd_point.get_datetime()))
            self.first_golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            if not self.total_volume:
                self.total_volume = macd_point.available_now + macd_point.volume
            self._clear = False

    def is_golden_x(self, macd):
        """判断是否是金叉"""
        if len(macd) < 2:
            return False
        if macd[-1] >= 0 and macd[-2] < 0:
            return True
        return False

    def is_dead_x(self, macd):
        """判断是否是死叉"""
        if macd[-1] < 0 and macd[-2] >= 0:
            return True
        return False

    def has_first_care(self):
        """判断是否是要关注该票"""
        return self.first_golden_x is not None

    def is_zero_axis_up(self, diff):
        """判断是否是0轴线"""
        if len(diff) < 2:
            return False
        if diff[-1] >= 0 and diff[-2] < 0:
            return True
        else:
            return False

    def is_zero_axis_down(self, diff):
        """判断是否是0轴线"""
        if len(diff) < 2:
            return False
        elif diff[-1] < 0 and diff[-2] >= 0:
            return True
        else:
            return False

    def is_above_zero_axis(self, diff):
        """是否在零轴线上方"""
        if diff[-1] > 0:
            return True
        elif diff[-1] < 0:
            return False
        return False

    def run(self, macd_point: MACDPoint):
        """执行策略"""
        # 1. 判断是否已进入趋势，没有的话设置第一关注点
        diff, dea, macd = macd_point.get_macd()
        if not self.has_first_care():
            self.set_first_golden_x(macd_point)
            return
        # 2. 买入：判断是否有第一次买入点
        if not self.is_above_zero_axis(diff):
            # 0轴线下买入逻辑
            if self.is_golden_x(macd) and not self.second_golden_x:
                # - 0轴线下方第二个金叉
                self.second_golden_x = self.create_golden_x(diff[-1], dea[-1], macd[-1])
                self.buy(100)
                logger.info("[{}] Second GoldenX Under Zero Axis, Buy count: 100, Current: {}".format(
                    macd_point.get_datetime(), self.current))
                return True
        elif self.is_above_zero_axis(diff):
            # 0轴线上买入逻辑
            if self.is_golden_x(macd) and self.first_dead_x:
                trade_n = macd_point.available_now * 0.20
                self.buy(trade_n)
                logger.info("[{}] GoldenX Upper ZeroAxis, Buy 20% Count: {}, Current: {}".format(
                    macd_point.get_datetime(), self.trade_n, self.current))
                return True
        if not self.second_golden_x and self.is_zero_axis_up(diff):
            # - 没有第二个金叉，直接0轴线
            self.zero_axis_point = self.create_golden_x(diff[-1], dea[-1], macd[-1])
            # 买入剩余仓位70%
            trade_n = int(macd_point.available_now * 0.7)
            self.buy(trade_n)
            logger.info("[{}] Zero Axis Line, Buy 70%: {}, Current: {}".format(
                macd_point.get_datetime(), trade_n, self.current))
            return True
        if self.second_golden_x and self.is_zero_axis_up(diff):
            # - 0轴线下方第二金叉 且 0轴线，全厂买入
            # 买入所有剩余仓位
            trade_n = macd_point.available_now
            self.buy(trade_n)
            logger.info("[{}] Second GoldenX and Zero Axis, All In, Count: {}, Current:{}".format(
                macd_point.get_datetime(), trade_n, self.current))
            return True

        # 3. 卖出：
        if self.is_above_zero_axis(diff) and self.is_dead_x(macd) and not self.first_dead_x:
            # 0轴线上方第一个死叉出现
            self.first_dead_x = self.create_dead_axis(diff[-1], dea[-1], macd[-1])
            self.sell(macd_point.volume * 0.3)
            logger.info("[{}] First DeadX, Sell 20%. Count: {}, Current: {}".format(
                macd_point.get_datetime(), self.trade_n, self.current))
            return True
        if (self.first_dead_x and self.is_dead_x(macd)) or self.is_zero_axis_down(diff):
            # 0轴线上第二个死叉，或往下零轴线，清仓
            self.sell(macd_point.volume)
            logger.info("[{}] Second DeadX, Sell all. Count: {}, Current: {}".format(
                macd_point.get_datetime(), self.trade_n, self.current))
            self.set_clear()
            return
        if self.first_dead_x and self.is_zero_axis_up(diff):
            # 上方死叉后直接0轴线，清仓
            self.sell(macd_point.volume)
            self.set_clear()
            logger.info("[{}] DeadX and Zero Axis, Sell all. Count: {}, Current: {}".format(
                macd_point.get_datetime(), self.trade_n, self.current))
            return
        # if self.is_above_zero_axis(diff) and self.is_macd_fall_down_n(diff, times=3):
        #     self.sell(self.current * 0.1)
        #     logger.info("[{}] MACD FallDown 3 times, Sell 10%. Count: {}".format(macd_point.get_datetime(), self.trade_n))
        #     return True
        # 无操作，等待
        self.set_no_action()

    def is_macd_fall_down_n(self, macd: pd.DataFrame, times=2):
        """MACD连续N次下降"""
        if len(macd) < 2:
            return False
        for n in range(1, times + 1):
            if macd[-n] < macd[-n - 1]:
                return False
        return True

    def buy(self, trade_n):
        """设置买入"""
        self.side = OrderSide_Buy
        self.trade_n = int(trade_n)
        self.current += self.trade_n

    def sell(self, trade_n):
        """设置卖出"""
        if self.current < self.trade_n:
            logger.error("Current handler is smaller than Trade N. {} < {}".format(self.current, self.trade_n))
            return
        self.side = OrderSide_Sell
        self.trade_n = int(trade_n)
        self.current -= self.trade_n

    def set_clear(self):
        """设置清仓信号"""
        self._clear = True

    def is_clear(self):
        """是否需要清仓"""
        return self._clear

    def clear(self):
        """一个趋势结束，清仓后清空初始化数据"""
        if self._clear:
            self.set_no_action()
            self.trade_n = 0
            self.first_golden_x = None
            self.second_golden_x = None
            self.zero_axis_point = None
            self.first_dead_x = None
            self.second_dead_x = None

    def set_no_action(self):
        """无操作"""
        self.side = OrderSide_Unknown

    def is_valid(self):
        """判断本次是否需要操作"""
        return self.side != OrderSide_Unknown


def init(context):
    # 设置标的股票
    context.symbol = 'SZSE.000625'  # 长安汽车
    # context.symbol = 'SZSE.000799'  # 浪潮
    # context.symbol = 'SHSE.603288'  # 海天喂业
    # context.symbol = 'SHSE.600036'  # 浪潮
    # 日内回转每次交易数量
    context.trade_n = 100
    context.short = 12  # 短周期均线
    context.long = 26  # 长周期均线
    # 回溯历史周期(MACD(12,26,9))
    context.period = 1000  # 订阅数据滑窗长度

    context.trade_signal = TradeSignal()
    subscribe(context.symbol, frequency='1d', count=context.period)  # 订阅行情


def float_fmt(value):
    """格式化小数点，四舍五入"""
    return Decimal(value).quantize(Decimal("0.001"), rounding="ROUND_HALF_UP")


def on_bar(context, bars):
    bar = bars[0]
    # 获取通过subscribe订阅的数据
    prices = context.data(context.symbol, frequency='1d', count=context.period, fields='close')
    # 利用talib库计算长短周期均线
    # short_avg = talib.SMA(prices.values.reshape(context.period), timeperiod=context.short)
    # long_avg = talib.SMA(prices.values.reshape(context.period), timeperiod=context.long)
    # 调用收盘价
    # close = context.data(symbol=context.symbol, frequency='1d', count=40, fields='close')['close'].values
    # close = prices["close"].values
    # dif, dea, macd = MACD_CN(prices["close"], fastperiod=12, slowperiod=26, signalperiod=9)
    # print("date\t:", bar.bob.strftime("%Y-%m-%d"),
    #       "DIF: ", float_fmt(dif[-1]),
    #       "DEA:", float_fmt(dea[-1]),
    #       "MACD:", float_fmt(macd[-1]))
    # 获取持仓
    position = context.account().position(symbol=context.symbol, side=PositionSide_Long)
    # 可用仓位
    # available_volume = position['volume'] - position['available_today'] if position else 0
    cash = context.account(account_id=list(context.accounts.keys())[0]).cash["nav"]
    if not position:
        current_data = current(symbols=context.symbol)
        position = {"volume": 0, "available_now": cash / current_data[0]["price"]}
    dif, dea, macd = talib.MACD(prices["close"].values, fastperiod=12, slowperiod=26, signalperiod=9)
    macd_point = MACDPoint(datetime=bar.bob.strftime("%Y-%m-%d"), diff=dif, dea=dea, macd=macd)
    macd_point.set_position(position['volume'], position['available_now'])
    context.trade_signal.run(macd_point)
    if context.trade_signal.side != OrderSide_Unknown:
        side_str = "OrderSide_Buy" if context.trade_signal.side == OrderSide_Buy else "OrderSide_Sell"
        pos_effect = PositionEffect_Open if context.trade_signal.side == OrderSide_Buy else PositionEffect_Close
        logger.info(
            "[{}] Action Side: {}, Count: {}".format(macd_point.datetime, side_str, context.trade_signal.trade_n))
        order_volume(symbol=context.symbol, volume=context.trade_signal.trade_n, side=context.trade_signal.side,
                     order_type=OrderType_Market,
                     position_effect=pos_effect)
        if context.trade_signal.is_clear():
            context.trade_signal.clear()
        if type(position) != dict:
            logger.info("volume: {}, last volume: {}, available_now: {}".format(
                position.volume, position.volume - position.volume_today, position.available_now
            ))
        logger.info("----------------------------------------------------------------")
    # print("date1\t:", bar.bob.strftime("%Y-%m-%d"),
    #       "DIF: ", float_fmt(dif[-1]),
    #       "DEA:", float_fmt(dea[-1]),
    #       "MACD:", float_fmt(macd[-1] * 2))
    # MACD由负转正时,买入
    # if can_buy_by_macd(macd):
    #     order_volume(symbol=context.symbol, volume=context.trade_n, side=OrderSide_Buy, order_type=OrderType_Market,
    #                  position_effect=PositionEffect_Open)
    # elif can_sell_by_macd(macd) and available_volume >= context.trade_n:
    #     order_volume(symbol=context.symbol, volume=context.trade_n, side=OrderSide_Sell, order_type=OrderType_Market,
    #                  position_effect=PositionEffect_Close)
    # print("-----------------------------------------")


def on_order_status(context, order):
    # 标的代码
    symbol = order['symbol']
    # 委托价格
    price = order['price']
    # 委托数量
    volume = order['volume']
    # 查看下单后的委托状态，等于3代表委托全部成交
    status = order['status']
    # 买卖方向，1为买入，2为卖出
    side = order['side']
    # 开平仓类型，1为开仓，2为平仓
    effect = order['position_effect']
    # 委托类型，1为限价委托，2为市价委托
    order_type = order['order_type']
    if status == 3:
        if effect == 1:
            if side == 1:
                side_effect = '开多仓'
            elif side == 2:
                side_effect = '开空仓'
        else:
            if side == 1:
                side_effect = '平空仓'
            elif side == 2:
                side_effect = '平多仓'
        order_type_word = '限价' if order_type == 1 else '市价'
        logger.info('{}:标的：{}，操作：以{}{}，委托价格：{}，委托数量：{}'.format(context.now, symbol, order_type_word, side_effect, price,
                                                               volume))


if __name__ == '__main__':
    run(strategy_id='28de0f36-7d4f-11ed-a603-00ffc033e1eb',
        filename=os.path.basename(__file__),
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2021-01-01 09:00:00',
        backtest_end_time='2022-10-30 15:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=2000000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)
