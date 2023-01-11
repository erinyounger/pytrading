#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：test
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/5 10:04 
"""
import os
import sys
import talib
from optparse import OptionParser

if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-s", "--symbol", action="store",
                      dest="symbol",
                      default="SZSE.000625",
                      help="股票标的")
    parser.add_option("-t", "--start_time", action="store",
                      dest="start_time",
                      default="2021-01-01 09:00:00",
                      help="回测开始时间")
    parser.add_option("-e", "--end_time", action="store",
                      dest="end_time",
                      default="2022-10-30 15:00:00",
                      help="回测结束时间")
    (options, args) = parser.parse_args()
    print("sys.argv", sys.argv)
    print("options, args:", options, args)
    print(options.symbol)