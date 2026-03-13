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
import traceback

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
src_path = os.path.join(project_root, "src")
sys.path.insert(0, src_path)

from pytrading.controller.order_controller import OrderController
from pytrading.strategy.strategy_macd import MacdStrategy
from pytrading.strategy.strategy_boll import BollStrategy
from pytrading.strategy.strategy_turtle import TurtleStrategy
from pytrading.model.back_test import BackTest
from pytrading.logger import logger, set_log_context, clear_log_context
from pytrading.config import config
from pytrading.utils import is_live_mode
from pytrading.config.strategy_enum import StrategyType
from pytrading.utils.myquant import get_current_price
from pytrading.db.mysql import BacktestStatus
from pytrading.utils.talib_util import ATR
from pytrading.service.trade_record_service import TradeRecordService

order_controller = OrderController()


def get_market_data(symbol):
    """获取市场数据：7日平均成交量、市值、ATR"""
    import pandas as pd
    from datetime import datetime, timedelta

    try:
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        # 获取历史行情数据
        bars = history(symbol=symbol, frequency='1d', start_time=start_date, end_time=end_date,
                       fields='symbol,open,high,low,close,volume', df=True)

        if bars is None or bars.empty:
            return None, None, None

        # 计算7日平均成交量（单位：万手）
        volume_avg_7d = bars['volume'].tail(7).mean() / 10000 if len(bars) >= 7 else None

        # 计算ATR
        atr = ATR(bars['high'].values, bars['low'].values, bars['close'].values, timeperiod=14)
        atr_value = float(atr[-1]) if not pd.isna(atr[-1]) else None

        # 获取市值（使用最新数据）
        try:
            # 获取市值数据，不传日期返回最新
            mkt_data = stk_get_daily_mktvalue_pt(symbols=symbol, fields='symbol,tot_mv', df=True)
            if mkt_data is not None and not mkt_data.empty:
                # tot_mv 单位是分，转为亿元
                market_cap = float(mkt_data['tot_mv'].iloc[0]) / 100000000
            else:
                market_cap = None
        except Exception as e:
            logger.warning(f"获取市值失败: {symbol}, error: {e}")
            market_cap = None

        return volume_avg_7d, atr_value, market_cap

    except Exception as e:
        logger.warning(f"获取市场数据失败: {symbol}, error: {e}")
        return None, None, None


def init(context):
    # 1.初始化订单实例
    order_controller.setup(context=context)
    # 2.初始化策略实例
    logger.info(f"Run Strategy Name: {context.strategy_name}")
    
    if context.strategy_name == StrategyType.MACD:
        """MACD趋势策略"""
        context.stgy_instance = MacdStrategy(short=12, long=26, period=3000, atr_multiplier=2.0)
    elif context.strategy_name == StrategyType.BOLL:
        """布林带策略"""
        context.stgy_instance = BollStrategy()
    elif context.strategy_name == StrategyType.TURTLE:
        """海龟交易策略"""
        context.stgy_instance = TurtleStrategy()
    else:
        raise ValueError(f"不支持的策略类型: {context.strategy_name}")
    
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
        # 记录交易信号到数据库
        if hasattr(order, 'signal_action') and order.signal_action:
            try:
                current_price = bars[0].close if bars else None
                TradeRecordService.save_trade_record(
                    task_id=getattr(context, 'task_id', None),
                    symbol=context.symbol,
                    action=order.signal_action,
                    target_percent=order.trade_n if order.signal_action in ('buy', 'sell') else None,
                    price=current_price,
                    volume=order.trade_n if order.signal_action == 'build' else None,
                    signal_type=order.signal_type,
                    bar_time=context.now,
                )
            except Exception as e:
                logger.warning(f"记录交易信号失败: {e}")


