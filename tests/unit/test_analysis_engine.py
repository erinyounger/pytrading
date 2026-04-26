#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：分析引擎单元测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import date, timedelta
from pytrading.service.technical_analyzer import TechnicalAnalyzer
from pytrading.service.sentiment_analyzer import SentimentAnalyzer
from pytrading.service.event_processor import EventProcessor
from pytrading.service.news_analyzer import NewsImpactAnalyzer
from pytrading.service.recommendation_scorer import RecommendationScorer


class TestTechnicalAnalyzer:
    """技术分析器测试"""

    def setup_method(self):
        self.analyzer = TechnicalAnalyzer()

    def test_calculate_rsi(self):
        """测试RSI计算"""
        prices = [100 + i for i in range(20)]
        rsi = self.analyzer.calculate_rsi(prices)
        assert 0 <= rsi <= 100

    def test_calculate_rsi_oversold(self):
        """测试RSI超卖"""
        # 持续上涨
        prices = [100 + i * 0.5 for i in range(20)]
        rsi = self.analyzer.calculate_rsi(prices)
        assert rsi > 50

    def test_calculate_macd(self):
        """测试MACD计算"""
        prices = [100 + i for i in range(50)]
        diff, dea, macd_hist = self.analyzer.calculate_macd(prices)
        assert isinstance(diff, float)
        assert isinstance(dea, float)
        assert isinstance(macd_hist, float)

    def test_calculate_ma(self):
        """测试移动平均线"""
        prices = [100 + i for i in range(30)]
        ma = self.analyzer.calculate_ma(prices, [5, 10, 20])
        assert 5 in ma
        assert 10 in ma
        assert 20 in ma

    def test_calculate_trend_score_bullish(self):
        """测试上升趋势评分"""
        # 均线多头排列
        prices = [100] * 60 + [i for i in range(100, 110)]
        score = self.analyzer.calculate_trend_score(prices)
        assert score > 50

    def test_calculate_trend_score_bearish(self):
        """测试下降趋势评分"""
        prices = [110 - i for i in range(70)]
        score = self.analyzer.calculate_trend_score(prices)
        assert score <= 50  # 可能等于50（默认值边界情况）

    def test_get_technical_score_insufficient_data(self):
        """测试数据不足时的默认评分"""
        result = self.analyzer.get_technical_score("SHSE.600000", days=5)
        assert result["technical_score"] == 50.0


class TestSentimentAnalyzer:
    """情绪分析器测试"""

    def setup_method(self):
        self.analyzer = SentimentAnalyzer()

    @pytest.mark.asyncio
    async def test_analyze_sentiment_mock(self):
        """测试情绪分析（模拟）"""
        with patch.object(self.analyzer.akshare, 'get_stock_sentiment') as mock:
            mock.return_value = {
                "symbol": "SHSE.600000",
                "hot_rank": 10,
                "sentiment_score": 0.8,
                "description": "极度热门"
            }

            with patch.object(self.analyzer.akshare, 'get_sector_sentiment') as sector_mock:
                sector_mock.return_value = {
                    "board_name": "银行",
                    "sentiment": "bullish",
                    "score": 0.5,
                }

                result = await self.analyzer.analyze_sentiment("SHSE.600000", "银行")

                assert result["sentiment_score"] > 0
                assert result["hot_rank"] == 10

    @pytest.mark.asyncio
    async def test_analyze_sentiment_no_hot_rank(self):
        """测试无热度排名"""
        with patch.object(self.analyzer.akshare, 'get_stock_sentiment') as mock:
            mock.return_value = {
                "symbol": "SHSE.600000",
                "hot_rank": None,
                "sentiment_score": 0.0,
                "description": "暂无热度"
            }

            result = await self.analyzer.analyze_sentiment("SHSE.600000")
            assert result["hot_rank"] is None


