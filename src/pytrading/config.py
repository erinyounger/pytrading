#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：config
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/12/12 0:16 
"""
import os

from gm.api import MODE_BACKTEST, MODE_LIVE

APP_ROOT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")

# ------------------------ 账号设置信息 ----------------------
# 交易模式
TRADING_MODE = MODE_BACKTEST
# TRADING_MODE = MODE_LIVE

# 使用的策略ID
BACKTEST_STRATEGY_ID = '010bc4d9-8b43-11ed-8710-00ffc033e1eb'
LIVE_STRATEGY_ID = '28de0f36-7d4f-11ed-a603-00ffc033e1eb'

STRATEGY_ID = LIVE_STRATEGY_ID if TRADING_MODE == MODE_LIVE else BACKTEST_STRATEGY_ID
# Windows客户端连接TOKEN
TOKEN = '2cc0e58f40011fc98b77fdb8ead7c6d007208a59'
# 竞赛交易实盘账号
ACCOUNT_ID_LIVE = "75dddca9-52e8-11ed-a31f-00163e12c161"

# ----------------------- 交易标的设置 ------------------------
# SYMBOLS_LIST = []   # 为空是默认获取沪深300所有股票
SYMBOLS_LIST = """
SZSE.002459
SZSE.002920
""".strip().splitlines()
