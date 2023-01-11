#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：trend
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/10/24 23:21 
"""
import multiprocessing
import numpy as np
import pandas as pd
import talib

from gm.api import *

'''
示例策略仅供参考，不建议直接实盘使用。

本策略以分钟级别数据建立双均线模型，短周期为20，长周期为60
当短期均线由上向下穿越长期均线时做空
当短期均线由下向上穿越长期均线时做多
'''


def init(context):
    context.short = 4  # 短周期均线
    context.long = 8  # 长周期均线
    context.symbol = 'SZSE.000625'  # 订阅交易标的
    context.period = context.long + 1  # 订阅数据滑窗长度
    subscribe(context.symbol, frequency='1d', count=context.period)  # 订阅行情


def on_bar(context, bars):
    # 获取通过subscribe订阅的数据

    prices = context.data(context.symbol, frequency='1d', count=context.period, fields='close')

    # 利用talib库计算长短周期均线
    short_avg = talib.SMA(prices.values.reshape(context.period), timeperiod=context.short)
    long_avg = talib.SMA(prices.values.reshape(context.period), timeperiod=context.long)

    # 查询持仓
    position_long = context.account().position(symbol=context.symbol, side=1)
    position_short = context.account().position(symbol=context.symbol, side=2)

    # 短均线下穿长均线，做空(即当前时间点短均线处于长均线下方，前一时间点短均线处于长均线上方)
    if long_avg[-2] <= short_avg[-2] and long_avg[-1] > short_avg[-1] and not position_short:
        # 无多仓情况下，直接开空
        if not position_long:
            order_volume(symbol=context.symbol, volume=100, side=OrderSide_Sell, position_effect=PositionEffect_Open,
                         order_type=OrderType_Market)
        # 有多仓情况下，先平多，再开空(开空命令放在on_order_status里面)
        else:
            # 以市价平多仓
            order_volume(symbol=context.symbol, volume=100, side=OrderSide_Sell, position_effect=PositionEffect_Close,
                         order_type=OrderType_Market)

    # 短均线上穿长均线，做多（即当前时间点短均线处于长均线上方，前一时间点短均线处于长均线下方）
    if short_avg[-2] <= long_avg[-2] and short_avg[-1] > long_avg[-1] and not position_long:
        # 无空仓情况下，直接开多
        if not position_short:
            order_volume(symbol=context.symbol, volume=100, side=OrderSide_Buy, position_effect=PositionEffect_Open,
                         order_type=OrderType_Market)
        # 有空仓的情况下，先平空，再开多(开多命令放在on_order_status里面)
        else:
            # 以市价平空仓
            order_volume(symbol=context.symbol, volume=100, side=OrderSide_Buy,
                         position_effect=PositionEffect_Close, order_type=OrderType_Market)


def on_order_status(context, order):
    # 标的代码
    symbol = order['symbol']
    # 委托价格
    price = order['price']
    # 委托数量
    volume = order['volume']
    # 目标仓位
    target_percent = order['target_percent']
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
        print('{}:标的：{}，操作：以{}{}，委托价格：{}，委托数量：{}'.format(context.now, symbol, order_type_word, side_effect, price,
                                                         volume))
        # 平仓后，接着开相反方向的仓位
        if effect == 2:
            order_volume(symbol=context.symbol, volume=volume, side=side, order_type=OrderType_Market,
                         position_effect=PositionEffect_Open)


def on_backtest_finished(context, indicator):
    print('*' * 50)
    data = [indicator['pnl_ratio'], indicator['pnl_ratio_annual'], indicator['sharp_ratio'], indicator['max_drawdown'],
            indicator['win_ratio'], context.short, context.long]
    # 将超参加入context.result
    context.result.append(data)
    print('回测已完成，请通过右上角“回测历史”功能查询详情。')


def run_strategy(short, long):
    from gm.model.storage import context
    # 用context传入参数
    context.short = short
    context.long = long

    # context.result用以存储超参
    context.result = []
    run(strategy_id='3ac49582-53b0-11ed-b6cc-00ffc033e1eb',
        filename='trend.py',
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2021-01-01 09:00:00',
        backtest_end_time='2022-10-24 15:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=100000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)
    return context.result

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
    paras_list = []
    # 循环输入参数数值回测
    for short in range(5, 17, 2):
        for long in range(17, 30, 5):
            paras_list.append([short, long])

    a_list = []
    pool = multiprocessing.Pool(processes=16, maxtasksperchild=1)  # create 12 processes
    for i in range(len(paras_list)):
        a_list.append(pool.apply_async(func=run_strategy, args=(paras_list[i][0], paras_list[i][1])))
    pool.close()
    pool.join()
    info = []
    for pro in a_list:
        print('pro', pro.get()[0])
        info.append(pro.get()[0])
    print(info)
    info = pd.DataFrame(np.array(info), columns=['pnl_ratio', 'pnl_ratio_annual', 'sharp_ratio', 'max_drawdown',
                                                 'win_ratio', 'short', 'long'])
    info.to_csv('info.csv', index=False)
