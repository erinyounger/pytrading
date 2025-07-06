#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：回测数据保存器工厂
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from pytrading.config import config
from pytrading.logger import logger


def get_backtest_saver():
    """根据配置获取回测数据保存器"""
    db_type = getattr(config, 'db_type', 'mongodb').lower()
    
    if db_type == 'mysql':
        logger.info("使用MySQL保存回测数据")
        from .mysql_back_test_saver import MySQLBackTestSaver
        return MySQLBackTestSaver()
    elif db_type == 'mongodb':
        logger.info("使用MongoDB保存回测数据")
        from .mongo_back_test_saver import MongoBackTestSaver
        return MongoBackTestSaver()
    else:
        logger.warning(f"不支持的数据库类型: {db_type}，使用默认的MongoDB")
        from .mongo_back_test_saver import MongoBackTestSaver
        return MongoBackTestSaver() 