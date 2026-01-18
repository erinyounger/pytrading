#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：xTrading - 量化交易系统启动脚本
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 15:15
@Note   ：Python策略包名为pytrading，App应用名为xTrading
"""

import sys
import os

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
sys.path.insert(0, env_path)

from pytrading.config.strategy_enum import StrategyType
from pytrading.py_trading import PyTrading
from pytrading.config import config

if __name__ == '__main__':
    application = PyTrading(symbols=config.symbols, strategy_name=StrategyType.MACD, start_time=config.start_time, end_time=config.end_time)
    application.run()