def on_order_status(context, order):
    # 标的代码
    symbol = order['symbol']
    # 获取 task_id
    task_id = getattr(context, 'task_id', None)
    # 使用 extra 参数传递 task_id 和 symbol（解决多线程问题）
    log_extra = {'task_id': task_id, 'symbol': symbol} if task_id else {}
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
        if side == 1:
            side_effect = '买入'
        elif side == 2:
            side_effect = '卖出'
        order_type_word = '限价' if order_type == 1 else '市价'
        logger.info('{}:标的：{}，操作：以{}{}，委托价格：{}，委托数量：{}'.format(context.now, symbol, order_type_word, side_effect, price,
                                                               volume), extra=log_extra)


def on_backtest_finished(context, indicator):
    """回测结束"""
    # 获取 task_id 和 symbol
    task_id = getattr(context, 'task_id', None)
    symbol = getattr(context, 'symbol', None)
    # 使用 extra 参数传递 task_id 和 symbol（解决多线程问题）
    log_extra = {'task_id': task_id, 'symbol': symbol} if task_id else {}

    try:
        back_test_obj = BackTest()
        back_test_obj.symbol = context.symbol
        back_test_obj.strategy_name = context.strategy_name
        back_test_obj.init_attr(**indicator)
        stock_info = get_instruments(symbols=context.symbol, df=False)
        if len(stock_info) > 0:
            back_test_obj.name = stock_info[0]["sec_name"]
        back_test_obj.trending_type = context.stgy_instance.trending_type
        back_test_obj.backtest_start_time = context.backtest_start_time
        back_test_obj.backtest_end_time = context.backtest_end_time
        back_test_obj.current_price = get_current_price(back_test_obj.symbol)
        back_test_obj.status = BacktestStatus.finished  # 标记为已完成

        # 获取市场数据：7日平均成交量、ATR、市值
        # 注意：行业数据为付费功能，此处不再获取
        volume_avg_7d, atr_value, market_cap = get_market_data(context.symbol)
        back_test_obj.volume_avg_7d = volume_avg_7d
        back_test_obj.atr = atr_value
        back_test_obj.market_cap = market_cap

        # 填充 task_id
        if hasattr(context, 'task_id') and context.task_id:
            back_test_obj.task_id = context.task_id

        # 打印回测结果信息
        logger.info(f"回测完成, 标的：{back_test_obj.symbol}, 股票名称：{back_test_obj.name}, \n \
        策略名称：{back_test_obj.strategy_name}, \n \
        当前趋势：{back_test_obj.trending_type}, \n \
        回测开始时间：{back_test_obj.backtest_start_time}, \n \
        回测结束时间：{back_test_obj.backtest_end_time}, \n \
        累计收益率：{back_test_obj.pnl_ratio}, \n \
        夏普比率：{back_test_obj.sharp_ratio}, \n \
        最大回撤：{back_test_obj.max_drawdown}, \n \
        风险比率：{back_test_obj.risk_ratio}, \n \
        开仓次数：{back_test_obj.open_count}, \n \
        平仓次数：{back_test_obj.close_count}, \n \
        盈利次数：{back_test_obj.win_count}, \n \
        亏损次数：{back_test_obj.lose_count}, \n \
        胜率：{back_test_obj.win_ratio}, \n \
        当前价格：{back_test_obj.current_price}, \n \
        任务ID：{back_test_obj.task_id}",
        extra=log_extra
        )

        # 如果需要保存到数据库
        if config.save_db:
            back_test_obj.save()

        # 保存K线数据（每次回测完成后同步最新K线数据）
        try:
            save_kline_data(context.symbol)
        except Exception as e:
            logger.warning(f"保存K线数据失败: {context.symbol}, error: {e}")

        # 更新任务进度
        if hasattr(context, 'task_id') and context.task_id:
            update_task_progress(context.task_id)
            
    except Exception as ex:
        logger.error("保存数据到数据库失败, Error: {}, Task ID: {}".format(ex, context.task_id))
        logger.exception(ex)
    logger.info(f"Back Test End, Symbol: {context.symbol}, Task ID: {context.task_id}")


