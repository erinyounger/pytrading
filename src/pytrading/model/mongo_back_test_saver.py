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
    
    def test_connection(self):
        """测试MongoDB数据库连接"""
        try:
            # 尝试执行简单查询测试连接
            MongoBackTestDocument.objects().limit(1).first()
            return True
        except Exception as e:
            logger.error(f"MongoDB数据库连接测试失败: {e}")
            raise e
    
    def get_all_results(self, symbol=None, start_date=None, end_date=None, limit=100):
        """获取所有回测结果"""
        logger.info(f"从MongoDB获取回测结果，参数: symbol={symbol}, limit={limit}")
        
        try:
            query = MongoBackTestDocument.objects()
            
            # 应用过滤条件
            if symbol:
                query = query.filter(symbol__icontains=symbol)
            if start_date:
                query = query.filter(backtest_start_time__gte=start_date)
            if end_date:
                query = query.filter(backtest_end_time__lte=end_date)
            
            # 按创建时间倒序排列并限制结果数量
            query = query.order_by('-created_at').limit(limit)
            
            results = []
            for doc in query:
                result_dict = {
                    'id': str(doc.id),
                    'symbol': doc.symbol,
                    'name': doc.name,
                    'backtest_start_time': doc.backtest_start_time.strftime('%Y-%m-%d %H:%M:%S') if doc.backtest_start_time else None,
                    'backtest_end_time': doc.backtest_end_time.strftime('%Y-%m-%d %H:%M:%S') if doc.backtest_end_time else None,
                    'pnl_ratio': float(doc.pnl_ratio) if doc.pnl_ratio else 0.0,
                    'sharp_ratio': float(doc.sharp_ratio) if doc.sharp_ratio else 0.0,
                    'max_drawdown': float(doc.max_drawdown) if doc.max_drawdown else 0.0,
                    'risk_ratio': float(doc.risk_ratio) if doc.risk_ratio else 0.0,
                    'open_count': doc.open_count or 0,
                    'close_count': doc.close_count or 0,
                    'win_count': doc.win_count or 0,
                    'lose_count': doc.lose_count or 0,
                    'win_ratio': float(doc.win_ratio) if doc.win_ratio else 0.0,
                    'trending_type': doc.trending_type,
                    'created_at': doc.created_at.strftime('%Y-%m-%d %H:%M:%S') if doc.created_at else None,
                }
                results.append(result_dict)
            
            logger.info(f"成功从MongoDB获取 {len(results)} 条回测结果")
            return results
            
        except Exception as e:
            logger.error(f"从MongoDB获取回测结果失败: {e}")
            raise e
    
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