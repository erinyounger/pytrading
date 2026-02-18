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
from pytrading.logger import logger, set_log_context, clear_log_context
from pytrading.config import config
from pytrading.utils.thread_pool import ThreadPool, Queue
from pytrading.utils import clear_disk_space
from pytrading.utils.process import exec_process
from pytrading.db.mysql import MySQLClient, BacktestTask, Strategy, BackTestResult


class PyTrading:
    """量化交易主类"""
    _active_pools = {}

    def __init__(self, symbols=None, index_symbol=None, start_time=None, end_time=None, strategy_name=None, task_id=None):
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
        self.task_id = task_id
        self.thread_pool = None

    def run(self):
        clear_disk_space(template_dir=os.path.join(config.app_root_dir, "gmcache"))
        return self.run_strategy()

    @classmethod
    def get_index_symbols(cls, index_symbol):
        """获取指数成分股列表"""
        set_token(config.token)
        index_df = stk_get_index_constituents(index=index_symbol)
        index_symbols = list(index_df.symbol.values) if not index_df.empty else []
        logger.info("Get {} Symbols: {}".format(index_symbol, len(index_symbols)))
        return index_symbols

    def _check_task_cancelled(self) -> bool:
        """检查任务是否已被取消"""
        try:
            session = self.db_client.get_session()
            try:
                task = session.query(BacktestTask).filter_by(task_id=self.task_id).first()
                if task and task.status == 'cancelled':
                    logger.info(f"任务已被取消: {self.task_id}")
                    return True
                return False
            finally:
                session.close()
        except Exception as e:
            logger.error(f"检查任务状态失败: {e}")
            return False

    def run_strategy(self):
        """执行策略"""
        if self.task_id and self._check_task_cancelled():
            logger.info(f"任务启动时被取消，跳过执行: {self.task_id}")
            return

        f_name = os.path.join(self.run_strategy_path, "run_strategy.py").replace('\\', '/')
        run_queue = Queue()

        start_time = self.start_time
        end_time = self.end_time

        session = self.db_client.get_session()
        try:
            from pytrading.db.mysql import BacktestStatus

            for _syb in self.symbols:
                if self.task_id and self._check_task_cancelled():
                    logger.info(f"任务执行中被取消，停止剩余股票: {self.task_id}")
                    break

                session.query(BackTestResult).filter_by(
                    symbol=_syb,
                    task_id=self.task_id
                ).update({"status": BacktestStatus.init})
                session.commit()

                cmd = ["cmd", "/c", sys.executable.replace('\\', '/'), f_name,
                       f"--symbol={_syb}",
                       f"--start_time=\"{start_time}\"",
                       f"--end_time=\"{end_time}\"",
                       f"--strategy_name={self.strategy_name}",
                       f"--mode={config.trading_mode}"]

                if self.task_id:
                    cmd.append(f"--task_id={self.task_id}")

                cmd_args = (" ".join(cmd),)
                kwargs = {}
                run_queue.put((exec_process, cmd_args, kwargs))
        finally:
            session.close()

        size = len(self.symbols) if config.trading_mode == MODE_LIVE else None
        threader = ThreadPool(run_queue, size=10)
        self.thread_pool = threader

        if self.task_id:
            PyTrading._active_pools[self.task_id] = threader

        try:
            threader.run()
        finally:
            if self.task_id and self.task_id in PyTrading._active_pools:
                del PyTrading._active_pools[self.task_id]

    @classmethod
    def terminate_task(cls, task_id: str):
        """取消任务"""
        if task_id in cls._active_pools:
            pool = cls._active_pools.pop(task_id)
            pool.cancel()
            logger.info(f"任务已取消: {task_id}")

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
            # 任务日志：读取到任务
            set_log_context(task_id=task_id, enable_db=True)
            
            strategy = session.query(Strategy).filter_by(id=task.strategy_id).first()
            if not strategy:
                logger.error(f"Strategy not found: {task.strategy_id}, task_id: {task_id}")
                raise Exception(f"Strategy not found: {task.strategy_id}, task_id: {task_id}")
            logger.info(f"Start Backtest Task: strategy_id={task.strategy_id}, Task ID: {task_id}, Strategy Name: {strategy.name}")
            # 更新为运行中
            task.status = 'running'
            task.progress = 0
            task.updated_at = datetime.now()
            session.commit()
            
            # 准备参数
            parameters = task.parameters or {}
            start_time = task.start_time.strftime('%Y-%m-%d %H:%M:%S')
            end_time = task.end_time.strftime('%Y-%m-%d %H:%M:%S')
            
            # 根据模式创建 PyTrading 实例
            index_symbol = parameters.get('index_symbol')
            if parameters.get('mode') == 'index' and index_symbol:
                logger.info(f"Start getting index constituents: {index_symbol}")
                symbol_list = cls.get_index_symbols(index_symbol)
                logger.info(f"Get index constituents completed: {index_symbol}, number={len(symbol_list)}")
            else:
                symbol_list = task.symbols if isinstance(task.symbols, list) else [task.symbols]
            py_trading = cls(
                symbols=symbol_list,
                index_symbol=index_symbol,
                start_time=start_time,
                end_time=end_time,
                strategy_name=strategy.name,
                task_id=task_id
            )
            logger.info(f"Start Backtest Task: Task ID: {task_id}, Strategy Name: {strategy.name}, Number of stocks: {len(symbol_list)}, Index Symbol: {index_symbol}, Start Time: {start_time}, End Time: {end_time}")
            # 更新任务进度为0，并保存当前标的列表
            task.progress = 0
            task.symbols = symbol_list
            task.updated_at = datetime.now()
            session.commit()
            # 执行回测 (复用原有逻辑)
            py_trading.run()

            # 重新查询任务状态，检查是否被取消
            session.expire(task)
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()
            if task.status == 'cancelled':
                logger.info(f"任务已被取消，不再更新为完成状态: {task_id}")
                return

            logger.info("Subtask execution completed, start summarizing results")

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
                task.result_summary = {"total_count": 0, "message": "No backtest results found"}

            task.status = 'completed'
            task.symbols = symbol_list
            task.progress = 100
            task.updated_at = datetime.now()
            session.commit()
            logger.info(f"Backtest Task execution completed: Task ID: {task_id}, Task Status: completed")

        except Exception as e:
            logger.error(f"Backtest Task execution failed: Task ID: {task_id}, Error: {str(e)}")
            logger.error(traceback.format_exc())
            try:
                task = session.query(BacktestTask).filter_by(task_id=task_id).first()
                if task:
                    task.status = 'failed'
                    task.error_message = str(e)
                    task.updated_at = datetime.now()
                    session.commit()
                logger.error(f"Backtest Task execution failed: Task ID: {task_id}, Error: {str(e)}")
            except Exception as commit_error:
                logger.error(f"Update task status failed: Task ID: {task_id}, Error: {str(commit_error)}")
            raise
        finally:
            session.close()
            clear_log_context()

if __name__ == '__main__':
    # py_trading = PyTrading(
    #     start_time="2024-06-01 09:00:00",
    #     end_time="2025-06-30 15:00:00",
    #     strategy_name="MACD"
    # )
    # py_trading.run_backtest_task("index_SHSE.000016_20251005180052")
    result = PyTrading.get_index_symbols("SHSE.000300")
    print(result)