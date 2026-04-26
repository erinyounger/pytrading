#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：数据收集服务 - 统一接口收集市场数据
@Author  ：EEric
@Date    ：2026-04-26
"""
import asyncio
from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from pytrading.logger import logger
from pytrading.utils.akshare_util import akshare_util
from pytrading.schemas.market_data import (
    SentimentData,
    CompanyEvent,
    NewsItem,
    SectorData,
    MarketSentimentData,
)


class DataCollectorService:
    """数据收集服务 - 统一收集多源市场数据"""

    def __init__(self):
        self.akshare = akshare_util

    @staticmethod
    def _retry_with_backoff(func, max_retries: int = 3, initial_delay: float = 0.5):
        """带指数退避的重试装饰器

        Args:
            func: 要重试的函数
            max_retries: 最大重试次数
            initial_delay: 初始延迟秒数

        Returns:
            函数结果或None
        """
        async def async_wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.warning(f"重试次数用尽: {func.__name__}, error: {e}")
                        return None
                    await asyncio.sleep(delay)
                    delay *= 2

        def sync_wrapper(*args, **kwargs):
            delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        logger.warning(f"重试次数用尽: {func.__name__}, error: {e}")
                        return None
                    import time
                    time.sleep(delay)
                    delay *= 2

        # 根据原函数是否为async返回对应wrapper
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    async def collect_sentiment(self, symbol: str) -> SentimentData:
        """收集股票情绪数据

        Args:
            symbol: 股票代码

        Returns:
            SentimentData: 情绪数据
        """
        try:
            data = self.akshare.get_stock_sentiment(symbol)

            return SentimentData(
                symbol=symbol,
                hot_rank=data.get("hot_rank"),
                sentiment_score=data.get("sentiment_score", 0.0),
                hsgt_flow=data.get("hsgt_flow"),
                description=data.get("description", ""),
            )
        except Exception as e:
            logger.error(f"收集情绪数据失败: {symbol}, error: {e}")
            return SentimentData(
                symbol=symbol,
                sentiment_score=0.0,
                description="数据收集失败",
            )

    async def collect_events(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[CompanyEvent]:
        """收集公司事件

        Args:
            symbol: 股票代码
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            List[CompanyEvent]: 事件列表
        """
        try:
            days = 30
            if start_date and end_date:
                days = (end_date - start_date).days

            raw_events = self.akshare.get_company_events(symbol, days)

            events = []
            for raw in raw_events:
                try:
                    events.append(CompanyEvent(
                        event_type=raw.get("event_type", "unknown"),
                        description=raw.get("description", ""),
                        date=raw.get("date"),
                        severity=raw.get("severity", 0.0),
                        amount=raw.get("amount"),
                    ))
                except Exception as ex:
                    logger.warning(f"解析事件数据失败: {raw}, error: {ex}")

            return events
        except Exception as e:
            logger.error(f"收集公司事件失败: {symbol}, error: {e}")
            return []

    async def collect_news(
        self,
        symbol: str,
        days: int = 7,
    ) -> List[NewsItem]:
        """收集股票新闻

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[NewsItem]: 新闻列表
        """
        try:
            raw_news = self.akshare.get_stock_news(symbol, days)

            news_items = []
            for raw in raw_news:
                try:
                    # 简单情感分析
                    sentiment = self._analyze_news_sentiment(raw.get("title", "") + raw.get("content", ""))

                    news_items.append(NewsItem(
                        title=raw.get("title", ""),
                        content=raw.get("content"),
                        url=raw.get("url"),
                        publish_date=raw.get("publish_date"),
                        sentiment=sentiment,
                        source=raw.get("source", "unknown"),
                    ))
                except Exception as ex:
                    logger.warning(f"解析新闻数据失败: {raw}, error: {ex}")

            return news_items
        except Exception as e:
            logger.error(f"收集新闻失败: {symbol}, error: {e}")
            return []

    async def collect_sector_info(self, board_name: str) -> Optional[SectorData]:
        """收集板块信息

        Args:
            board_name: 板块名称

        Returns:
            Optional[SectorData]: 板块数据
        """
        try:
            data = self.akshare.get_sector_sentiment(board_name)

            if not data:
                return None

            return SectorData(
                board_code=data.get("board_code", ""),
                board_name=board_name,
                sentiment=data.get("sentiment", "neutral"),
                score=data.get("score", 0.0),
                change_pct=data.get("change_pct"),
            )
        except Exception as e:
            logger.error(f"收集板块信息失败: {board_name}, error: {e}")
            return None

    def _analyze_news_sentiment(self, text: str) -> float:
        """简单新闻情感分析

        基于关键词的情感判断

        Args:
            text: 文本内容

        Returns:
            float: 情感分数 -1 to 1
        """
        if not text:
            return 0.0

        text_lower = text.lower()

        # 正面关键词
        positive_words = ["涨", "上涨", "盈利", "增长", "突破", "创新", "利好", "分红", "回购", "业绩预增"]
        # 负面关键词
        negative_words = ["跌", "下跌", "亏损", "下降", "风险", "警示", "减持", "业绩预减", "诉讼"]

        positive_count = sum(1 for w in positive_words if w in text_lower)
        negative_count = sum(1 for w in negative_words if w in text_lower)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        return (positive_count - negative_count) / total

    async def collect_market_sentiment(self) -> MarketSentimentData:
        """收集市场整体情绪

        Returns:
            MarketSentimentData: 市场情绪数据
        """
        try:
            # 获取市场整体行情
            import akshare as ak
            spot = ak.stock_zh_a_spot_em()

            if spot is None or spot.empty:
                return MarketSentimentData(
                    sentiment="neutral",
                    score=0.0,
                    description="数据获取失败",
                    timestamp=datetime.now().isoformat(),
                )

            # 计算涨跌家数
            up_count = len(spot[spot['涨跌幅'] > 0])
            down_count = len(spot[spot['涨跌幅'] < 0])
            flat_count = len(spot[spot['涨跌幅'] == 0])
            total = len(spot)

            # 计算上涨比例
            up_ratio = up_count / total if total > 0 else 0.5

            # 判断情绪
            if up_ratio > 0.6:
                sentiment = "bullish"
                score = min((up_ratio - 0.5) * 2, 1.0)
                description = f"市场强势，上涨家数占比{up_ratio:.1%}"
            elif up_ratio < 0.4:
                sentiment = "bearish"
                score = max((up_ratio - 0.5) * 2, -1.0)
                description = f"市场弱势，上涨家数占比{up_ratio:.1%}"
            else:
                sentiment = "neutral"
                score = 0.0
                description = f"市场平稳，上涨家数占比{up_ratio:.1%}"

            return MarketSentimentData(
                sentiment=sentiment,
                score=score,
                description=description,
                timestamp=datetime.now().isoformat(),
            )
        except Exception as e:
            logger.error(f"收集市场情绪失败: {e}")
            return MarketSentimentData(
                sentiment="neutral",
                score=0.0,
                description=f"数据获取失败: {str(e)}",
                timestamp=datetime.now().isoformat(),
            )

    async def collect_all(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """收集全部数据

        Args:
            symbol: 股票代码
            start_date: 开始日期
            end_date: 结束日期

        Returns:
            Dict: 包含 sentiment, events, news 的字典
        """
        # 并行收集数据
        sentiment, events, news = await asyncio.gather(
            self.collect_sentiment(symbol),
            self.collect_events(symbol, start_date, end_date),
            self.collect_news(symbol, 7),
        )

        return {
            "sentiment": sentiment,
            "events": events,
            "news": news,
        }


# 全局实例
data_collector_service = DataCollectorService()
