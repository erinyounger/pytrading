#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project ：pytrading 
@File    ：test_mysql.py
@Author  ：Claude
@Date    ：2025/7/6 1:44 
"""
# !/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os

# 修复路径设置
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(project_root, 'src'))

from pytrading.db.mysql import MySQLClient
from pytrading.config.settings import config


def test_mysql_connection():
    print("=== MySQL 连接测试 (PyMySQL 驱动) ===")
    print(f"主机: {config.mysql_host}")
    print(f"端口: {config.mysql_port}")
    print(f"数据库: {config.mysql_database}")
    print(f"用户名: {config.mysql_username}")
    print()
    
    try:
        # 步骤1：创建客户端
        print("🔄 创建MySQL客户端...")
        client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        print("✅ MySQL客户端创建成功")
        
        # 步骤2：测试基本连接
        print("🔄 测试数据库连接...")
        if client.test_connection():
            print("✅ 数据库连接测试成功")
        else:
            print("❌ 数据库连接测试失败")
            return
        
        # 步骤3：创建表
        print("🔄 创建数据表...")
        client.create_tables()
        print("✅ 数据表创建成功")
        
        # 步骤4：测试会话
        print("🔄 测试数据库会话...")
        session = client.get_session()
        if session:
            print("✅ 数据库会话创建成功")
            session.close()
            print("✅ 数据库会话关闭成功")
        else:
            print("❌ 数据库会话创建失败")
            return
        
        print("\n🎉 所有测试通过！MySQL连接正常工作")
        
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保已安装PyMySQL: pip install PyMySQL")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()


def test_pymysql_direct():
    """直接使用PyMySQL测试连接"""
    print("\n=== 直接PyMySQL连接测试 ===")
    try:
        import pymysql
        
        # 创建连接
        connection = pymysql.connect(
            host=config.mysql_host,
            port=config.mysql_port,
            user=config.mysql_username,
            password=config.mysql_password,
            database=config.mysql_database,
            charset='utf8mb4'
        )
        
        print("✅ PyMySQL 直接连接成功")
        
        # 测试查询
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"✅ 查询测试成功: {result}")
        
        connection.close()
        print("✅ PyMySQL 连接关闭成功")
        
    except ImportError:
        print("❌ PyMySQL 未安装，请运行: pip install PyMySQL")
    except Exception as e:
        print(f"❌ PyMySQL 直接连接失败: {e}")


if __name__ == "__main__":
    # 首先测试直接PyMySQL连接
    test_pymysql_direct()
    
    # 然后测试SQLAlchemy + PyMySQL
    test_mysql_connection()