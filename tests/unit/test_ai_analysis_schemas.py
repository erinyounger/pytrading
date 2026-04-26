#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AI分析Pydantic schemas验证测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
from pydantic import ValidationError
from pytrading.schemas.ai_analysis import (
    EventSignal,
    AIAnalysisRequest,
    AIAnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    AnalysisStatusResponse,
    MarketSentimentResponse,
    CompanyEventsResponse,
)


class TestEventSignal:
    """EventSignal测试类"""

    def test_valid_event_signal(self):
        """测试有效的事件信号"""
        signal = EventSignal(
            event_type="dividend",
            description="分红公告",
            severity=0.5,
            date="2026-04-20"
        )
        assert signal.event_type == "dividend"
        assert signal.severity == 0.5

    def test_negative_severity(self):
        """测试负面事件"""
        signal = EventSignal(
            event_type="lawsuit",
            description="诉讼公告",
            severity=-0.8,
        )
        assert signal.severity == -0.8

    def test_invalid_severity_too_high(self):
        """测试超出范围的情绪值"""
        with pytest.raises(ValidationError):
            EventSignal(
                event_type="announcement",
                description="公告",
                severity=1.5,  # 超出 -1 to 1 范围
            )

    def test_invalid_severity_too_low(self):
        """测试超出范围的负面情绪值"""
        with pytest.raises(ValidationError):
            EventSignal(
                event_type="announcement",
                description="公告",
                severity=-1.5,  # 超出 -1 to 1 范围
            )


class TestAIAnalysisRequest:
    """AIAnalysisRequest测试类"""

    def test_valid_request(self):
        """测试有效的分析请求"""
        request = AIAnalysisRequest(symbol="SHSE.600000")
        assert request.symbol == "SHSE.600000"

    def test_request_with_dates(self):
        """测试带日期范围的请求"""
        request = AIAnalysisRequest(
            symbol="SZSE.000001",
            start_date="2026-01-01",
            end_date="2026-04-26"
        )
        assert request.start_date == "2026-01-01"
        assert request.end_date == "2026-04-26"

    def test_missing_symbol(self):
        """测试缺少股票代码"""
        with pytest.raises(ValidationError):
            AIAnalysisRequest()


class TestBatchAnalysisRequest:
    """BatchAnalysisRequest测试类"""

    def test_valid_batch_request(self):
        """测试有效的批量分析请求"""
        request = BatchAnalysisRequest(
            symbols=["SHSE.600000", "SHSE.600036", "SZSE.000001"]
        )
        assert len(request.symbols) == 3

    def test_empty_symbols(self):
        """测试空股票列表"""
        with pytest.raises(ValidationError):
            BatchAnalysisRequest(symbols=[])

    def test_too_many_symbols(self):
        """测试超过最大数量的股票"""
        with pytest.raises(ValidationError):
            BatchAnalysisRequest(symbols=[f"Symbol{i}" for i in range(101)])


class TestAnalysisStatusResponse:
    """AnalysisStatusResponse测试类"""

    def test_valid_status_response(self):
        """测试有效的状态响应"""
        response = AnalysisStatusResponse(
            task_id="batch_ai_20260426",
            status="running",
            progress=50,
            completed_count=5,
            total_count=10,
        )
        assert response.status == "running"
        assert response.progress == 50

    def test_completed_status(self):
        """测试完成状态"""
        response = AnalysisStatusResponse(
            task_id="batch_ai_20260426",
            status="completed",
            progress=100,
            completed_count=10,
            total_count=10,
        )
        assert response.status == "completed"

    def test_failed_status_with_error(self):
        """测试失败状态带错误信息"""
        response = AnalysisStatusResponse(
            task_id="batch_ai_20260426",
            status="failed",
            progress=30,
            completed_count=3,
            total_count=10,
            error_message="API调用超时"
        )
        assert response.error_message == "API调用超时"


class TestMarketSentimentResponse:
    """MarketSentimentResponse测试类"""

    def test_valid_sentiment(self):
        """测试有效情绪响应"""
        response = MarketSentimentResponse(
            sentiment="bullish",
            score=0.6,
            description="市场情绪偏暖",
        )
        assert response.sentiment == "bullish"
        assert response.score == 0.6

    def test_sector_sentiments(self):
        """测试板块情绪"""
        response = MarketSentimentResponse(
            sentiment="neutral",
            score=0.0,
            description="市场平稳",
            sector_sentiments=[
                {"sector": "银行", "sentiment": "bullish", "score": 0.3},
                {"sector": "地产", "sentiment": "bearish", "score": -0.2},
            ]
        )
        assert len(response.sector_sentiments) == 2


class TestCompanyEventsResponse:
    """CompanyEventsResponse测试类"""

    def test_valid_events_response(self):
        """测试有效事件响应"""
        response = CompanyEventsResponse(
            symbol="SHSE.600000",
            events=[
                EventSignal(
                    event_type="dividend",
                    description="年报分红",
                    severity=0.5,
                ),
            ],
            total_count=1,
        )
        assert response.symbol == "SHSE.600000"
        assert response.total_count == 1
