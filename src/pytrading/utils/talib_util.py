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

TalibExpAdjust = False  # pandas默认是True，同花顺默认是False。True时，最近的值权重会大些。数据足够多的时候，趋向一致。


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


def wwma(values, n):
    """
     J. Welles Wilder's EMA
    """
    return values.ewm(alpha=1 / n, adjust=False).mean()


def ATR_CN(df, n=14):
    """计算ATR
        TR=max(High(T−Low(T),abs(Close(T−1)−High(T)),abs(Close(T−1)−Low(T)))
        N日ATR实际上就是TR的N日移动平均值，即:ATR=MA(TR,N)
        1.真实波幅（TR）： TR = MAX（∣最高价-最低价∣，∣最高价-昨收∣，∣昨收-最低价∣）
        2.真实波幅均值（ATR）： ATR = TR的N日简单移动平均
    """
    # for i in range(0, len(df)):
    #     df.loc[df.index[i], 'TR'] = max((df['close'][i] - df['low'][i]), (df['high'][i] - df['close'].shift(-1)[i]),
    #                                     (df['low'][i] - df['close'].shift(-1)[i]))
    # df['ATR'] = df['TR'].rolling(n).mean()
    # return df['ATR']

    data = df.copy()
    high = data["high"]
    low = data["low"]
    close = data["close"]
    data['tr0'] = abs(high - low)
    data['tr1'] = abs(high - close.shift())
    data['tr2'] = abs(low - close.shift())
    tr = data[['tr0', 'tr1', 'tr2']].max(axis=1)
    atr = wwma(tr, n)
    return atr


def EWMA(X, alpha, adjust=TalibExpAdjust):
    """
        指数加权移动平均值
        数据长度10000以下时，比pandas要快
        @X: numpy array or list
        @alpha: 平滑指数
        @adjust: pandas里默认是True，这里默认是False跟同花顺保持一致。True时最近的权重会大些。
        @return: list
    """
    weightedX = [0] * len(X)
    weightedX[0] = X[0]

    if adjust:
        numerator = X[0]
        denominator = 1

        for i in range(1, len(X)):
            numerator = X[i] + numerator * (1 - alpha)
            denominator = 1 + denominator * (1 - alpha)

            weightedX[i] = numerator / denominator
    else:
        for i in range(1, len(X)):
            weightedX[i] = alpha * X[i] + (1 - alpha) * weightedX[i - 1]

    return weightedX


def EMA(X, N, adjust=TalibExpAdjust):
    """
        同花顺的EMA
        数据长度5000以下时，比pandas要快
        @X: numpy array or list
        @N: 周期
        @adjust: pandas里默认是True，这里默认是False跟同花顺保持一致。True时，最近的值权重会大些。
        @return: list
    """
    alpha = 2 / (N + 1)

    return EWMA(X, alpha, adjust=adjust)


def ATR(highs, lows, closes, timeperiod=14, adjust=TalibExpAdjust):
    """
        @return: list，前@timeperiod个元素的值是NaN。主要因为计算差值多占用了一个元素。
    """
    assert len(highs) == len(lows) == len(closes)

    trs = [0] * (len(highs) - 1)
    for i in range(1, len(highs)):
        tr = max(highs[i], closes[i - 1]) - min(lows[i], closes[i - 1])
        trs[i - 1] = tr

    atr = EMA(trs, timeperiod, adjust=adjust)

    atr.insert(0, np.nan)
    atr[:timeperiod] = [np.nan] * timeperiod

    return atr
