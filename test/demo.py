# coding=utf-8
from __future__ import print_function, absolute_import
from gm.api import *
import numpy as np
import pandas as pd
import datetime


"""
高股息策略
1、剔除st股、停牌及开盘涨停的沪深300成分股作为待选股票池；
2、剔除股票池中短期动量最高的20%股票（即21日累计涨幅最高的20%个股）；
3、剔除股票池中盈利下滑的个股（即单季度净利润同比增长率小于0的股票）；
4、在股票池剩余个股中，按股息率排序，选取股息率最高的N只个股等权构建组合，月初换股。
"""

def init(context):
    # 目标指数
    context.index_code = 'SHSE.000300'
    # 短期动量阈值比例和周期
    context.momentum_threshold = 0.2
    context.momentum_periods = 21
    # 盈利最小阈值
    context.earning_threshold = 0
    # 最大持股数量
    context.max_holding = 15
    # 其他
    context.to_buy = []
    # 盘前运行
    schedule(schedule_func=before_market, date_rule='1d', time_rule='09:27:00')
    # 开盘运行
    schedule(schedule_func=begin_market, date_rule='1d', time_rule='09:30:00')
    

def before_market(context):
    # 上一个交易日
    last_date = datetime.datetime.strptime(get_previous_trading_date(exchange='SZSE', date=context.now),'%Y-%m-%d')
    # 月初换股
    if context.now.month>last_date.month:
        constituents = list(get_history_constituents(index=context.index_code)[0]['constituents'].keys())
        # 条件：过滤ST股和停牌股
        history_ins = get_history_instruments(symbols=constituents, start_date=context.now, end_date=context.now, fields='symbol,sec_level, is_suspended', df=True)
        constituents = list(history_ins[(history_ins['sec_level']==1) & (history_ins['is_suspended']==0)]['symbol'])
        # 获取当日开盘价
        # 如果是回测模式
        if context.mode == 2:
            # 开盘价直接在data最后一个数据里取到,前一交易日的最高和最低价为history_data里面的倒数第二条中取到
            open_today = history(symbol=constituents, frequency='1d', start_time=context.now.date(),  end_time=context.now.date(), fields='symbol,open', adjust=ADJUST_PREV, adjust_end_time=context.backtest_end_time, df= True).set_index(['symbol'])
        # 如果是实时模式
        else:
            # 开盘价通过current取到
            open_today = pd.DataFrame([{'symbol':data['symbol'],'open':data['open']} for data in current(constituents)]).set_index('symbol')
        # 条件：过滤开盘直接涨停的股票
        limit_up_price_today = get_history_instruments(symbols=constituents, fields='symbol,upper_limit', start_date=context.now.date(), end_date=context.now.date(), df=True).set_index('symbol')
        data = pd.concat([open_today,limit_up_price_today],axis=1)
        data['limit_up'] = data['open']==data['upper_limit']
        constituents = list(data[data['limit_up']==False].index)

        # 剔除股票池中短期动量最高的20%股票（即21日累计涨幅最高的20%个股）
        # 开始日期
        start_date = get_previous_N_trading_date(last_date,counts=context.momentum_periods,exchanges='SHSE')
        close_price = history(symbol=constituents, frequency='1d', start_time=start_date, end_time=last_date, fields='eob,symbol,close', fill_missing='Last', adjust=ADJUST_PREV, df=True).set_index(['eob','symbol'])
        close_price = close_price.unstack()
        close_price.columns = close_price.columns.droplevel(level=0)
        momentum = (close_price.iloc[-1,:]/close_price.iloc[0,:]-1).sort_values(ascending = True)
        constituents = list(momentum.iloc[:int(len(momentum)*(1-context.momentum_threshold))].index)

        # 剔除股票池中盈利下滑的个股（即单季度净利润同比增长率小于0的股票）
        fundamental = get_fundamentals_n(table='deriv_finance_indicator', symbols=constituents, end_date=last_date, count=1, fields='TAGRT',df=True)
        constituents = list(fundamental[fundamental['TAGRT']>context.earning_threshold]['symbol'])

        # 在股票池剩余个股中，按股息率排序，选取股息率最高的15只个股等权构建组合
        fundamental = get_fundamentals_n(table='trading_derivative_indicator', symbols=constituents, end_date=last_date, count=1, fields='DY',df=True).sort_values('DY',ascending=False)
        context.to_buy = list(fundamental.iloc[:context.max_holding,:]['symbol'])
        print('{} 待买入股票：{}'.format(context.now,context.to_buy))
        

