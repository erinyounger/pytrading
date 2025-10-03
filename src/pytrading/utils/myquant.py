#!/usr/bin/env python
# -*- coding: UTF-8 -*-
"""
@Project ：pytrading 
@File    ：myquant.py
@Author  ：Claude
@Date    ：2025/10/4 0:08 
"""
from gm.api import *

def get_current_price(symbol):
    """获取当前价格，只支持单个标的，只返回价格"""
    results = current_price(symbol)
    if results and isinstance(results, list) and len(results) > 0:
        return results[0].get('price')
    return None
    