def update_task_progress(task_id: str):
    """更新任务进度"""
    try:
        from pytrading.db.mysql import MySQLClient, BacktestTask, BackTestResult
        
        db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        session = db_client.get_session()
        
        try:
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()
            if not task:
                return
            
            # 计算已完成的股票数量
            completed_count = session.query(BackTestResult).filter_by(
                task_id=task.task_id,
                status=BacktestStatus.finished
            ).count()
            
            # 计算总股票数量
            total_count = len(task.symbols) if isinstance(task.symbols, list) else 1
            
            # 更新进度
            if total_count > 0:
                progress = int((completed_count / total_count) * 100)
                task.progress = min(progress, 99)  # 最多99%,100%由主任务设置
                session.commit()
        finally:
            session.close()
    except Exception as e:
        logger.error(f"Update task progress failed: {str(e)}, Task ID: {task_id}")


def save_kline_data(symbol: str, days: int = 365):
    """保存K线数据到数据库"""
    from datetime import datetime, timedelta
    from pytrading.db.mysql import MySQLClient, StockKline
    from pytrading.utils.talib_util import TA_MACD
    import pandas as pd

    try:
        # 计算日期范围
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days + 60)).strftime('%Y-%m-%d')

        # 获取历史K线数据
        bars = history(
            symbol=symbol,
            frequency='1d',
            start_time=start_date,
            end_time=end_date,
            fields='symbol,open,high,low,close,volume,eob',
            df=True
        )

        if bars is None or bars.empty:
            logger.warning(f"获取K线数据失败: {symbol}")
            return

        # 计算MACD
        close_prices = bars['close'].values.astype(float)
        diff, dea, macd_hist = TA_MACD(close_prices, fastperiod=12, slowperiod=26, signalperiod=9)

        # 获取数据库连接
        db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        session = db_client.get_session()

        try:
            # 保留最近的 days 天数据
            bars = bars.tail(days).reset_index(drop=True)
            diff = diff[-days:] if len(diff) >= days else diff
            dea = dea[-days:] if len(dea) >= days else dea
            macd_hist = macd_hist[-days:] if len(macd_hist) >= days else macd_hist

            for i in range(len(bars)):
                row = bars.iloc[i]
                # 解析日期
                if 'eob' in row:
                    date_val = row['eob']
                else:
                    continue

                # 检查是否已存在
                existing = session.query(StockKline).filter_by(
                    symbol=symbol,
                    date=date_val.date() if isinstance(date_val, datetime) else date_val
                ).first()

                if existing:
                    # 更新
                    existing.open = float(row['open']) if pd.notna(row['open']) else None
                    existing.high = float(row['high']) if pd.notna(row['high']) else None
                    existing.low = float(row['low']) if pd.notna(row['low']) else None
                    existing.close = float(row['close']) if pd.notna(row['close']) else None
                    existing.volume = int(row['volume']) if pd.notna(row['volume']) and row['volume'] else 0
                    existing.macd_diff = float(diff[i]) if i < len(diff) and pd.notna(diff[i]) else None
                    existing.macd_dea = float(dea[i]) if i < len(dea) and pd.notna(dea[i]) else None
                    existing.macd_hist = float(macd_hist[i]) if i < len(macd_hist) and pd.notna(macd_hist[i]) else None
                else:
                    # 新增
                    kline = StockKline(
                        symbol=symbol,
                        date=date_val.date() if isinstance(date_val, datetime) else date_val,
                        open=float(row['open']) if pd.notna(row['open']) else None,
                        high=float(row['high']) if pd.notna(row['high']) else None,
                        low=float(row['low']) if pd.notna(row['low']) else None,
                        close=float(row['close']) if pd.notna(row['close']) else None,
                        volume=int(row['volume']) if pd.notna(row['volume']) and row['volume'] else 0,
                        macd_diff=float(diff[i]) if i < len(diff) and pd.notna(diff[i]) else None,
                        macd_dea=float(dea[i]) if i < len(dea) and pd.notna(dea[i]) else None,
                        macd_hist=float(macd_hist[i]) if i < len(macd_hist) and pd.notna(macd_hist[i]) else None
                    )
                    session.add(kline)

            session.commit()
            logger.info(f"K线数据保存完成: {symbol}")

        finally:
            session.close()

    except Exception as e:
        logger.error(f"保存K线数据失败: {symbol}, error: {str(e)}")


