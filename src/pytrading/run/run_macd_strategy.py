#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：run_macd_strategy
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/15 0:00 
"""
import talib
from optparse import OptionParser

from gm.api import *

import sys
import os

from pytrading.controller.order_controller import OrderController
from pytrading.model.order_enum import OrderAction
from pytrading.strategy.macd_signal import MACDSignalStrategy, MACDPoint
from pytrading.model.back_test import BackTest
from pytrading.logger import logger
from pytrading.config import STRATEGY_ID, TOKEN
from pytrading.utils import cmp_time_str, is_live_mode

Order_Controller = OrderController()


def init(context):
    # 日内回转每次交易数量

    context.short = 12  # 短周期均线
    context.long = 26  # 长周期均线
    # 回溯历史周期(MACD(12,26,9))
    context.period = 1000  # 订阅数据滑窗长度
    context.strategy_instance = MACDSignalStrategy()
    Order_Controller.setup(context=context)
    subscribe(context.symbol, frequency='1d', count=context.period)  # 订阅历史行情数据
    if is_live_mode():
        subscribe(context.symbol, frequency='900s', count=1)  # 实时订阅数据
    # schedule(schedule_func=algo, date_rule='1d', time_rule='14:30:00')


def algo(context):
    Order_Controller.setup(context=context)
    order = OrderAction.order_volume(OrderSide_Buy, trade_n=100)
    Order_Controller.order(order)
    print("Order100 Symbol: {}".format(Order_Controller.symbol))


def on_bar(context, bars):
    time_date = context.now
    # bar = bars[0]
    bar_date_time = context.now.strftime("%Y-%m-%d %H:%M:%S")
    end_time = bar_date_time[:10] + " 15:00:00"
    # 全部在盘内交易，为实盘准备
    if is_live_mode() and cmp_time_str(bar_date_time, end_time):
        return
    Order_Controller.setup(context=context)
    # 获取通过subscribe订阅的数据, count取1000，最终计算出来的mcad才能与交易软件一致
    his_close_prices = context.data(context.symbol, frequency='1d', count=context.period, fields='close,bob')
    # 回溯历史周期(MACD(12,26,9))
    if is_live_mode():
        cur_price = context.data(context.symbol, frequency='900s', count=1, fields='close,bob')
        real_close_prices = his_close_prices["close"].values + cur_price["close"].values
    else:
        real_close_prices = his_close_prices["close"].values
    # 利用15分钟价格与前几天close价格计算MACD
    dif, dea, macd = talib.MACD(real_close_prices, fastperiod=context.short,
                                slowperiod=context.long, signalperiod=9)
    macd_point = MACDPoint(datetime=bar_date_time, diff=dif, dea=dea, macd=macd)
    macd_point.set_position(Order_Controller.volume, Order_Controller.volume_available_now)
    # order = context.strategy_instance.run_order_100(macd_point)
    # order = context.strategy_instance.run_bak(macd_point)
    order = context.strategy_instance.run_macd(macd_point)
    # order = context.strategy_instance.run_double_averages(macd_point)
    if order:
        Order_Controller.order(order)
    # print("on_bar time: ", time_date)


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
        # if effect == 1:
        if side == 1:
            side_effect = '买入'
        elif side == 2:
            side_effect = '卖出'
        order_type_word = '限价' if order_type == 1 else '市价'
        logger.info('{}:标的：{}，操作：以{}{}，委托价格：{}，委托数量：{}'.format(context.now, symbol, order_type_word, side_effect, price,
                                                               volume))


def on_backtest_finished(context, indicator):
    """回测结束"""
    back_test_obj = BackTest()
    back_test_obj.symbol = context.symbol
    back_test_obj.init_attr(**indicator)
    stock_info = get_instruments(symbols=context.symbol, df=False)
    if len(stock_info) > 0:
        back_test_obj.name = stock_info[0]["sec_name"]
    back_test_obj.trending_type = context.strategy_instance.trending_type
    back_test_obj.backtest_start_time = context.backtest_start_time
    back_test_obj.backtest_end_time = context.backtest_end_time
    back_test_obj.save()
    logger.info(f"Back Test End, Symbol: {context.symbol}")


def on_error(context, code, info):
    print('code:{}, info:{}'.format(code, info))


def multiple_run(strategy_id, symbol, backtest_start_time, backtest_end_time, mode=MODE_BACKTEST):
    from gm.model.storage import context
    context.symbol = symbol
    run(strategy_id=strategy_id,
        filename=os.path.basename(__file__),
        mode=mode,
        token=TOKEN,
        backtest_start_time=backtest_start_time,
        backtest_end_time=backtest_end_time,
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=200000000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)


def run_cli():
    cli_parser = OptionParser()
    cli_parser.add_option("--symbol", action="store",
                          dest="symbol",
                          default="SZSE.002487",
                          help="股票标的")
    cli_parser.add_option("--start_time", action="store",
                          dest="start_time",
                          default="2021-01-01 09:00:00",
                          help="回测开始时间")
    cli_parser.add_option("--end_time", action="store",
                          dest="end_time",
                          default="2022-12-30 15:00:00",
                          help="回测结束时间")
    cli_parser.add_option("--mode", action="store",
                          dest="mode",
                          default=MODE_BACKTEST,
                          help="回测or实盘")
    cli_parser.add_option("--strategy_id", action="store",
                          dest="strategy_id",
                          default=STRATEGY_ID,
                          help="策略ID")
    (arg_options, cli_args) = cli_parser.parse_args()

    # 清楚接收的参数，避免影响run接收参数
    sys.argv = []
    multiple_run(arg_options.strategy_id,
                 arg_options.symbol,
                 backtest_start_time=arg_options.start_time,
                 backtest_end_time=arg_options.end_time,
                 mode=arg_options.mode)


if __name__ == '__main__':
    run_cli()
