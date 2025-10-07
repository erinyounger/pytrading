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
    
    @abstractmethod
    def test_connection(self):
        """测试数据库连接"""
        raise NotImplementedError("Must implement test_connection method")
    
    @abstractmethod
    def get_all_results(
        self,
        symbol=None,
        start_date=None,
        end_date=None,
        trending_type=None,
        min_pnl_ratio=None,
        max_pnl_ratio=None,
        min_win_ratio=None,
        max_win_ratio=None,
        limit=100,
        page=1,
        per_page=10,
    ):
        """获取所有回测结果，支持分页与筛选（在数据库层执行）"""
        raise NotImplementedError("Must implement get_all_results method")