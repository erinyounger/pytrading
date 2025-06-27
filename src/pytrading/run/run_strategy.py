#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：策略执行入口
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/15 0:00 
"""
from optparse import OptionParser

from gm.api import *

import sys
import os

from pytrading.controller.order_controller import OrderController
from pytrading.strategy.strategy_macd import MacdStrategy
from pytrading.model.back_test import BackTest
from pytrading.logger import logger
from pytrading.config import config
from pytrading.utils import is_live_mode
from pytrading.model.strategy_enum import StrategyType

order_controller = OrderController()


def init(context):
    # 1.初始化订单实例
    order_controller.setup(context=context)
    # 2.初始化策略实例
    if context.strategy_name == StrategyType.MACD:
        """MACD趋势策略"""
        logger.info(f"Run Strategy Name: {context.strategy_name}")
        context.stgy_instance = MacdStrategy(short=12, long=26, period=3000)
        context.stgy_instance.setup(context)


def on_bar(context, bars):
    # 实盘交易时，需要在盘中定时交易，回测时使用on_bar
    if is_live_mode():
        return
    # 1.没个bar初始化订单实例
    order_controller.setup(context=context)

    # 2.执行策略
    order = context.stgy_instance.run(context)

    # 3.买单
    if order:
        order_controller.run_order(order)


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
    if not config.save_db:
        return
    try:
        back_test_obj = BackTest()
        back_test_obj.symbol = context.symbol
        back_test_obj.init_attr(**indicator)
        stock_info = get_instruments(symbols=context.symbol, df=False)
        if len(stock_info) > 0:
            back_test_obj.name = stock_info[0]["sec_name"]
        back_test_obj.trending_type = context.stgy_instance.trending_type
        back_test_obj.backtest_start_time = context.backtest_start_time
        back_test_obj.backtest_end_time = context.backtest_end_time
        back_test_obj.save()
    except Exception as ex:
        logger.exception(ex)
    logger.info(f"Back Test End, Symbol: {context.symbol}")


def on_error(context, code, info):
    print('code:{}, info:{}'.format(code, info))


def multiple_run(strategy_id, symbol, backtest_start_time, backtest_end_time, strategy_name, mode=MODE_BACKTEST):
    from gm.model.storage import context
    context.symbol = symbol
    context.strategy_name = strategy_name
    run(strategy_id=strategy_id,
        filename=os.path.basename(__file__),
        mode=mode,
        token=config.token,
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
                          default="SZSE.000625",
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
                          default=config.strategy_id,
                          help="策略ID")
    cli_parser.add_option("--strategy_name", action="store",
                          dest="strategy_name",
                          default=StrategyType.MACD,
                          help="策略名称")
    (arg_options, cli_args) = cli_parser.parse_args()

    # 清楚接收的参数，避免影响run接收参数
    sys.argv = []
    logger.info("Mode: {}, StrategeID: {}, StrategyName: {}, Symbol: {}, StartTime: {}, EndTime: {}, SaveDB: {}".format(
        arg_options.mode, arg_options.strategy_id, arg_options.strategy_name, arg_options.symbol,
        arg_options.start_time, arg_options.end_time, config.save_db))
    multiple_run(arg_options.strategy_id,
                 arg_options.symbol,
                 backtest_start_time=arg_options.start_time,
                 backtest_end_time=arg_options.end_time,
                 strategy_name=arg_options.strategy_name,
                 mode=arg_options.mode)


if __name__ == '__main__':
    run_cli()
