#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：talib_util
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/5 16:24 
"""
import talib
import pandas as pd
import numpy as np

from pytrading.utils import float_fmt


def TA_MACD(close, fastperiod=12, slowperiod=26, signalperiod=9):
    """利用talib计算MACD"""
    diff, dea, macd = talib.MACD(close, fastperiod=fastperiod, slowperiod=slowperiod, signalperiod=signalperiod)
    diff = np.array(list(map(float_fmt, diff)))
    dea = np.array(list(map(float_fmt, dea)))
    macd = np.array(list(map(float_fmt, macd)))
    return diff, dea, macd[-1] * 2


def MACD_CN(close: pd.DataFrame, fastperiod=12, slowperiod=26, signalperiod=9):
    """根据计算公式计算MACD"""
    df = pd.DataFrame()
    df["EMA12"] = close.ewm(alpha=2 / (fastperiod + 1), adjust=False).mean()
    df["EMA26"] = close.ewm(alpha=2 / (slowperiod + 1), adjust=False).mean()
    df["DIFF"] = df["EMA12"] - df["EMA26"]
    df["DEA"] = df["DIFF"].ewm(alpha=2 / (signalperiod + 1), adjust=False).mean()
    df["MACD"] = 2 * (df["DIFF"] - df["DEA"])

    df["DIFF"].iloc[0] = 0
    df["DEA"].iloc[0] = 0
    df["MACD"].iloc[0] = 0

    return df["DIFF"].values, df["DEA"].values, df["MACD"].values
