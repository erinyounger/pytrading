#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：情绪分析器 - 计算市场情绪评分
@Author  ：EEric
@Date    ：2026-04-26
"""
from typing import Dict, Any, Optional
from pytrading.logger import logger
from pytrading.utils.akshare_util import akshare_util
from pytrading.schemas.market_data import SentimentData, MarketSentimentData


class SentimentAnalyzer:
    """情绪分析器 - 计算情绪评分 (-1 to 1)"""

    # 评分权重
    WEIGHTS = {
        "hot_rank": 0.40,    # 热度排名
        "sector": 0.60,     # 板块情绪
    }

    def __init__(self):
        self.akshare = akshare_util

    async def analyze_sentiment(self, symbol: str, sector_name: Optional[str] = None) -> Dict[str, Any]:
        """分析股票情绪

        Args:
            symbol: 股票代码
            sector_name: 板块名称（可选）

        Returns:
            Dict: 包含 sentiment_score 和详细数据
        """
        try:
            logger.info(f"[情绪分析] {symbol} 开始获取情绪数据...")

            # 获取股票热度情绪
            sentiment_data = self.akshare.get_stock_sentiment(symbol)
            hot_rank = sentiment_data.get("hot_rank")
            hot_sentiment = sentiment_data.get("sentiment_score", 0.0)
            logger.info(f"[情绪分析] {symbol} 热度数据: hot_rank={hot_rank}, hot_sentiment={hot_sentiment}")

            # 获取板块情绪
            sector_sentiment = 0.0
            sector_name_found = sector_name
            if sector_name:
                logger.info(f"[情绪分析] {symbol} 使用指定板块: {sector_name}")
                sector_data = self.akshare.get_sector_sentiment(sector_name)
                if sector_data:
                    sector_sentiment = sector_data.get("score", 0.0)
                    sector_name_found = sector_data.get("board_name", sector_name)
                    logger.info(f"[情绪分析] {symbol} 板块情绪: {sector_sentiment}")
            else:
                # 尝试自动获取板块
                try:
                    logger.info(f"[情绪分析] {symbol} 自动获取所属板块...")
                    stock_info = self.akshare.get_stock_individual_info(symbol)
                    industry = stock_info.get("行业")
                    if industry:
                        logger.info(f"[情绪分析] {symbol} 所属行业: {industry}")
                        sector_data = self.akshare.get_sector_sentiment(industry)
                        if sector_data:
                            sector_sentiment = sector_data.get("score", 0.0)
                            sector_name_found = industry
                            logger.info(f"[情绪分析] {symbol} 板块情绪: {sector_sentiment}")
                except Exception as e:
                    logger.warning(f"[情绪分析] {symbol} 自动获取板块失败: {e}")

            # 综合评分
            if hot_rank is not None:
                sentiment_score = (
                    hot_sentiment * self.WEIGHTS["hot_rank"] +
                    sector_sentiment * self.WEIGHTS["sector"]
                )
                logger.info(f"[情绪分析] {symbol} 综合情绪评分: {sentiment_score:.3f} (热度*{self.WEIGHTS['hot_rank']} + 板块*{self.WEIGHTS['sector']})")
            else:
                sentiment_score = sector_sentiment
                logger.info(f"[情绪分析] {symbol} 综合情绪评分: {sentiment_score:.3f} (仅板块)")

            # 限制范围
            sentiment_score = max(-1.0, min(1.0, sentiment_score))

            logger.info(f"[情绪分析] {symbol} 最终情绪评分: {sentiment_score:.3f}")

            return {
                "sentiment_score": round(sentiment_score, 3),
                "hot_rank": hot_rank,
                "hot_sentiment": hot_sentiment,
                "sector_sentiment": sector_sentiment,
                "sector_name": sector_name_found,
                "description": sentiment_data.get("description", ""),
            }

        except Exception as e:
            logger.error(f"[情绪分析] {symbol} 分析失败: {e}")
            return {
                "sentiment_score": 0.0,
                "hot_rank": None,
                "hot_sentiment": 0.0,
                "sector_sentiment": 0.0,
                "sector_name": sector_name,
                "description": "数据获取失败",
            }

    async def get_market_sentiment(self) -> MarketSentimentData:
        """获取市场整体情绪

        Returns:
            MarketSentimentData: 市场情绪数据
        """
        try:
            import akshare as ak

            # 获取全市场行情
            spot = ak.stock_zh_a_spot_em()

            if spot is None or spot.empty:
                return MarketSentimentData(
                    sentiment="neutral",
                    score=0.0,
                    description="数据获取失败",
                    timestamp="",
                )

            # 计算涨跌家数
            up_count = len(spot[spot['涨跌幅'] > 0])
            down_count = len(spot[spot['涨跌幅'] < 0])
            total = len(spot)

            up_ratio = up_count / total if total > 0 else 0.5

            # 判断情绪
            if up_ratio > 0.6:
                sentiment = "bullish"
                score = min((up_ratio - 0.5) * 2, 1.0)
            elif up_ratio < 0.4:
                sentiment = "bearish"
                score = max((up_ratio - 0.5) * 2, -1.0)
            else:
                sentiment = "neutral"
                score = 0.0

            return MarketSentimentData(
                sentiment=sentiment,
                score=round(score, 3),
                description=f"上涨 {up_count} 家，下跌 {down_count} 家",
                timestamp="",
            )

        except Exception as e:
            logger.error(f"获取市场情绪失败: {e}")
            return MarketSentimentData(
                sentiment="neutral",
                score=0.0,
                description="市场情绪数据获取失败，请稍后重试",
                timestamp="",
            )


# 全局实例
sentiment_analyzer = SentimentAnalyzer()
