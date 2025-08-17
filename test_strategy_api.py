#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：测试策略API
@Author  ：Claude
@Date    ：2025-08-17
"""
import requests
import json

def test_strategy_api():
    """测试策略API是否使用了枚举类型"""
    try:
        # 调用策略API
        response = requests.get('http://localhost:8000/api/strategies')
        
        if response.status_code == 200:
            data = response.json()
            strategies = data.get('data', [])
            
            print("✅ 策略API调用成功")
            print(f"📊 返回了 {len(strategies)} 个策略")
            
            for i, strategy in enumerate(strategies, 1):
                print(f"\n{i}. 策略名称: {strategy['name']}")
                print(f"   显示名称: {strategy['display_name']}")
                print(f"   描述: {strategy['description']}")
                
                # 检查是否使用了枚举值
                if strategy['name'] in ['MACD', 'BOLL', 'TURTLE']:
                    print(f"   ✅ 使用了枚举类型: {strategy['name']}")
                else:
                    print(f"   ❌ 仍在使用硬编码: {strategy['name']}")
        else:
            print(f"❌ API调用失败: {response.status_code}")
            print(f"错误信息: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == "__main__":
    test_strategy_api()
