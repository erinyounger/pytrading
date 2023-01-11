# coding=utf-8
from __future__ import print_function, absolute_import, unicode_literals
import numpy as np
import pandas as pd
from gm.api import *

'''
示例策略仅供参考，不建议直接实盘使用。

网格交易法是一种把行情的所有日间上下的波动全部囊括，不会放过任何一次行情上下波动的策略。
本策略标的为：SHFE.RB
价格中枢设定为：每日前一交易日的收盘价，每个网格间距3%；每变动一次，交易一手
'''


def init(context):
    # 策略标的为SHFE.RB
    context.symbol = 'SHFE.RB'
    # 设置每变动一格，增减的数量
    context.volume = 1
    # 储存前一个网格所处区间，用来和最新网格所处区间作比较
    context.last_grid = 0
    # 记录上一次交易时网格范围的变化情况（例如从4区到5区，记为4,5）
    context.grid_change_last = [0, 0]
    # 止损条件:最大持仓
    context.max_volume = 15
    # 定时任务，日贫，盘前运行
    schedule(schedule_func=algo, date_rule='1d', time_rule='21:00:00')
    schedule(schedule_func=algo, date_rule='1d', time_rule='09:00:00')
    # 订阅数据, bar频率为1min
    subscribe(symbols=context.symbol, frequency='60s')


def algo(context):
    # 获取前一交易日的收盘价作为价格中枢
    if context.now.hour >= 20:
        # 当天夜盘和次日日盘属于同一天数据，为此当天夜盘的上一交易日收盘价应调用当天的收盘价
        context.center = \
        history_n(symbol=context.symbol, frequency='1d', end_time=context.now, count=1, fields='close')[0]['close']
    else:
        last_date = get_previous_trading_date(exchange='SHFE', date=context.now)
        context.center = \
        history_n(symbol=context.symbol, frequency='1d', end_time=last_date, count=1, fields='close')[0]['close']

    # 设置网格
    context.band = np.array([0.92, 0.94, 0.96, 0.98, 1, 1.02, 1.04, 1.06, 1.08]) * context.center


def on_bar(context, bars):
    bar = bars[0]
    # 获取多仓仓位
    position_long = context.account().position(symbol=context.symbol, side=PositionSide_Long)
    # 获取空仓仓位
    position_short = context.account().position(symbol=context.symbol, side=PositionSide_Short)

    # 当前价格所处的网格区域
    grid = pd.cut([bar.close], context.band, labels=[1, 2, 3, 4, 5, 6, 7, 8])[
        0]  # 1代表(0.88%,0.91%]区间，2代表(0.91%,0.94%]区间...

    # 如果价格超出网格设置范围，则提示调节网格宽度和数量
    if np.isnan(grid):
        # print('价格波动超过网格范围，可适当调节网格宽度和数量')
        return

    # 如果新的价格所处网格区间和前一个价格所处的网格区间不同，说明触碰到了网格线，需要进行交易
    # 如果新网格大于前一天的网格，做空或平多
    if context.last_grid < grid:
        # 记录新旧格子范围（按照大小排序）
        grid_change_new = [context.last_grid, grid]

        # 当last_grid = 0 时是初始阶段，不构成信号
        if context.last_grid == 0:
            context.last_grid = grid
            return

        # 如果前一次开仓是4-5，这一次是5-4，算是没有突破，不成交
        if grid_change_new != context.grid_change_last:
            # 如果有多仓，平多
            if position_long:
                order_volume(symbol=context.symbol, volume=context.volume, side=OrderSide_Sell,
                             order_type=OrderType_Market,
                             position_effect=PositionEffect_Close)
                print('{}:从{}区调整至{}区，以市价单平多仓{}手'.format(context.now, context.last_grid, grid, context.volume))

            # 否则，做空
            if not position_long:
                order_volume(symbol=context.symbol, volume=context.volume, side=OrderSide_Sell,
                             order_type=OrderType_Market,
                             position_effect=PositionEffect_Open)
                print('{}:从{}区调整至{}区，以市价单开空{}手'.format(context.now, context.last_grid, grid, context.volume))

            # 更新前一次的数据
            context.last_grid = grid
            context.grid_change_last = grid_change_new

    # 如果新网格小于前一天的网格，做多或平空
    if context.last_grid > grid:
        # 记录新旧格子范围（按照大小排序）
        grid_change_new = [grid, context.last_grid]

        # 当last_grid = 0 时是初始阶段，不构成信号
        if context.last_grid == 0:
            context.last_grid = grid
            return

        # 如果前一次开仓是4-5，这一次是5-4，算是没有突破，不成交
        if grid_change_new != context.grid_change_last:
            # 如果有空仓，平空
            if position_short:
                order_volume(symbol=context.symbol, volume=context.volume, side=OrderSide_Buy,
                             order_type=OrderType_Market, position_effect=PositionEffect_Close)
                print('{}:从{}区调整至{}区，以市价单平空仓{}手'.format(context.now, context.last_grid, grid, context.volume))

            # 否则，做多
            if not position_short:
                order_volume(symbol=context.symbol, volume=context.volume, side=OrderSide_Buy,
                             order_type=OrderType_Market, position_effect=PositionEffect_Open)
                print('{}:从{}区调整至{}区，以市价单开多{}手'.format(context.now, context.last_grid, grid, context.volume))

            # 更新前一次的数据
            context.last_grid = grid
            context.grid_change_last = grid_change_new

    # 设计一个止损条件：当持仓量达到20手，全部平仓
    if (position_short is not None and position_short['volume'] == context.max_volume) or (
            position_long is not None and position_long['volume'] == context.max_volume):
        order_close_all()
        print('{}:触发止损，全部平仓'.format(context.now))


def on_backtest_finished(context, indicator):
    print('*' * 50)
    print('回测已完成，请通过右上角“回测历史”功能查询详情。')


if __name__ == '__main__':
    '''
    strategy_id策略ID,由系统生成
    filename文件名,请与本文件名保持一致
    mode实时模式:MODE_LIVE回测模式:MODE_BACKTEST
    token绑定计算机的ID,可在系统设置-密钥管理中生成
    backtest_start_time回测开始时间
    backtest_end_time回测结束时间
    backtest_adjust股票复权方式不复权:ADJUST_NONE前复权:ADJUST_PREV后复权:ADJUST_POST
    backtest_initial_cash回测初始资金
    backtest_commission_ratio回测佣金比例
    backtest_slippage_ratio回测滑点比例
    '''
    run(strategy_id='30c9e7f7-4ca5-11ed-97c8-00ffc033e1eb',
        filename='main.py',
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2019-06-01 08:00:00',
        backtest_end_time='2019-12-31 16:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=150000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)
