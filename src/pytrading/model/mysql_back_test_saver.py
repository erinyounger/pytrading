#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：MySQL回测数据保存实现
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
import traceback
from decimal import Decimal
from datetime import datetime

from .back_test_saver import BackTestSaver
from pytrading.logger import logger
from pytrading.db.mysql import MySQLClient, BackTestResult
from pytrading.config import config
from pytrading.utils import float_fmt


class MySQLBackTestSaver(BackTestSaver):
    """MySQL回测数据保存实现"""
    
    def __init__(self):
        self.mysql_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
    
    def save(self, backtest_obj):
        """保存回测数据到MySQL"""
        logger.info("开始保存回测数据到MySQL")
        session = self.mysql_client.get_session()
        
        try:
            # 获取数据并转换
            data = backtest_obj.to_dict()
            
            # 安全的数据类型转换
            safe_data = {}
            for key, value in data.items():
                if value is None:
                    safe_data[key] = None
                elif isinstance(value, (int, str)):
                    safe_data[key] = value
                elif isinstance(value, float):
                    # 转换为Decimal避免精度问题
                    safe_data[key] = Decimal(str(float_fmt(value)))
                elif isinstance(value, datetime):
                    safe_data[key] = value
                else:
                    safe_data[key] = str(value)
            
            # 检查是否已存在相同记录
            existing = session.query(BackTestResult).filter_by(
                symbol=safe_data['symbol'],
                backtest_start_time=safe_data['backtest_start_time'],
                backtest_end_time=safe_data['backtest_end_time']
            ).first()
            
            if existing:
                # 更新现有记录
                for key, value in safe_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                existing.updated_at = datetime.now()
                logger.info(f"更新已存在的回测记录: {safe_data['symbol']}")
            else:
                # 创建新记录
                safe_data['created_at'] = datetime.now()
                safe_data['updated_at'] = datetime.now()
                result = BackTestResult(**safe_data)
                session.add(result)
                logger.info(f"创建新的回测记录: {safe_data['symbol']}")
            
            # 提交事务
            session.commit()
            
        except Exception as e:
            logger.error(f"保存回测数据到MySQL失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            session.rollback()
            raise
        finally:
            session.close() 