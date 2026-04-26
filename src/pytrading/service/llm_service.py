#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：LLM服务 - OpenAI兼容API的LLM集成
@Author  ：EEric
@Date    ：2026-04-26
"""
import os
import json
import asyncio
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from pytrading.logger import logger


class LLMService:
    """OpenAI兼容LLM服务"""

    def __init__(self):
        self.base_url = os.getenv("LLM_API_BASE_URL", "https://api.openai.com/v1")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.timeout = float(os.getenv("LLM_TIMEOUT", "30"))
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        """懒加载客户端"""
        if self._client is None:
            self._client = AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=self.timeout,
            )
        return self._client

    def format_prompt(self, symbol: str, analysis_data: Dict[str, Any]) -> str:
        """格式化投顾分析提示词

        Args:
            symbol: 股票代码
            analysis_data: 分析数据，包含technical_score, sentiment_score, event_signals, news_impact等

        Returns:
            str: 格式化后的提示词
        """
        recommendation = analysis_data.get("recommendation", "观望")
        confidence = analysis_data.get("confidence", 0)
        technical_score = analysis_data.get("technical_score", 0)
        sentiment_score = analysis_data.get("sentiment_score", 0)
        event_signals = analysis_data.get("event_signals", [])
        news_impact = analysis_data.get("news_impact", 0)
        risk_level = analysis_data.get("risk_level", "中")

        # 构建事件信号描述
        event_desc = ""
        if event_signals:
            for i, event in enumerate(event_signals[:5], 1):  # 最多5个事件
                event_type = event.get("event_type", "未知")
                description = event.get("description", "")
                severity = event.get("severity", 0)
                direction = "正面" if severity > 0 else "负面" if severity < 0 else "中性"
                event_desc += f"{i}. [{event_type}] {description} ({direction})\n"

        prompt = f"""你是一位专业的量化投资分析师。请基于以下数据为股票 {symbol} 提供投资建议：

## 评分数据
- 技术评分: {technical_score:.1f}/100 (0-100, 越高越好)
- 情绪评分: {sentiment_score:.2f}/1 (-1到1, 正值看涨)
- 新闻影响: {news_impact:.2f}/1 (-1到1, 正值正面)
- 风险等级: {risk_level}

## 事件信号
{event_desc if event_desc else "暂无重要事件"}

## 系统建议
- 推荐操作: {recommendation}
- 置信度: {confidence:.0%}

请用简洁专业的语言给出300字以内的投资见解，说明推荐理由和需要注意的风险点。
"""
        return prompt

    async def generate_insight(self, symbol: str, analysis_data: Dict[str, Any]) -> str:
        """生成AI投资见解

        Args:
            symbol: 股票代码
            analysis_data: 分析数据字典

        Returns:
            str: LLM生成的投资见解
        """
        import time
        start_time = time.time()
        try:
            logger.info(f"[LLM] {symbol} 开始生成投资见解...")
            logger.info(f"[LLM] {symbol} LLM配置: endpoint={self.base_url}, model={self.model}")

            prompt = self.format_prompt(symbol, analysis_data)
            logger.info(f"[LLM] {symbol} Prompt长度: {len(prompt)} 字符")

            logger.info(f"[LLM] {symbol} 正在调用LLM API...")
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一位专业的量化投资分析师，帮助用户分析股票并提供简洁专业的投资建议。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7,
            )

            insight = response.choices[0].message.content.strip()
            elapsed = time.time() - start_time
            logger.info(f"[LLM] {symbol} LLM响应成功, 耗时: {elapsed:.2f}秒, 见解长度: {len(insight)} 字符")
            logger.info(f"[LLM] {symbol} 见解内容预览: {insight[:100]}..." if len(insight) > 100 else f"[LLM] {symbol} 见解内容: {insight}")
            return insight

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[LLM] {symbol} LLM调用失败, 耗时: {elapsed:.2f}秒, error: {str(e)}")
            return f"基于系统分析，{symbol}建议{analysis_data.get('recommendation', '观望')}（置信度{analysis_data.get('confidence', 0):.0%}）。技术面评分{analysis_data.get('technical_score', 0):.1f}，情绪评分{analysis_data.get('sentiment_score', 0):.2f}。"

    def validate_response(self, response: str) -> bool:
        """验证LLM响应是否有效

        Args:
            response: LLM响应内容

        Returns:
            bool: 是否有效
        """
        if not response or len(response.strip()) < 10:
            return False
        return True


# 全局LLM服务实例
llm_service = LLMService()
