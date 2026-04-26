#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：LLM服务单元测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
import os
from unittest.mock import AsyncMock, patch, MagicMock
from pytrading.service.llm_service import LLMService


class TestLLMService:
    """LLM服务测试类"""

    def setup_method(self):
        """测试前准备"""
        self.llm_service = LLMService()
        # 设置测试用环境变量
        os.environ["LLM_API_BASE_URL"] = "https://api.test.com/v1"
        os.environ["LLM_API_KEY"] = "test_key"
        os.environ["LLM_MODEL"] = "test-model"

    def test_format_prompt(self):
        """测试提示词格式化"""
        analysis_data = {
            "recommendation": "买入",
            "confidence": 0.85,
            "technical_score": 75.5,
            "sentiment_score": 0.3,
            "event_signals": [
                {"event_type": "dividend", "description": "分红公告", "severity": 0.5}
            ],
            "news_impact": 0.2,
            "risk_level": "中"
        }

        prompt = self.llm_service.format_prompt("SHSE.600000", analysis_data)

        assert "SHSE.600000" in prompt
        assert "买入" in prompt
        assert "75.5" in prompt or "75" in prompt
        assert "中" in prompt
        assert "分红公告" in prompt

    def test_format_prompt_no_events(self):
        """测试无事件时的提示词格式化"""
        analysis_data = {
            "recommendation": "持有",
            "confidence": 0.6,
            "technical_score": 50.0,
            "sentiment_score": 0.0,
            "event_signals": [],
            "news_impact": 0.0,
            "risk_level": "低"
        }

        prompt = self.llm_service.format_prompt("SZSE.000001", analysis_data)

        assert "SZSE.000001" in prompt
        assert "持有" in prompt
        assert "暂无重要事件" in prompt

    def test_validate_response_valid(self):
        """测试有效响应验证"""
        valid_response = "这是一条有效的投资建议，包含足够的文字内容。"
        assert self.llm_service.validate_response(valid_response) is True

    def test_validate_response_empty(self):
        """测试空响应验证"""
        assert self.llm_service.validate_response("") is False
        assert self.llm_service.validate_response("   ") is False
        assert self.llm_service.validate_response("abc") is False

    def test_validate_response_none(self):
        """测试None响应验证"""
        assert self.llm_service.validate_response(None) is False

    @pytest.mark.asyncio
    async def test_generate_insight_mock(self):
        """测试生成投顾见解（模拟）"""
        analysis_data = {
            "recommendation": "买入",
            "confidence": 0.8,
            "technical_score": 72.0,
            "sentiment_score": 0.25,
            "event_signals": [],
            "news_impact": 0.1,
            "risk_level": "中"
        }

        # Mock OpenAI响应
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "建议关注该股票，风险中等。"

        # 创建模拟客户端
        mock_client_instance = AsyncMock()
        mock_client_instance.chat.completions.create = AsyncMock(return_value=mock_response)

        original_client = self.llm_service._client
        self.llm_service._client = mock_client_instance

        try:
            result = await self.llm_service.generate_insight("SHSE.600000", analysis_data)

            assert len(result) > 0
            assert isinstance(result, str)
        finally:
            self.llm_service._client = original_client

    @pytest.mark.asyncio
    async def test_generate_insight_error_fallback(self):
        """测试生成投顾见解失败时的降级处理"""
        analysis_data = {
            "recommendation": "观望",
            "confidence": 0.5,
            "technical_score": 45.0,
            "sentiment_score": -0.1,
            "event_signals": [],
            "news_impact": 0.0,
            "risk_level": "高"
        }

        # 创建会抛出异常的模拟客户端
        mock_client_instance = AsyncMock()
        mock_client_instance.chat.completions.create = AsyncMock(side_effect=Exception("API Error"))

        original_client = self.llm_service._client
        self.llm_service._client = mock_client_instance

        try:
            result = await self.llm_service.generate_insight("SHSE.600036", analysis_data)

            # 应该返回降级响应
            assert "观望" in result
            assert "45" in result
        finally:
            self.llm_service._client = original_client

    def test_llm_service_initialization(self):
        """测试LLM服务初始化"""
        service = LLMService()

        assert service.base_url == "https://api.test.com/v1"
        assert service.api_key == "test_key"
        assert service.model == "test-model"
        assert service.timeout == 30
