#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：数据收集服务单元测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import date, timedelta
from pytrading.service.data_collector import DataCollectorService
from pytrading.schemas.market_data import SentimentData, CompanyEvent, NewsItem


class TestDataCollectorService:
    """数据收集服务测试类"""

    def setup_method(self):
        """测试前准备"""
        self.service = DataCollectorService()

    def test_analyze_news_sentiment_positive(self):
        """测试正面新闻情感分析"""
        text = "该公司业绩预增，股价突破新高，利好消息频出"
        score = self.service._analyze_news_sentiment(text)
        assert score > 0

    def test_analyze_news_sentiment_negative(self):
        """测试负面新闻情感分析"""
        text = "公司发布风险警示，股价下跌，业绩预减"
        score = self.service._analyze_news_sentiment(text)
        assert score < 0

    def test_analyze_news_sentiment_neutral(self):
        """测试中性新闻情感分析"""
        text = "今日大盘平开，市场交易活跃"
        score = self.service._analyze_news_sentiment(text)
        assert score == 0

    def test_analyze_news_sentiment_empty(self):
        """测试空文本"""
        score = self.service._analyze_news_sentiment("")
        assert score == 0.0

    @pytest.mark.asyncio
    async def test_collect_sentiment(self):
        """测试收集情绪数据"""
        with patch.object(self.service.akshare, 'get_stock_sentiment') as mock:
            mock.return_value = {
                "symbol": "SHSE.600000",
                "hot_rank": 25,
                "sentiment_score": 0.5,
                "hsgt_flow": 1000.0,
                "description": "热门"
            }

            result = await self.service.collect_sentiment("SHSE.600000")

            assert isinstance(result, SentimentData)
            assert result.symbol == "SHSE.600000"
            assert result.hot_rank == 25
            assert result.sentiment_score == 0.5

    @pytest.mark.asyncio
    async def test_collect_sentiment_error(self):
        """测试收集情绪数据失败"""
        with patch.object(self.service.akshare, 'get_stock_sentiment', side_effect=Exception("API Error")):
            result = await self.service.collect_sentiment("SHSE.600000")

            assert isinstance(result, SentimentData)
            assert result.symbol == "SHSE.600000"
            assert result.sentiment_score == 0.0

    @pytest.mark.asyncio
    async def test_collect_events(self):
        """测试收集公司事件"""
        mock_events = [
            {"event_type": "dividend", "description": "分红公告", "date": "2026-04-20", "severity": 0.3},
            {"event_type": "announcement", "description": "业绩预告", "date": "2026-04-15", "severity": 0.5},
        ]

        with patch.object(self.service.akshare, 'get_company_events', return_value=mock_events):
            result = await self.service.collect_events("SHSE.600000")

            assert len(result) == 2
            assert all(isinstance(e, CompanyEvent) for e in result)
            assert result[0].event_type == "dividend"
            assert result[0].severity == 0.3

    @pytest.mark.asyncio
    async def test_collect_events_with_date_range(self):
        """测试带日期范围的事件收集"""
        with patch.object(self.service.akshare, 'get_company_events') as mock:
            mock.return_value = []
            start = date(2026, 4, 1)
            end = date(2026, 4, 26)

            await self.service.collect_events("SHSE.600000", start, end)

            mock.assert_called_once_with("SHSE.600000", 25)  #天数

    @pytest.mark.asyncio
    async def test_collect_news(self):
        """测试收集新闻"""
        mock_news = [
            {
                "title": "公司业绩预增",
                "content": "预计净利润增长50%",
                "url": "http://example.com/news",
                "publish_date": "2026-04-25",
                "source": "百度",
            }
        ]

        with patch.object(self.service.akshare, 'get_stock_news', return_value=mock_news):
            result = await self.service.collect_news("SHSE.600000", 7)

            assert len(result) == 1
            assert isinstance(result[0], NewsItem)
            assert result[0].title == "公司业绩预增"
            assert result[0].sentiment > 0  # 因为包含"增长"

    @pytest.mark.asyncio
    async def test_collect_sector_info(self):
        """测试收集板块信息"""
        mock_data = {
            "board_code": "BK0001",
            "board_name": "银行",
            "change_pct": 2.5,
            "sentiment": "bullish",
            "score": 0.5,
        }

        with patch.object(self.service.akshare, 'get_sector_sentiment', return_value=mock_data):
            result = await self.service.collect_sector_info("银行")

            assert result is not None
            assert result.board_name == "银行"
            assert result.sentiment == "bullish"

    @pytest.mark.asyncio
    async def test_collect_sector_info_not_found(self):
        """测试收集不存在的板块"""
        with patch.object(self.service.akshare, 'get_sector_sentiment', return_value=None):
            result = await self.service.collect_sector_info("不存在的板块")

            assert result is None

    @pytest.mark.asyncio
    async def test_collect_all(self):
        """测试收集全部数据"""
        with patch.object(self.service.akshare, 'get_stock_sentiment', return_value={
            "symbol": "SHSE.600000",
            "hot_rank": 10,
            "sentiment_score": 0.8,
            "description": "热门"
        }):
            with patch.object(self.service.akshare, 'get_company_events', return_value=[]):
                with patch.object(self.service.akshare, 'get_stock_news', return_value=[]):
                    result = await self.service.collect_all("SHSE.600000")

                    assert "sentiment" in result
                    assert "events" in result
                    assert "news" in result
                    assert isinstance(result["sentiment"], SentimentData)
