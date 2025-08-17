#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：数据库初始化脚本
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
from pytrading.config import config
from pytrading.logger import logger


def init_mysql():
    """初始化MySQL数据库"""
    try:
        from .mysql import MySQLClient
        client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        client.create_tables()
        logger.info("MySQL数据库初始化成功")
    except Exception as e:
        logger.error(f"MySQL数据库初始化失败: {e}")
        raise


def init_database():
    """根据配置初始化数据库"""
    db_type = getattr(config, 'db_type', 'mysql').lower()
    
    if db_type == 'mysql':
        init_mysql()
    else:
        logger.warning(f"不支持的数据库类型: {db_type}")


if __name__ == '__main__':
    init_database() 