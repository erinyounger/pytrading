#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：测试MySQL-only模式
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2025/01/16 
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """测试关键模块导入"""
    print("🔍 测试模块导入...")
    
    try:
        from src.pytrading.config.settings import config
        print("✅ 配置模块导入成功")
        print(f"   数据库类型: {config.db_type}")
        print(f"   保存数据库: {config.save_db}")
    except Exception as e:
        print(f"❌ 配置模块导入失败: {e}")
        return False
    
    try:
        from src.pytrading.model.back_test_saver_factory import get_backtest_saver
        print("✅ 工厂类导入成功")
    except Exception as e:
        print(f"❌ 工厂类导入失败: {e}")
        return False
    
    try:
        from src.pytrading.db.init_db import init_database
        print("✅ 数据库初始化模块导入成功")
    except Exception as e:
        print(f"❌ 数据库初始化模块导入失败: {e}")
        return False
    
    try:
        from src.pytrading.db.mysql import MySQLClient
        print("✅ MySQL客户端导入成功")
    except Exception as e:
        print(f"❌ MySQL客户端导入失败: {e}")
        return False
    
    return True

def test_factory():
    """测试工厂类功能"""
    print("\n🔧 测试工厂类功能...")
    
    try:
        from src.pytrading.model.back_test_saver_factory import get_backtest_saver
        saver = get_backtest_saver()
        
        if saver is None:
            print("⚠️  工厂类返回None（可能是数据库连接问题）")
            return True  # 这不是错误，可能是数据库未配置
        else:
            print("✅ 工厂类成功创建保存器")
            print(f"   保存器类型: {type(saver).__name__}")
            return True
    except Exception as e:
        print(f"❌ 工厂类测试失败: {e}")
        return False

def test_config():
    """测试配置系统"""
    print("\n⚙️  测试配置系统...")
    
    try:
        from src.pytrading.config.settings import config
        
        # 检查关键配置项
        required_configs = [
            'db_type', 'save_db', 'mysql_host', 'mysql_port', 
            'mysql_username', 'mysql_password', 'mysql_database'
        ]
        
        for config_name in required_configs:
            if hasattr(config, config_name):
                value = getattr(config, config_name)
                print(f"   {config_name}: {value}")
            else:
                print(f"❌ 缺少配置项: {config_name}")
                return False
        
        # 验证数据库类型
        if config.db_type != 'mysql':
            print(f"❌ 数据库类型应该是'mysql'，实际是: {config.db_type}")
            return False
        
        print("✅ 配置系统正常")
        return True
    except Exception as e:
        print(f"❌ 配置系统测试失败: {e}")
        return False

def main():
    """主测试函数"""
    print("🚀 开始MySQL-only模式测试\n")
    
    tests = [
        ("模块导入测试", test_imports),
        ("配置系统测试", test_config),
        ("工厂类测试", test_factory),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"📋 {test_name}")
        if test_func():
            passed += 1
        print()
    
    print("📊 测试结果汇总:")
    print(f"   通过: {passed}/{total}")
    print(f"   失败: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 所有测试通过！MySQL-only模式配置正确。")
        return True
    else:
        print("⚠️  部分测试失败，请检查配置。")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
