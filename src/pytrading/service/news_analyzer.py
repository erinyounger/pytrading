#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：新闻影响分析器 - 分析新闻对股票的影响
@Author  ：EEric
@Date    ：2026-04-26
"""
from typing import Dict, Any, List
from pytrading.logger import logger
from pytrading.utils.akshare_util import akshare_util
from pytrading.schemas.market_data import NewsItem


class NewsImpactAnalyzer:
    """新闻影响分析器 - 分析新闻情感和影响"""

    # 新闻来源权重（权威性）
    SOURCE_WEIGHTS = {
        "央视": 1.2,
        "百度": 1.0,
        "财经": 0.9,
        "unknown": 0.8,
    }

    # 关键词情感字典
    POSITIVE_KEYWORDS = [
        "涨", "上涨", "涨停", "突破", "创新高", "新高",
        "盈利", "增长", "净利润", "营收", "业绩预增",
        "分红", "回购", "增持", "中标", "签约",
        "合作", "扩张", "转型", "升级", "布局",
        "利好", "看好", "推荐", "买入", "买入评级",
    ]

    NEGATIVE_KEYWORDS = [
        "跌", "下跌", "跌停", "破位", "新低",
        "亏损", "下降", "净利润下滑", "业绩预减",
        "减持", "抛售", "诉讼", "处罚", "调查",
        "风险", "警示", "警告", "退市", "ST",
        "利空", "看空", "卖出", "卖出评级",
    ]

    def __init__(self):
        self.akshare = akshare_util

    def analyze_news(self, symbol: str, days: int = 7) -> Dict[str, Any]:
        """分析新闻影响

        Args:
            symbol: 股票代码
            days: 分析天数

        Returns:
            Dict: 包含 news_impact 和详细数据
        """
        try:
            logger.info(f"[新闻分析] {symbol} 开始获取新闻, 天数: {days}")

            # 获取新闻
            raw_news = self.akshare.get_stock_news(symbol, days)
            logger.info(f"[新闻分析] {symbol} 获取到 {len(raw_news) if raw_news else 0} 条新闻")

            if not raw_news:
                logger.info(f"[新闻分析] {symbol} 暂无新闻数据")
                return self._default_result()

            # 转换为 NewsItem
            news_items = []
            for raw in raw_news:
                try:
                    sentiment = self._analyze_text_sentiment(
                        raw.get("title", "") + " " + (raw.get("content") or "")
                    )
                    news_items.append(NewsItem(
                        title=raw.get("title", ""),
                        content=raw.get("content"),
                        url=raw.get("url"),
                        publish_date=raw.get("publish_date"),
                        sentiment=sentiment,
                        source=raw.get("source", "unknown"),
                    ))
                except Exception as e:
                    logger.warning(f"[新闻分析] {symbol} 解析新闻失败: {raw}, error: {e}")

            logger.info(f"[新闻分析] {symbol} 成功解析 {len(news_items)} 条新闻")

            # 计算新闻影响
            news_impact = self._calculate_news_impact(news_items)
            logger.info(f"[新闻分析] {symbol} 新闻影响评分: {news_impact:.3f}")

            # 统计情感分布
            positive_count = len([n for n in news_items if n.sentiment > 0.2])
            negative_count = len([n for n in news_items if n.sentiment < -0.2])
            neutral_count = len(news_items) - positive_count - negative_count
            logger.info(f"[新闻分析] {symbol} 情感统计: 正面={positive_count}, 负面={negative_count}, 中性={neutral_count}")

            description = self._generate_description(news_items, positive_count, negative_count)
            logger.info(f"[新闻分析] {symbol} 新闻描述: {description}")

            return {
                "news_impact": round(news_impact, 3),
                "news_count": len(news_items),
                "positive_count": positive_count,
                "negative_count": negative_count,
                "neutral_count": neutral_count,
                "news_items": news_items[:10],  # 最多返回10条
                "description": description,
            }

        except Exception as e:
            logger.error(f"[新闻分析] {symbol} 分析失败: {e}")
            return self._default_result()

    def _analyze_text_sentiment(self, text: str) -> float:
        """基于关键词的新闻情感分析

        Args:
            text: 新闻文本

        Returns:
            float: 情感分数 (-1 to 1)
        """
        if not text:
            return 0.0

        text_lower = text.lower()

        positive_count = sum(1 for w in self.POSITIVE_KEYWORDS if w in text_lower)
        negative_count = sum(1 for w in self.NEGATIVE_KEYWORDS if w in text_lower)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        # 返回标准化分数
        return (positive_count - negative_count) / total

    def _calculate_news_impact(self, news_items: List[NewsItem]) -> float:
        """计算新闻影响评分

        Args:
            news_items: 新闻列表

        Returns:
            float: 新闻影响评分 (-1 to 1)
        """
        if not news_items:
            return 0.0

        total_weighted_sentiment = 0.0
        total_weight = 0.0

        for news in news_items:
            # 获取来源权重
            source_weight = self.SOURCE_WEIGHTS.get(news.source, 0.8)

            # 考虑时间衰减（越新的新闻权重越高）
            recency = 1.0  # 简化处理

            weighted_sentiment = news.sentiment * source_weight * recency
            total_weighted_sentiment += weighted_sentiment
            total_weight += abs(source_weight * recency)

        if total_weight == 0:
            return 0.0

        # 归一化到 -1 to 1
        impact = total_weighted_sentiment / total_weight
        return max(-1.0, min(1.0, impact))

    def _generate_description(
        self,
        news_items: List[NewsItem],
        positive_count: int,
        negative_count: int
    ) -> str:
        """生成新闻描述

        Args:
            news_items: 新闻列表
            positive_count: 正面新闻数
            negative_count: 负面新闻数

        Returns:
            str: 描述文本
        """
        if not news_items:
            return "暂无相关新闻"

        # 按情感排序获取最重要的新闻
        sorted_news = sorted(news_items, key=lambda n: abs(n.sentiment), reverse=True)
        top_news = sorted_news[0] if sorted_news else None

        parts = []
        if positive_count > 0:
            parts.append(f"{positive_count}条正面")
        if negative_count > 0:
            parts.append(f"{negative_count}条负面")

        if top_news and top_news.sentiment > 0.3:
            parts.append(f"热点: {top_news.title[:20]}...")
        elif top_news and top_news.sentiment < -0.3:
            parts.append(f"风险: {top_news.title[:20]}...")

        if not parts:
            return "新闻情绪中性"

        return "，".join(parts)

    def _default_result(self) -> Dict[str, Any]:
        """返回默认结果"""
        return {
            "news_impact": 0.0,
            "news_count": 0,
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": 0,
            "news_items": [],
            "description": "暂无新闻数据",
        }


# 全局实例
news_analyzer = NewsImpactAnalyzer()
