#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：推荐评分器 - 综合评分生成推荐
@Author  ：EEric
@Date    ：2026-04-26
"""
from typing import Dict, Any
from pytrading.logger import logger


class RecommendationScorer:
    """推荐评分器 - 综合技术、情绪、事件、新闻评分生成推荐"""

    # 评分权重配置
    WEIGHTS = {
        "technical": 0.35,   # 技术评分权重
        "sentiment": 0.25,   # 情绪评分权重
        "event": 0.25,       # 事件评分权重
        "news": 0.15,       # 新闻评分权重
    }

    # 推荐阈值
    RECOMMENDATION_THRESHOLDS = {
        "强烈买入": 0.70,
        "买入": 0.50,
        "持有": 0.30,
        "观望": 0.10,
        "卖出": float('-inf'),  # 低于所有阈值
    }

    # 风险等级阈值
    RISK_THRESHOLDS = {
        "高": -0.30,   # 综合评分低于此值
        "中": -0.50,   # 综合评分低于此值
        "低": float('-inf'),  # 其他情况
    }

    def calculate_composite_score(
        self,
        technical_score: float,    # 0-100
        sentiment_score: float,    # -1 to 1
        event_score: float,        # -1 to 1
        news_impact: float,        # -1 to 1
    ) -> float:
        """计算综合评分

        Args:
            technical_score: 技术评分 (0-100)
            sentiment_score: 情绪评分 (-1 to 1)
            event_score: 事件评分 (-1 to 1)
            news_impact: 新闻影响 (-1 to 1)

        Returns:
            float: 综合评分 (-1 to 1)
        """
        try:
            # 归一化技术评分到 0-1
            technical_normalized = technical_score / 100.0

            # 加权求和
            composite = (
                technical_normalized * self.WEIGHTS["technical"] +
                (sentiment_score + 1) / 2 * self.WEIGHTS["sentiment"] +  # 转换到 0-1
                (event_score + 1) / 2 * self.WEIGHTS["event"] +
                (news_impact + 1) / 2 * self.WEIGHTS["news"]
            )

            # 转换回 -1 to 1
            composite = composite * 2 - 1

            return max(-1.0, min(1.0, composite))

        except Exception as e:
            logger.error(f"计算综合评分失败: {e}")
            return 0.0

    def determine_recommendation(self, composite_score: float) -> str:
        """根据综合评分确定推荐

        Args:
            composite_score: 综合评分 (-1 to 1)

        Returns:
            str: 推荐 (买入/持有/卖出/观望)
        """
        if composite_score >= self.RECOMMENDATION_THRESHOLDS["强烈买入"]:
            return "买入"  # 强烈买入也返回买入，前端可显示差异
        elif composite_score >= self.RECOMMENDATION_THRESHOLDS["买入"]:
            return "买入"
        elif composite_score >= self.RECOMMENDATION_THRESHOLDS["持有"]:
            return "持有"
        elif composite_score >= self.RECOMMENDATION_THRESHOLDS["观望"]:
            return "观望"
        else:
            return "卖出"

    def calculate_confidence(
        self,
        technical_score: float,
        sentiment_score: float,
        event_score: float,
        news_impact: float,
    ) -> float:
        """计算置信度

        置信度取决于各维度评分的一致性和数据完整性

        Args:
            technical_score: 技术评分
            sentiment_score: 情绪评分
            event_score: 事件评分
            news_impact: 新闻影响

        Returns:
            float: 置信度 (0-1)
        """
        try:
            # 计算各维度的一致性（标准差的反向）
            scores = [technical_score, (sentiment_score + 1) * 50, (event_score + 1) * 50, (news_impact + 1) * 50]
            std_dev = (sum((s - sum(scores) / len(scores)) ** 2 for s in scores) / len(scores)) ** 0.5

            # 标准差越小，一致性越高，置信度越高
            consistency = max(0, 1 - std_dev / 50)

            # 基础置信度
            confidence = 0.5 + consistency * 0.3

            # 数据完整性加成
            data_completeness = 0.0
            if technical_score != 50.0:  # 非默认
                data_completeness += 0.05
            if sentiment_score != 0.0:
                data_completeness += 0.05
            if event_score != 0.0:
                data_completeness += 0.05
            if news_impact != 0.0:
                data_completeness += 0.05

            confidence += data_completeness

            return max(0.3, min(0.95, confidence))

        except Exception as e:
            logger.error(f"计算置信度失败: {e}")
            return 0.5

    def assess_risk(
        self,
        composite_score: float,
        technical_score: float,
        event_score: float,
    ) -> str:
        """评估风险等级

        Args:
            composite_score: 综合评分
            technical_score: 技术评分
            event_score: 事件评分

        Returns:
            str: 风险等级 (高/中/低)
        """
        try:
            risk_score = 0.0

            # 综合评分越低风险越高
            if composite_score < -0.3:
                risk_score += 0.4
            elif composite_score < 0.0:
                risk_score += 0.2

            # 技术面弱增加风险
            if technical_score < 30:
                risk_score += 0.2
            elif technical_score < 40:
                risk_score += 0.1

            # 负面事件增加风险
            if event_score < -0.3:
                risk_score += 0.2
            elif event_score < 0.0:
                risk_score += 0.1

            # 确定风险等级
            if risk_score >= 0.5:
                return "高"
            elif risk_score >= 0.2:
                return "中"
            else:
                return "低"

        except Exception as e:
            logger.error(f"评估风险失败: {e}")
            return "中"

    def score(
        self,
        technical_data: Dict[str, Any],
        sentiment_data: Dict[str, Any],
        event_data: Dict[str, Any],
        news_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """综合评分生成推荐

        Args:
            technical_data: 技术分析数据
            sentiment_data: 情绪分析数据
            event_data: 事件处理数据
            news_data: 新闻分析数据

        Returns:
            Dict: 包含 recommendation, confidence, risk_level, composite_score
        """
        try:
            # 提取评分
            technical_score = technical_data.get("technical_score", 50.0)
            sentiment_score = sentiment_data.get("sentiment_score", 0.0)
            event_score = event_data.get("event_score", 0.0)
            news_impact = news_data.get("news_impact", 0.0)

            # 计算综合评分
            composite_score = self.calculate_composite_score(
                technical_score, sentiment_score, event_score, news_impact
            )

            # 确定推荐
            recommendation = self.determine_recommendation(composite_score)

            # 计算置信度
            confidence = self.calculate_confidence(
                technical_score, sentiment_score, event_score, news_impact
            )

            # 评估风险
            risk_level = self.assess_risk(composite_score, technical_score, event_score)

            return {
                "recommendation": recommendation,
                "confidence": round(confidence, 3),
                "risk_level": risk_level,
                "composite_score": round(composite_score, 3),
                "technical_score": technical_score,
                "sentiment_score": sentiment_score,
                "event_score": event_score,
                "news_impact": news_impact,
                "weights": self.WEIGHTS,
            }

        except Exception as e:
            logger.error(f"综合评分失败: {e}")
            return {
                "recommendation": "观望",
                "confidence": 0.0,
                "risk_level": "中",
                "composite_score": 0.0,
                "technical_score": 50.0,
                "sentiment_score": 0.0,
                "event_score": 0.0,
                "news_impact": 0.0,
                "error": str(e),
            }


# 全局实例
recommendation_scorer = RecommendationScorer()
