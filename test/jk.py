#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：jk
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2023/1/15 0:08 
"""
from jqdatasdk.technical_analysis import *
import jqdatasdk as jq
jq.auth('17748686897', 'Gfy@1024')

# 定义股票池列表
security_list1 = '002528.SZSE'
# security_list2 = ['000001.XSHE','000002.XSHE','601211.XSHG','603177.XSHG']
# 计算并输出 security_list1 的 ATR 值
MTR1,ATR1 = ATR(security_list1, check_date='2022-12-29', timeperiod=14)
print(MTR1[security_list1])
print(ATR1[security_list1])

# 输出 security_list2 的 ATR 值
# MTR2,ATR2 = ATR(security_list2, check_date='2017-01-04', timeperiod=14)
# for stock in security_list2:
#     print(MTR2[stock])
#     print(ATR2[stock])