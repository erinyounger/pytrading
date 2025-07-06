#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：MongoDB回测数据保存实现
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from .back_test_saver import BackTestSaver
from pytrading.logger import logger
from bson import ObjectId
from pytrading.db import mongo_db as db
from pytrading.utils import float_fmt
from datetime import datetime


class MongoBackTestDocument(db.Document):
    """MongoDB回测结果文档模型"""
    id = db.ObjectIdField(primary_key=True, default=ObjectId())
    symbol = db.StringField()
    name = db.StringField()
    created_at = db.DateTimeField(default=datetime.now)
    updated_at = db.DateTimeField(default=datetime.now)
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


class MongoBackTestSaver(BackTestSaver):
    """MongoDB回测数据保存实现"""
    
    def save(self, backtest_obj):
        """保存回测数据到MongoDB"""
        try:
            # 创建MongoDB文档
            doc = MongoBackTestDocument()
            
            # 复制数据
            data = backtest_obj.to_dict()
            for key, value in data.items():
                if hasattr(doc, key) and value is not None:
                    if isinstance(value, float):
                        value = float(float_fmt(value))
                    setattr(doc, key, value)
            
            # 设置时间戳
            doc.updated_at = datetime.now()
            if not doc.created_at:
                doc.created_at = datetime.now()
            
            # 保存到MongoDB
            doc.save()
            logger.info(f"回测数据已保存到MongoDB: {backtest_obj.symbol}")
            
        except Exception as e:
            logger.error(f"保存回测数据到MongoDB失败: {e}")
            raise 