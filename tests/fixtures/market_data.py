"""
市场数据测试夹具

提供不同行情场景的 MACD 指标数据, 用于策略信号检测的参数化测试.
每个场景返回 numpy 数组, 模拟 talib.MACD 的输出格式.
"""

import numpy as np


def golden_cross_macd():
    """金叉场景: MACD 柱状图从负变正 (DIF 上穿 DEA)

    Returns:
        dict: 包含 diff, dea, macd 数组, 最后两根柱子体现金叉
    """
    return {
        "diff": np.array([-0.15, -0.12, -0.08, -0.04, -0.01]),
        "dea": np.array([-0.10, -0.09, -0.07, -0.05, -0.03]),
        "macd": np.array([-0.10, -0.06, -0.02, -0.01, 0.04]),
        "description": "MACD从负变正, 金叉信号",
    }


def dead_cross_macd():
    """死叉场景: MACD 柱状图从正变负 (DIF 下穿 DEA)

    Returns:
        dict: 包含 diff, dea, macd 数组, 最后两根柱子体现死叉
    """
    return {
        "diff": np.array([0.15, 0.12, 0.08, 0.04, 0.01]),
        "dea": np.array([0.10, 0.09, 0.07, 0.05, 0.03]),
        "macd": np.array([0.10, 0.06, 0.02, 0.01, -0.04]),
        "description": "MACD从正变负, 死叉信号",
    }


def up_cross_zero_axis():
    """DIF 上穿零轴: DIF 从负变正

    Returns:
        dict: 包含 diff 数组, 最后两根柱子体现上穿零轴
    """
    return {
        "diff": np.array([-0.20, -0.15, -0.08, -0.02, 0.03]),
        "dea": np.array([-0.15, -0.12, -0.08, -0.04, -0.01]),
        "macd": np.array([-0.10, -0.06, 0.00, 0.04, 0.08]),
        "description": "DIF从负变正, 上穿零轴",
    }


def down_cross_zero_axis():
    """DIF 下穿零轴: DIF 从正变负

    Returns:
        dict: 包含 diff 数组, 最后两根柱子体现下穿零轴
    """
    return {
        "diff": np.array([0.20, 0.15, 0.08, 0.02, -0.03]),
        "dea": np.array([0.15, 0.12, 0.08, 0.04, 0.01]),
        "macd": np.array([0.10, 0.06, 0.00, -0.04, -0.08]),
        "description": "DIF从正变负, 下穿零轴",
    }


def bullish_trending():
    """看涨趋势: DIF 在零轴上方且持续上升

    Returns:
        dict: DIF 连续3天上涨且在零轴上方
    """
    return {
        "diff": np.array([0.05, 0.08, 0.12, 0.18, 0.25]),
        "dea": np.array([0.03, 0.05, 0.08, 0.12, 0.16]),
        "macd": np.array([0.04, 0.06, 0.08, 0.12, 0.18]),
        "description": "DIF在零轴上方连续上升",
    }


def bearish_trending():
    """看跌趋势: DIF 在零轴下方且持续下降

    Returns:
        dict: DIF 连续下降且在零轴下方
    """
    return {
        "diff": np.array([-0.05, -0.08, -0.12, -0.18, -0.25]),
        "dea": np.array([-0.03, -0.05, -0.08, -0.12, -0.16]),
        "macd": np.array([-0.04, -0.06, -0.08, -0.12, -0.18]),
        "description": "DIF在零轴下方连续下降",
    }


def sideways_market():
    """横盘震荡: MACD 在零轴附近来回波动

    Returns:
        dict: MACD 值在零附近小幅波动
    """
    return {
        "diff": np.array([0.01, -0.01, 0.02, -0.01, 0.01]),
        "dea": np.array([0.00, 0.00, 0.01, 0.00, 0.00]),
        "macd": np.array([0.02, -0.02, 0.02, -0.02, 0.02]),
        "description": "MACD在零轴附近震荡",
    }


def no_cross_positive():
    """持续正值无交叉: MACD 始终为正

    Returns:
        dict: MACD 持续正值
    """
    return {
        "diff": np.array([0.10, 0.12, 0.15, 0.13, 0.14]),
        "dea": np.array([0.08, 0.09, 0.11, 0.11, 0.12]),
        "macd": np.array([0.04, 0.06, 0.08, 0.04, 0.04]),
        "description": "MACD持续正值, 无交叉",
    }
