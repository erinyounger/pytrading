#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：回测数据保存接口
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from abc import ABC, abstractmethod


class BackTestSaver(ABC):
    """回测数据保存接口"""
    
    @abstractmethod
    def save(self, backtest_obj):
        """保存回测数据"""
        raise NotImplementedError("Must implement save method") 