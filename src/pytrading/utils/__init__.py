#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：__init__.py
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/5 14:32 
"""
import re
import os
import copy
import shlex
import sys
import shutil

import psutil
from decimal import Decimal
import datetime

from gm.api import MODE_LIVE
from pytrading.config import TRADING_MODE


def float_fmt(value):
    """格式化小数点，四舍五入"""
    return Decimal(value).quantize(Decimal("0.001"), rounding="ROUND_HALF_UP")


def cmp_time_str(s1, s2, time_format="%Y-%m-%d %H:%M:%S"):
    """对比两个时间字符串"""
    dt1 = datetime.datetime.strptime(s1, time_format)
    dt2 = datetime.datetime.strptime(s2, time_format)
    return dt1 > dt2


def is_live_mode():
    return TRADING_MODE == MODE_LIVE


def clear_disk_space(logic_path="E:\\", usage_limit=0.6, template_dir=None):
    disk_percent = psutil.disk_usage(path=logic_path).percent
    if disk_percent > usage_limit and template_dir and os.path.exists(template_dir):
        shutil.rmtree(template_dir)
