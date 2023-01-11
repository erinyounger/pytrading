#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：py_trading
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/4 22:16 
"""
import os

from gm.api import *
from pytrading.logger import logger
from pytrading.config import PYTHON_INTERPRETER, SYMBOLS_LIST, TOKEN, TRADING_MODE, APP_ROOT_DIR
from pytrading.utils.thread_pool import ThreadPool, Queue
from pytrading.utils import exec_process, clear_disk_space


class PyTrading:
    def __init__(self):
        self.run_strategy_path = os.path.join(APP_ROOT_DIR, "src", "pytrading", "run")

    def run(self, strategy_name):
        clear_disk_space(template_dir=os.path.join(APP_ROOT_DIR, "gmcache"))
        if strategy_name == "macd_strategy":
            return self.run_macd_strategy()

    def get_symbols(self):
        set_token(TOKEN)
        sz300_df = get_constituents(index='SHSE.000300', fields='symbol, weight', df=True)
        # sz300_symbols = list(sz300_df[sz300_df.weight < 0.5].symbol.values)
        sz300_symbols = list(sz300_df.symbol.values)
        logger.info("Get SHSE.000300 Weight < 0.5 Symbols: {}".format(len(sz300_symbols)))
        return sz300_symbols

    def run_macd_strategy(self):
        f_name = os.path.join(self.run_strategy_path, "run_macd_strategy.py").replace('\\', '/')
        symbol_list = SYMBOLS_LIST if len(SYMBOLS_LIST) else self.get_symbols()
        run_queue = Queue()

        start_time = '2022-01-01 09:00:00'
        end_time = '2022-12-30 15:00:00'

        for _syb in symbol_list:
            # if _syb in EXCLUDED_SYMBOLS:
            #     continue
            cmd = ["cmd", "/c", PYTHON_INTERPRETER, f_name,
                   f"--symbol={_syb}",
                   f"--start_time=\"{start_time}\"",
                   f"--end_time=\"{end_time}\"",
                   f"--mode={TRADING_MODE}"]
            args = (" ".join(cmd),)
            kwargs = {}
            run_queue.put((exec_process, args, kwargs))
        size = len(symbol_list) if TRADING_MODE == MODE_LIVE else None
        threader = ThreadPool(run_queue, size=size)
        threader.run()
