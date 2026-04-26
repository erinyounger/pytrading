#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：技术分析器 - 计算技术评分
@Author  ：EEric
@Date    ：2026-04-26
"""
from typing import Dict, Any, Optional, List
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from pytrading.logger import logger
from pytrading.db.mysql import StockKline


class TechnicalAnalyzer:
    """技术分析器 - 计算技术评分 (0-100)"""

    # 评分权重
    WEIGHTS = {
        "trend": 0.25,      # 趋势 (MA)
        "momentum": 0.30,   # 动能 (RSI, MACD)
        "volume": 0.20,     # 成交量
        "volatility": 0.25 # 波动性
    }

    def __init__(self, db_session=None):
        self.db_session = db_session

    def calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """计算RSI指标

        Args:
            prices: 价格列表
            period: 计算周期

        Returns:
            float: RSI值 (0-100)
        """
        if len(prices) < period + 1:
            return 50.0  # 数据不足返回中性

        deltas = np.diff(prices)
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)

        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return float(rsi)

    def calculate_macd(self, prices: List[float], fast: int = 12, slow: int = 26, signal: int = 9) -> tuple:
        """计算MACD指标

        Args:
            prices: 价格列表
            fast: 快线周期
            slow: 慢线周期
            signal: 信号线周期

        Returns:
            tuple: (diff, dea, macd_hist)
        """
        if len(prices) < slow + signal:
            return (0.0, 0.0, 0.0)

        prices_array = np.array(prices)

        # 计算EMA
        def ema(data, period):
            ema = [data[0]]
            multiplier = 2 / (period + 1)
            for i in range(1, len(data)):
                ema.append((data[i] - ema[-1]) * multiplier + ema[-1])
            return np.array(ema)

        ema_fast = ema(prices_array, fast)
        ema_slow = ema(prices_array, slow)

        diff = ema_fast - ema_slow
        dea = ema(diff.tolist(), signal)
        macd_hist = 2 * (diff - dea)

        return (float(diff[-1]), float(dea[-1]), float(macd_hist[-1]))

    def calculate_ma(self, prices: List[float], periods: List[int] = [5, 10, 20, 60]) -> Dict[int, float]:
        """计算移动平均线

        Args:
            prices: 价格列表
            periods: 周期列表

        Returns:
            Dict: {周期: MA值}
        """
        result = {}
        for period in periods:
            if len(prices) >= period:
                result[period] = float(np.mean(prices[-period:]))
            else:
                result[period] = prices[-1] if prices else 0.0
        return result

    def calculate_volume_ratio(self, volumes: List[int], period: int = 20) -> float:
        """计算量比

        Args:
            volumes: 成交量列表
            period: 计算周期

        Returns:
            float: 量比 (当前成交量/平均成交量)
        """
        if len(volumes) < period:
            return 1.0

        avg_volume = np.mean(volumes[-period:])
        current_volume = volumes[-1]

        if avg_volume == 0:
            return 1.0

        return float(current_volume / avg_volume)

    def calculate_trend_score(self, prices: List[float]) -> float:
        """计算趋势评分

        Args:
            prices: 价格列表

        Returns:
            float: 趋势评分 (0-100)
        """
        if len(prices) < 60:
            return 50.0

        ma = self.calculate_ma(prices, [5, 10, 20, 60])
        current_price = prices[-1]

        score = 50.0

        # 短周期 > 长周期 => 上升趋势
        if ma[5] > ma[10] > ma[20] > ma[60]:
            score += 30
        elif ma[5] > ma[10] > ma[20]:
            score += 20
        elif ma[5] > ma[10]:
            score += 10

        # 价格在各均线上方
        if current_price > ma[5]:
            score += 10
        if current_price > ma[20]:
            score += 5

        # 限制范围
        return min(max(score, 0), 100)

    def calculate_momentum_score(self, prices: List[float]) -> float:
        """计算动能评分

        Args:
            prices: 价格列表

        Returns:
            float: 动能评分 (0-100)
        """
        if len(prices) < 26:
            return 50.0

        rsi = self.calculate_rsi(prices)
        diff, dea, macd_hist = self.calculate_macd(prices)

        score = 50.0

        # RSI评分 (超买超卖)
        if rsi > 70:
            score += 15  # 可能过热
        elif rsi < 30:
            score -= 15  # 可能超卖
        elif 40 <= rsi <= 60:
            score += 5   # 中性偏强

        # MACD评分
        if macd_hist > 0:
            score += 15  # 上升动能
        else:
            score -= 15  # 下降动能

        # MACD金叉/死叉
        if diff > dea:
            score += 10

        return min(max(score, 0), 100)

    def calculate_volume_score(self, volumes: List[int]) -> float:
        """计算成交量评分

        Args:
            volumes: 成交量列表

        Returns:
            float: 成交量评分 (0-100)
        """
        volume_ratio = self.calculate_volume_ratio(volumes)

        score = 50.0

        if volume_ratio > 2.0:
            score += 25  # 放量
        elif volume_ratio > 1.5:
            score += 15
        elif volume_ratio < 0.5:
            score -= 25  # 缩量
        elif volume_ratio < 0.8:
            score -= 10

        return min(max(score, 0), 100)

    def calculate_volatility_score(self, prices: List[float]) -> float:
        """计算波动性评分

        Args:
            prices: 价格列表

        Returns:
            float: 波动性评分 (0-100)
        """
        if len(prices) < 20:
            return 50.0

        # 计算近期波动率
        recent_prices = prices[-20:]
        returns = np.diff(recent_prices) / recent_prices[:-1]
        volatility = np.std(returns) * np.sqrt(252)  # 年化波动率

        score = 50.0

        # 适度波动是好的，过高或过低都不好
        if 0.15 <= volatility <= 0.35:
            score += 25  # 正常波动
        elif 0.10 <= volatility < 0.15:
            score += 10  # 低波动
        elif volatility > 0.50:
            score -= 25  # 高波动风险
        elif volatility > 0.35:
            score -= 10  # 偏高波动

        return min(max(score, 0), 100)

    def get_technical_score(self, symbol: str, days: int = 60) -> Dict[str, Any]:
        """获取技术评分

        Args:
            symbol: 股票代码
            days: 分析天数

        Returns:
            Dict: 包含 technical_score 和各维度评分
        """
        try:
            logger.info(f"[技术分析] {symbol} 开始获取K线数据, 天数: {days}")

            # 从数据库获取K线数据
            if self.db_session:
                klines = self.db_session.query(StockKline).filter(
                    StockKline.symbol == symbol
                ).order_by(StockKline.date.desc()).limit(days).all()

                if not klines:
                    logger.warning(f"[技术分析] {symbol} 暂无K线数据, 返回默认评分")
                    return self._default_result()

                # 反转顺序（从旧到新）
                klines = list(reversed(klines))
                kline_count = len(klines)

                prices = [float(k.close) for k in klines if k.close]
                volumes = [int(k.volume) for k in klines if k.volume]
                logger.info(f"[技术分析] {symbol} 获取K线 {kline_count} 条, 有效价格数据: {len(prices)}")
            else:
                logger.warning("[技术分析] 无数据库会话，使用默认评分")
                return self._default_result()

            if len(prices) < 20:
                logger.warning(f"[技术分析] {symbol} K线数据不足: {len(prices)}天, 需要20天以上, 返回默认评分")
                return self._default_result()

            # 计算各维度评分
            logger.info(f"[技术分析] {symbol} 计算趋势评分...")
            trend_score = self.calculate_trend_score(prices)
            logger.info(f"[技术分析] {symbol} 趋势评分: {trend_score:.2f}")

            logger.info(f"[技术分析] {symbol} 计算动能评分...")
            momentum_score = self.calculate_momentum_score(prices)
            logger.info(f"[技术分析] {symbol} 动能评分: {momentum_score:.2f}")

            logger.info(f"[技术分析] {symbol} 计算成交量评分...")
            volume_score = self.calculate_volume_score(volumes)
            logger.info(f"[技术分析] {symbol} 成交量评分: {volume_score:.2f}")

            logger.info(f"[技术分析] {symbol} 计算波动性评分...")
            volatility_score = self.calculate_volatility_score(prices)
            logger.info(f"[技术分析] {symbol} 波动性评分: {volatility_score:.2f}")

            # 计算RSI和MACD
            rsi = self.calculate_rsi(prices)
            diff, dea, macd_hist = self.calculate_macd(prices)
            logger.info(f"[技术分析] {symbol} RSI: {rsi:.2f}, MACD: diff={diff:.4f}, dea={dea:.4f}, hist={macd_hist:.4f}")

            # 加权计算总分
            technical_score = (
                trend_score * self.WEIGHTS["trend"] +
                momentum_score * self.WEIGHTS["momentum"] +
                volume_score * self.WEIGHTS["volume"] +
                volatility_score * self.WEIGHTS["volatility"]
            )
            logger.info(f"[技术分析] {symbol} 综合技术评分: {technical_score:.2f}")

            return {
                "technical_score": round(technical_score, 2),
                "trend_score": round(trend_score, 2),
                "momentum_score": round(momentum_score, 2),
                "volume_score": round(volume_score, 2),
                "volatility_score": round(volatility_score, 2),
                "rsi": round(rsi, 2),
                "macd_diff": round(diff, 4),
                "macd_dea": round(dea, 4),
                "macd_hist": round(macd_hist, 4),
            }

        except Exception as e:
            logger.error(f"[技术分析] {symbol} 计算失败: {e}")
            return self._default_result()

    def _default_result(self) -> Dict[str, Any]:
        """返回默认评分"""
        return {
            "technical_score": 50.0,
            "trend_score": 50.0,
            "momentum_score": 50.0,
            "volume_score": 50.0,
            "volatility_score": 50.0,
            "rsi": 50.0,
            "macd_diff": 0.0,
            "macd_dea": 0.0,
            "macd_hist": 0.0,
        }


# 全局实例
technical_analyzer = TechnicalAnalyzer()
