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

from gm.api import *
from pytrading.logger import logger
from pytrading.config import config
from pytrading.utils.thread_pool import ThreadPool, Queue
from pytrading.utils import clear_disk_space
from pytrading.utils.process import exec_process


class PyTrading:
    def __init__(self):
        self.run_strategy_path = os.path.join(config.app_root_dir, "src", "pytrading", "run")

    def run(self, strategy_name):
        clear_disk_space(template_dir=os.path.join(config.app_root_dir, "gmcache"))
        return self.run_strategy(strategy_name)

    def get_symbols(self):
        """批量获取股票列表"""
        set_token(config.token)
        # 沪深300：SHSE.000300
        # 中证500：SHSE.000905
        # sz300_df = get_constituents(index='SHSE.000905', fields='symbol, weight', df=True)
        sz300_df = stk_get_index_constituents(index='SHSE.000300')
        # sz300_symbols = list(sz300_df[sz300_df.weight < 0.5].symbol.values)
        sz300_symbols = list(sz300_df.symbol.values)
        logger.info("Get SHSE.000300 Symbols: {}".format(len(sz300_symbols)))
        return sz300_symbols

    def run_strategy(self, strategy_name=None):
        """执行策略"""
        f_name = os.path.join(self.run_strategy_path, "run_strategy.py").replace('\\', '/')
        symbol_list = config.symbols if config.symbols else self.get_symbols()
        run_queue = Queue()

        start_time = '2020-01-01 09:00:00'
        end_time = '2025-06-30 15:00:00'

        for _syb in symbol_list:
            cmd = ["cmd", "/c", sys.executable.replace('\\', '/'), f_name,
                   f"--symbol={_syb}",
                   f"--start_time=\"{start_time}\"",
                   f"--end_time=\"{end_time}\"",
                   f"--strategy_name={strategy_name}",
                   f"--mode={config.trading_mode}"]
            cmd_args = (" ".join(cmd),)
            kwargs = {}
            run_queue.put((exec_process, cmd_args, kwargs))
        size = len(symbol_list) if config.trading_mode == MODE_LIVE else None
        threader = ThreadPool(run_queue, size=size)
        threader.run()
