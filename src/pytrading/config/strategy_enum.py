#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：strategy_enum
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/21 15:27 
"""


class StrategyType:
    MACD = "MACD"
    BOLL = "BOLL"
    TURTLE = "TURTLE"

    ALL = (MACD, BOLL, TURTLE)


class TrendingType:
    """趋势分类，分类后按照所定义的趋势阶段编写交易策略"""
    TrendingUnknown = "Unknown"  # 非交易阶段
    Observing = "Observing"  # 出现上涨信号，纳入交易关注，本阶段默认持仓1手
    RisingUp = "RisingUp"  # 上涨阶段，主要是加仓，识别降低风险
    ZeroAxisRisingUp = "ZeroAxisUp"  # 零轴线向上

    DeadXDecliningDown = "DeadXDown"  # 死叉下降阶段，逐步减仓
    ContinueDecliningDown = "FallingDown"  # 连续下降
    UpAndDown = "UpDown"  # 横盘震荡趋势中

