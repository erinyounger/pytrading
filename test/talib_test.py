#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：talib_test
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/10/24 22:03 
"""
# coding=utf-8
from __future__ import print_function, absolute_import, unicode_literals

import multiprocessing

import numpy as np
import pandas as pd
import talib
from gm.api import *

'''
基本思想：设定所需优化的参数数值范围及步长，将参数数值循环输入进策略，进行遍历回测，
        记录每次回测结果和参数，根据某种规则将回测结果排序，找到最好的参数。
1、定义策略函数
2、多进程循环输入参数数值
3、获取回测报告，生成DataFrame格式
4、排序
本程序以双均线策略为例，优化两均线长短周期参数。
'''


# 原策略中的参数定义语句需要删除！
def init(context):
    context.sec_id = 'SHSE.600000'
    subscribe(symbols=context.sec_id, frequency='1d', count=31, wait_group=True)


def on_bar(context, bars):
    close = context.data(symbol=context.sec_id, frequency='1d', count=31, fields='close')['close'].values
    MA_short = talib.MA(close, timeperiod=context.short)
    MA_long = talib.MA(close, timeperiod=context.long)
    position = context.account().position(symbol=context.sec_id, side=PositionSide_Long)
    if not position and not position:
        if MA_short[-1] > MA_long[-1] and MA_short[-2] < MA_long[-2]:
            order_target_percent(symbol=context.sec_id, percent=0.8, order_type=OrderType_Market,
                                 position_side=PositionSide_Long)
    elif position:
        if MA_short[-1] < MA_long[-1] and MA_short[-2] > MA_long[-2]:
            order_target_percent(symbol=context.sec_id, percent=0, order_type=OrderType_Market,
                                 position_side=PositionSide_Long)


# 获取每次回测的报告数据
def on_backtest_finished(context, indicator):
    data = [indicator['pnl_ratio'], indicator['pnl_ratio_annual'], indicator['sharp_ratio'], indicator['max_drawdown'],
            context.short, context.long]
    # 将超参加入context.result
    context.result.append(data)


def run_strategy(short, long):
    from gm.model.storage import context
    # 用context传入参数
    context.short = short
    context.long = long
    # context.result用以存储超参
    context.result = []
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
    run(strategy_id='2766b70e-4a90-11f0-a867-745d22cbd33f',
        filename='main.py',
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2017-05-01 08:00:00',
        backtest_end_time='2017-10-01 16:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=50000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)
    return context.result


if __name__ == '__main__':
    paras_list = []
    # 循环输入参数数值回测
    for short in range(5, 10, 2):
        for long in range(10, 21, 5):
            paras_list.append([short, long])

    a_list = []
    pool = multiprocessing.Pool(processes=12, maxtasksperchild=1)  # create 12 processes
    for i in range(len(paras_list)):
        a_list.append(pool.apply_async(func=run_strategy, args=(paras_list[i][0], paras_list[i][1])))
    pool.close()
    pool.join()
    info = []
    # for pro in a_list:
    #     print('pro', pro.get()[0])
    #     info.append(pro.get()[0])
    # print(info)
    # info = pd.DataFrame(np.array(info),
    #                     columns=['pnl_ratio', 'pnl_ratio_annual', 'sharp_ratio', 'max_drawdown', 'short', 'long'])
    # info.to_csv('info.csv', index=False)