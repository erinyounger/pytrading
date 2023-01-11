# coding=utf-8
from __future__ import print_function, absolute_import, unicode_literals
from gm.api import *
import talib

'''
示例策略仅供参考，不建议直接实盘使用。

日内回转交易是指投资者就同一个标的（如股票）在同一个交易日内各完成多次买进和卖出的行为
其目的为维持股票数量不变，降低股票成本
本策略以1分钟MACD为基础，金叉时买入，死叉时卖出，尾盘回转至初始仓位
'''


def init(context):
    # 设置标的股票
    context.symbol = 'SZSE.000977'
    # 用于判定第一个仓位是否成功开仓
    context.first = 0
    # 需要保持的总仓位
    context.total = 1000
    # 日内回转每次交易数量
    context.trade_n = 100
    # 回溯历史周期(MACD(12,26,9))
    context.periods_time = 35
    # 订阅浦发银行, bar频率为1min
    subscribe(symbols=context.symbol, frequency='60s', count=context.periods_time)


def on_bar(context, bars):
    bar = bars[0]
    # 配置底仓
    if context.first == 0:
        context.first = 1
        # 购买10000股浦发银行股票
        order_volume(symbol=context.symbol, volume=context.total, side=OrderSide_Buy,
                     order_type=OrderType_Market, position_effect=PositionEffect_Open)
        print('{}：建底仓，以市价单开多仓{}股'.format(context.now, context.total))
        return

    # 获取持仓
    position = context.account().position(symbol=context.symbol, side=PositionSide_Long)
    # 可用仓位
    available_volume = position['volume'] - position['available_today']

    # 尾盘回转仓位
    if context.now.hour == 14 and context.now.minute >= 57 or context.now.hour == 15:
        if position['volume'] != context.total:
            order_target_volume(symbol=context.symbol, volume=context.total, order_type=OrderType_Market,
                                position_side=PositionSide_Long)
    # 非尾盘时间，正常交易(首日不交易，可用仓位为0)
    elif available_volume > 0:
        # 调用收盘价
        close = context.data(symbol=context.symbol, frequency='60s', count=context.periods_time, fields='close')[
            'close'].values
        # 计算MACD线
        macd = talib.MACD(close)[0]
        # MACD由负转正时,买入
        if macd[-2] <= 0 and macd[-1] > 0:
            order_volume(symbol=context.symbol, volume=context.trade_n, side=OrderSide_Buy, order_type=OrderType_Market,
                         position_effect=PositionEffect_Open)

        # MACD由正转负时,卖出
        elif macd[-2] >= 0 and macd[-1] < 0 and available_volume >= context.trade_n:
            order_volume(symbol=context.symbol, volume=context.trade_n, side=OrderSide_Sell,
                         order_type=OrderType_Market, position_effect=PositionEffect_Close)


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
        print('{}:标的：{}，操作：以{}{}，委托价格：{}，委托数量：{}'.format(context.now, symbol, order_type_word, side_effect, price,
                                                         volume))


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
    run(strategy_id='6df40988-5abe-11ed-8dce-00ffc033e1eb',
        filename='realtime.py',
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2022-01-01 08:00:00',
        backtest_end_time='2022-10-31 16:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=200000000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)