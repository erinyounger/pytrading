#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：back_test
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from pytrading.utils import float_fmt
from .back_test_saver_factory import get_backtest_saver
from datetime import datetime


class BackTest:
    """回测结果数据模型"""
    
    def __init__(self):
        self.symbol = None
        self.name = None
        self.created_at = None
        self.updated_at = None
        self.backtest_start_time = None
        self.backtest_end_time = None
        self.pnl_ratio = None  # 累计收益率 (pnl/cum_inout)
        self.sharp_ratio = None  # 夏普比率
        self.max_drawdown = None  # 最大回撤
        self.risk_ratio = None  # 风险比率 （持仓市值/nav）
        self.open_count = None  # 开仓次数
        self.close_count = None  # 平仓次数
        self.win_count = None  # 盈利次数（平仓价格大于持仓均价vwap的次数）
        self.lose_count = None  # 亏损次数 （平仓价格小于或者等于持仓均价vwap的次数）
        self.win_ratio = None  # 胜率
        self.trending_type = None # 趋势类型
        self.strategy_name = None # 策略名称

    def init_attr(self, **kwargs):
        """初始化属性"""
        for k, v in kwargs.items():
            if hasattr(self, k):
                if isinstance(v, float):
                    v = float(float_fmt(v))
                setattr(self, k, v)
    
    def to_dict(self):
        """转换为字典"""
        return {
            "symbol": self.symbol,
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "backtest_start_time": self.backtest_start_time,
            "backtest_end_time": self.backtest_end_time,
            "pnl_ratio": self.pnl_ratio,
            "sharp_ratio": self.sharp_ratio,
            "max_drawdown": self.max_drawdown,
            "risk_ratio": self.risk_ratio,
            "open_count": self.open_count,
            "close_count": self.close_count,
            "win_count": self.win_count,
            "lose_count": self.lose_count,
            "win_ratio": self.win_ratio,
            "trending_type": self.trending_type,
            "strategy_name": self.strategy_name,
        }
    
    def save(self):
        """保存回测数据"""
        saver = get_backtest_saver()
        saver.save(self)
