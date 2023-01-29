#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：base
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/6 22:39 
"""


class StrategyBase:
    def __init__(self):
        pass

    def setup(self, context):
        """初始化策略"""
        pass

    def run(self, context):
        """执行策略，返回Order"""

    def run_schedule(self, context):
        """执行定时策略"""
