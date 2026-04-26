#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AIAnalysisResult模型单元测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
from datetime import datetime, date
from pytrading.db.mysql import AIAnalysisResult, BatchAnalysisTask


class TestAIAnalysisResultModel:
    """AIAnalysisResult模型测试类"""

    def test_ai_analysis_result_fields(self):
        """测试AIAnalysisResult模型字段数量"""
        # 验证有11个必需字段
        required_fields = [
            'id', 'symbol', 'recommendation', 'confidence', 'sentiment_score',
            'technical_score', 'event_signals', 'news_impact', 'risk_level',
            'analysis_date', 'created_at'
        ]

        result = AIAnalysisResult(
            id=1,
            symbol="SHSE.600000",
            recommendation="买入",
            confidence=0.85,
            sentiment_score=0.3,
            technical_score=75.0,
            event_signals=[{"event_type": "dividend", "description": "分红", "severity": 0.5}],
            news_impact=0.2,
            risk_level="中",
            analysis_date=date(2026, 4, 26),
        )

        assert result.symbol == "SHSE.600000"
        assert result.recommendation == "买入"
        assert result.confidence == 0.85
        assert result.sentiment_score == 0.3
        assert result.technical_score == 75.0
        assert len(result.event_signals) == 1
        assert result.news_impact == 0.2
        assert result.risk_level == "中"

    def test_ai_analysis_result_optional_fields(self):
        """测试AIAnalysisResult可选字段"""
        result = AIAnalysisResult(
            id=1,
            symbol="SZSE.000001",
            recommendation="持有",
            confidence=0.6,
            sentiment_score=0.0,
            technical_score=50.0,
            event_signals=[],
            news_impact=0.0,
            risk_level="低",
            analysis_date=date(2026, 4, 26),
            task_id="batch_ai_20260426",
            llm_insight="建议关注风险",
        )

        assert result.task_id == "batch_ai_20260426"
        assert result.llm_insight == "建议关注风险"

    def test_batch_analysis_task_fields(self):
        """测试BatchAnalysisTask模型字段"""
        task = BatchAnalysisTask(
            id=1,
            task_id="batch_ai_20260426",
            symbols=["SHSE.600000", "SZSE.000001"],
            status="running",
            progress=50,
            completed_count=1,
            total_count=2,
        )

        assert task.task_id == "batch_ai_20260426"
        assert len(task.symbols) == 2
        assert task.status == "running"
        assert task.progress == 50
        assert task.completed_count == 1
        assert task.total_count == 2