def begin_market(context):
    positions = context.account().positions()
    # 平不在标的池的股票
    for position in positions:
        symbol = position['symbol']
        if symbol not in context.to_buy:
            lower_limit = get_history_instruments(symbol, start_date=context.now, end_date=context.now, df=True)
            new_price = history(symbol=symbol, frequency='60s', start_time=context.now, end_time=context.now, fields='close', df=True)
            if symbol not in context.to_buy and (len(new_price)==0 or len(lower_limit)==0 or lower_limit['lower_limit'][0]!=round(new_price['close'][0],2)):
                # new_price为空时，是开盘后无成交的现象，此处忽略该情况，可能会包含涨跌停的股票
                order_target_percent(symbol=symbol, percent=0, order_type=OrderType_Market, position_side=PositionSide_Long)

    # 买在标的池中的股票
    for symbol in context.to_buy:
        upper_limit = get_history_instruments(symbol, start_date=context.now, end_date=context.now, df=True)
        new_price = history(symbol=symbol, frequency='60s', start_time=context.now, end_time=context.now, fields='close', df=True)
        if len(new_price)==0 or len(upper_limit)==0 or upper_limit['upper_limit'][0]!=round(new_price['close'][0],2):
            # new_price为空时，是开盘后无成交的现象，此处忽略该情况，可能会包含涨跌停的股票
            order_target_percent(symbol=symbol, percent=1/context.max_holding, order_type=OrderType_Market, position_side=PositionSide_Long)


def get_previous_N_trading_date(date,counts=1,exchanges='SHSE'):
    """
    获取end_date前N个交易日,end_date为datetime格式，包括date日期
    :param date：目标日期
    :param counts：历史回溯天数，默认为1，即前一天
    """
    if isinstance(date,str) and len(date)>10:
        date = datetime.datetime.strptime(date,'%Y-%m-%d %H:%M:%S')
    if isinstance(date,str) and len(date)==10:
        date = datetime.datetime.strptime(date,'%Y-%m-%d')
    previous_N_trading_date = get_trading_dates(exchange=exchanges, start_date=date-datetime.timedelta(days=max(counts+30,counts*2)), end_date=date)[-counts]
    return previous_N_trading_date


if __name__ == '__main__':
    '''
        strategy_id策略ID, 由系统生成
        filename文件名, 请与本文件名保持一致
        mode运行模式, 实时模式:MODE_LIVE回测模式:MODE_BACKTEST
        token绑定计算机的ID, 可在系统设置-密钥管理中生成
        backtest_start_time回测开始时间
        backtest_end_time回测结束时间
        backtest_adjust股票复权方式, 不复权:ADJUST_NONE前复权:ADJUST_PREV后复权:ADJUST_POST
        backtest_initial_cash回测初始资金
        backtest_commission_ratio回测佣金比例
        backtest_slippage_ratio回测滑点比例
        '''
    run(strategy_id='ef8fa58c-4dcd-11ed-bbe5-f46b8c02346f',
        filename='main.py',
        mode=MODE_BACKTEST,
        token='2cc0e58f40011fc98b77fdb8ead7c6d007208a59',
        backtest_start_time='2022-01-01 08:00:00',
        backtest_end_time='2022-07-31 16:00:00',
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=1000000,
        backtest_commission_ratio=0.0001,
        backtest_slippage_ratio=0.0001)