def on_error(context, code, info):
    # 获取 task_id 和 symbol
    task_id = getattr(context, 'task_id', None)
    symbol = getattr(context, 'symbol', None)
    # 使用 extra 参数传递 task_id 和 symbol（解决多线程问题）
    log_extra = {'task_id': task_id, 'symbol': symbol} if task_id else {}
    print('code:{}, info:{}'.format(code, info))
    logger.error(f'策略执行出错: code={code}, info={info}', extra=log_extra)


def multiple_run(strategy_id, symbol, backtest_start_time, backtest_end_time, strategy_name, mode=MODE_BACKTEST, task_id=None):
    from gm.model.storage import context
    context.symbol = symbol
    context.strategy_name = strategy_name
    context.backtest_start_time = backtest_start_time
    context.backtest_end_time = backtest_end_time
    context.task_id = task_id  # 传递task_id用于进度更新
    # 为当前 symbol 设置日志上下文
    if task_id:
        set_log_context(task_id=task_id, symbol=symbol, enable_db=True)
    run(strategy_id=strategy_id,
        filename=os.path.basename(__file__),
        mode=mode,
        token=config.token,
        backtest_start_time=backtest_start_time,
        backtest_end_time=backtest_end_time,
        backtest_adjust=ADJUST_PREV,
        backtest_initial_cash=200000000000,
        backtest_commission_ratio=0.0003,  # 万三佣金
        backtest_slippage_ratio=0.001,     # 千一滑点
        # serv_addr="192.168.3.139:7001"
        )
    # 清理上下文
    clear_log_context()


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
    cli_parser.add_option("--task_id", action="store",
                          dest="task_id",
                          default=None,
                          help="回测任务ID(可选)")
    (arg_options, cli_args) = cli_parser.parse_args()

    # 清楚接收的参数，避免影响run接收参数
    sys.argv = []

    # 转换mode参数：支持字符串和整数
    mode_value = arg_options.mode
    if isinstance(mode_value, str):
        if mode_value.lower() in ('backtest', '2'):
            mode_value = MODE_BACKTEST
        elif mode_value.lower() in ('live', '1'):
            mode_value = MODE_LIVE
        else:
            mode_value = MODE_BACKTEST
    logger.info("Mode: {}, StrategeID: {}, StrategyName: {}, Symbol: {}, StartTime: {}, EndTime: {}, SaveDB: {}, TaskID: {}".format(
        arg_options.mode, arg_options.strategy_id, arg_options.strategy_name, arg_options.symbol,
        arg_options.start_time, arg_options.end_time, config.save_db, arg_options.task_id))
    multiple_run(arg_options.strategy_id,
                 arg_options.symbol,
                 backtest_start_time=arg_options.start_time,
                 backtest_end_time=arg_options.end_time,
                 strategy_name=arg_options.strategy_name,
                 mode=mode_value,
                 task_id=arg_options.task_id)


if __name__ == '__main__':
    try:
        logger.info("Start Run Strategy.")
        run_cli()
        logger.info("End Run Strategy.")
    except Exception as e:
        logger.error(f"Run Strategy Error.\n{traceback.format_exc()}")
    # multiple_run(strategy_id="f981bc35-5313-11f0-901c-00ff136bef06",
    #              symbol='SZSE.000977',
    #              backtest_start_time='2024-01-01 01:00:00',
    #              backtest_end_time='2025-01-02 15:00:00',
    #              strategy_name='MACD_STRATEGY',
    #              mode=2)
