#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：run
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 15:15 
"""
import sys
import os

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
sys.path.insert(0, env_path)

from pytrading.py_trading import PyTrading

if __name__ == '__main__':
    application = PyTrading()
    application.run("macd_strategy")
