#!/usr/bin/env python 
# -*- coding:utf-8 -*-
"""
@Description    ：py_trading
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/4 22:16 
"""
import os
import sys
import traceback
from datetime import datetime

from gm.api import *
from pytrading.logger import logger
from pytrading.config import config
from pytrading.utils.thread_pool import ThreadPool, Queue
from pytrading.utils import clear_disk_space
from pytrading.utils.process import exec_process
from pytrading.db.mysql import MySQLClient, BacktestTask, Strategy, BackTestResult


class PyTrading:
    def __init__(self, symbols=None, index_symbol=None, start_time=None, end_time=None, strategy_name=None):
        self.run_strategy_path = os.path.join(config.app_root_dir, "src", "pytrading", "run")
        self.db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        self.symbols = symbols
        self.index_symbol = index_symbol
        self.start_time = start_time
        self.end_time = end_time
        self.strategy_name = strategy_name

    def run(self):
        clear_disk_space(template_dir=os.path.join(config.app_root_dir, "gmcache"))
        return self.run_strategy()

    def get_symbols(self):
        """获取指数成分股列表"""
        if len(self.symbols) > 0:
            "指定标的直接返回"
            return self.symbols
        if not self.index_symbol:
            raise ValueError("index_symbol is required")
        set_token(config.token)
        index_df = stk_get_index_constituents(index=self.index_symbol)
        index_symbols = list(index_df.symbol.values) if not index_df.empty else []
        logger.info("Get {} Symbols: {}".format(self.index_symbol, len(index_symbols)))
        return index_symbols

    def run_strategy(self):
        """执行策略"""
        f_name = os.path.join(self.run_strategy_path, "run_strategy.py").replace('\\', '/')
        symbol_list = self.get_symbols()
        run_queue = Queue()

        start_time = self.start_time
        end_time = self.end_time    

        for _syb in symbol_list:
            cmd = ["cmd", "/c", sys.executable.replace('\\', '/'), f_name,
                   f"--symbol={_syb}",
                   f"--start_time=\"{start_time}\"",
                   f"--end_time=\"{end_time}\"",
                   f"--strategy_name={self.strategy_name}",
                   f"--mode={config.trading_mode}"]
            cmd_args = (" ".join(cmd),)
            kwargs = {}
            run_queue.put((exec_process, cmd_args, kwargs))
        size = len(symbol_list) if config.trading_mode == MODE_LIVE else None
        threader = ThreadPool(run_queue, size=size)
        threader.run()

    @classmethod
    def run_backtest_task(cls, task_id: str):
        """从数据库读取任务并执行回测"""
        db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        session = db_client.get_session()
        
        try:
            # 获取任务和策略
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()
            if not task:
                logger.error(f"任务不存在: {task_id}")
                return
            
            strategy = session.query(Strategy).filter_by(id=task.strategy_id).first()
            if not strategy:
                raise Exception(f"策略不存在: {task.strategy_id}")
            
            # 更新为运行中
            task.status = 'running'
            task.progress = 0
            task.updated_at = datetime.now()
            session.commit()
            logger.info(f"开始执行回测任务: {task_id}, 策略: {strategy.name}")
            
            # 准备参数
            parameters = task.parameters or {}
            start_time = task.start_time.strftime('%Y-%m-%d %H:%M:%S')
            end_time = task.end_time.strftime('%Y-%m-%d %H:%M:%S')
            
            # 根据模式创建 PyTrading 实例
            if parameters.get('mode') == 'index':
                index_symbol = parameters.get('index_symbol')
                py_trading = cls(
                    symbols=[],
                    index_symbol=index_symbol,
                    start_time=start_time,
                    end_time=end_time,
                    strategy_name=strategy.name
                )
                logger.info(f"创建指数回测任务: {index_symbol}, 开始时间: {start_time}, 结束时间: {end_time}, 策略: {strategy.name}")
            else:
                symbol_list = task.symbols if isinstance(task.symbols, list) else [task.symbols]
                py_trading = cls(
                    symbols=symbol_list,
                    index_symbol=None,
                    start_time=start_time,
                    end_time=end_time,
                    strategy_name=strategy.name
                )
                logger.info(f"创建单股票回测任务: {symbol_list}, 开始时间: {start_time}, 结束时间: {end_time}, 策略: {strategy.name}")
            
            # 执行回测 (复用原有逻辑)
            py_trading.run()
            
            # 汇总结果
            results = session.query(BackTestResult).filter_by(
                strategy_name=strategy.name
            ).filter(
                BackTestResult.backtest_start_time == task.start_time,
                BackTestResult.backtest_end_time == task.end_time
            ).all()
            
            if results:
                total = len(results)
                task.result_summary = {
                    "total_count": total,
                    "avg_pnl_ratio": round(sum([float(r.pnl_ratio or 0) for r in results]) / total, 4),
                    "avg_sharp_ratio": round(sum([float(r.sharp_ratio or 0) for r in results]) / total, 4),
                    "avg_max_drawdown": round(sum([float(r.max_drawdown or 0) for r in results]) / total, 4),
                    "avg_win_ratio": round(sum([float(r.win_ratio or 0) for r in results]) / total, 4),
                    "completed_at": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
            else:
                task.result_summary = {"total_count": 0, "message": "未找到回测结果"}
            
            task.status = 'completed'
            task.progress = 100
            task.updated_at = datetime.now()
            session.commit()
            logger.info(f"回测任务执行成功: {task_id}")
            
        except Exception as e:
            logger.error(f"执行回测任务失败: {task_id}, 错误: {str(e)}")
            logger.error(traceback.format_exc())
            try:
                task = session.query(BacktestTask).filter_by(task_id=task_id).first()
                if task:
                    task.status = 'failed'
                    task.error_message = str(e)
                    task.updated_at = datetime.now()
                    session.commit()
            except Exception as commit_error:
                logger.error(f"更新任务状态失败: {str(commit_error)}")
            raise
        finally:
            session.close()

if __name__ == '__main__':
    py_trading = PyTrading(
        start_time="2024-06-01 09:00:00",
        end_time="2025-06-30 15:00:00",
        strategy_name="MACD"
    )
    py_trading.run_backtest_task("index_SHSE.000016")