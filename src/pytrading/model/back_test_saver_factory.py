#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：回测数据保存器工厂
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""


def get_backtest_saver():
    """获取MySQL回测数据保存器"""
    try:
        from .mysql_back_test_saver import MySQLBackTestSaver
        saver = MySQLBackTestSaver()
        # 测试连接
        saver.test_connection()
        return saver
    except Exception as e:
        print(f"ERROR: MySQL数据库连接失败 - {str(e)}")
        return None