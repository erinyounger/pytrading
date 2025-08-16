#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：回测数据保存器工厂
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""


def get_backtest_saver():
    """根据配置获取回测数据保存器"""
    try:
        from pytrading.config.settings import config
        from pytrading.logger import logger
        
        db_type = getattr(config, 'db_type', 'mongodb').lower()
        
        if db_type == 'mysql':
            try:
                from .mysql_back_test_saver import MySQLBackTestSaver
                saver = MySQLBackTestSaver()
                # 测试连接
                saver.test_connection()
                return saver
            except Exception as e:
                print(f"ERROR: MySQL数据库连接失败 - {str(e)}")
                return None
                
        elif db_type == 'mongodb':
            try:
                from .mongo_back_test_saver import MongoBackTestSaver
                saver = MongoBackTestSaver()
                # 测试连接
                saver.test_connection()
                return saver
            except Exception as e:
                print(f"ERROR: MongoDB数据库连接失败 - {str(e)}")
                return None
        else:
            print(f"ERROR: 不支持的数据库类型: {db_type}")
            return None
            
    except Exception as e:
        print(f"ERROR: 初始化数据库保存器失败 - {str(e)}")
        return None