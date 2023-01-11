#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：back_test
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from bson import ObjectId

from pytrading.db import mongo_db as db
from pytrading.utils import float_fmt


class BackTest(db.Document):
    id = db.ObjectIdField(primary_key=True, default=ObjectId())
    symbol = db.StringField()
    name = db.StringField()
    created_at = db.DateTimeField()
    updated_at = db.DateTimeField()
    backtest_start_time = db.DateTimeField()
    backtest_end_time = db.DateTimeField()

    pnl_ratio = db.FloatField()  # 累计收益率 (pnl/cum_inout)
    sharp_ratio = db.FloatField()  # 夏普比率
    max_drawdown = db.FloatField()  # 最大回撤
    risk_ratio = db.FloatField()  # 风险比率 （持仓市值/nav）
    open_count = db.IntField()  # 开仓次数
    close_count = db.IntField()  # 平仓次数
    win_count = db.IntField()  # 盈利次数（平仓价格大于持仓均价vwap的次数）
    lose_count = db.IntField()  # 亏损次数 （平仓价格小于或者等于持仓均价vwap的次数）
    win_ratio = db.FloatField()  # 胜率
    trending_type = db.StringField()

    def init_attr(self, **kwargs):
        for k, v in kwargs.items():
            if hasattr(self, k):
                if isinstance(v, float):
                    v = float(float_fmt(v))
                setattr(self, k, v)