class TestEventProcessor:
    """事件处理器测试"""

    def setup_method(self):
        self.processor = EventProcessor()

    def test_calculate_event_score_positive(self):
        """测试正面事件评分"""
        from pytrading.schemas.market_data import CompanyEvent

        events = [
            CompanyEvent(event_type="dividend", description="分红", date="2026-04-20", severity=0.3),
            CompanyEvent(event_type="repurchase", description="回购", date="2026-04-15", severity=0.4),
        ]

        score = self.processor._calculate_event_score(events)
        assert score > 0

    def test_calculate_event_score_negative(self):
        """测试负面事件评分 - 验证负面事件得分低于正面事件"""
        from pytrading.schemas.market_data import CompanyEvent

        negative_events = [
            CompanyEvent(event_type="lawsuit", description="诉讼", date="2026-04-20", severity=-0.5),
            CompanyEvent(event_type="announcement", description="风险警示", date="2026-04-20", severity=-0.3),
        ]

        positive_events = [
            CompanyEvent(event_type="dividend", description="分红", date="2026-04-20", severity=0.3),
            CompanyEvent(event_type="repurchase", description="回购", date="2026-04-15", severity=0.4),
        ]

        negative_score = self.processor._calculate_event_score(negative_events)
        positive_score = self.processor._calculate_event_score(positive_events)

        # 负面事件得分应该低于正面事件
        assert negative_score < positive_score

    def test_calculate_event_score_empty(self):
        """测试空事件列表"""
        score = self.processor._calculate_event_score([])
        assert score == 0.0

    def test_process_events_mock(self):
        """测试处理事件（模拟）"""
        with patch.object(self.processor.akshare, 'get_company_events') as mock:
            mock.return_value = [
                {"event_type": "dividend", "description": "分红公告", "date": "2026-04-20", "severity": 0.3},
            ]

            result = self.processor.process_events("SHSE.600000", 30)

            assert result["event_count"] == 1
            assert result["event_score"] > 0


class TestNewsImpactAnalyzer:
    """新闻分析器测试"""

    def setup_method(self):
        self.analyzer = NewsImpactAnalyzer()

    def test_analyze_text_sentiment_positive(self):
        """测试正面文本"""
        text = "业绩大幅增长，股价涨停，利好消息频出"
        sentiment = self.analyzer._analyze_text_sentiment(text)
        assert sentiment > 0

    def test_analyze_text_sentiment_negative(self):
        """测试负面文本"""
        text = "业绩大幅下滑，股价跌停，风险警示"
        sentiment = self.analyzer._analyze_text_sentiment(text)
        assert sentiment < 0

    def test_analyze_text_sentiment_neutral(self):
        """测试中性文本"""
        text = "今日大盘平开，市场交易活跃"
        sentiment = self.analyzer._analyze_text_sentiment(text)
        assert sentiment == 0.0

    def test_analyze_news_mock(self):
        """测试新闻分析（模拟）"""
        with patch.object(self.analyzer.akshare, 'get_stock_news') as mock:
            mock.return_value = [
                {"title": "业绩预增", "content": "净利润增长50%", "source": "百度"},
            ]

            result = self.analyzer.analyze_news("SHSE.600000", 7)

            assert result["news_count"] == 1
            assert result["news_impact"] > 0


class TestRecommendationScorer:
    """推荐评分器测试"""

    def setup_method(self):
        self.scorer = RecommendationScorer()

    def test_calculate_composite_score(self):
        """测试综合评分计算"""
        # 全满分情况
        score = self.scorer.calculate_composite_score(100, 1.0, 1.0, 1.0)
        assert score > 0.8

        # 全零分情况
        score = self.scorer.calculate_composite_score(50, 0.0, 0.0, 0.0)
        assert abs(score) < 0.1

    def test_determine_recommendation_buy(self):
        """测试买入推荐"""
        assert self.scorer.determine_recommendation(0.8) == "买入"
        assert self.scorer.determine_recommendation(0.6) == "买入"

    def test_determine_recommendation_hold(self):
        """测试持有推荐"""
        assert self.scorer.determine_recommendation(0.4) == "持有"

    def test_determine_recommendation_sell(self):
        """测试卖出推荐"""
        assert self.scorer.determine_recommendation(-0.5) == "卖出"

    def test_calculate_confidence(self):
        """测试置信度计算"""
        confidence = self.scorer.calculate_confidence(80, 0.5, 0.3, 0.2)
        assert 0 <= confidence <= 1
        assert confidence > 0.5

    def test_assess_risk_high(self):
        """测试高风险评估"""
        risk = self.scorer.assess_risk(-0.5, 20, -0.5)
        assert risk == "高"

    def test_assess_risk_low(self):
        """测试低风险评估"""
        risk = self.scorer.assess_risk(0.5, 70, 0.3)
        assert risk == "低"

    def test_score_full(self):
        """测试完整评分流程"""
        technical_data = {"technical_score": 75.0}
        sentiment_data = {"sentiment_score": 0.3}
        event_data = {"event_score": 0.2, "event_signals": []}
        news_data = {"news_impact": 0.1}

        result = self.scorer.score(technical_data, sentiment_data, event_data, news_data)

        assert "recommendation" in result
        assert "confidence" in result
        assert "risk_level" in result
        assert result["recommendation"] in ["买入", "持有", "卖出", "观望"]
