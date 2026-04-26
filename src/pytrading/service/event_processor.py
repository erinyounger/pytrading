#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：事件处理器 - 处理公司事件并计算事件评分
@Author  ：EEric
@Date    ：2026-04-26
"""
from typing import Dict, Any, List, Optional
from datetime import date, datetime, timedelta
from pytrading.logger import logger
from pytrading.utils.akshare_util import akshare_util
from pytrading.schemas.market_data import CompanyEvent


class EventProcessor:
    """事件处理器 - 处理公司事件并计算事件评分"""

    # 事件类型权重
    EVENT_WEIGHTS = {
        "dividend": 0.20,       # 分红
        "repurchase": 0.25,     # 回购
        "forecast": 0.30,       # 业绩预告
        "announcement": 0.15,   # 公告
        "lawsuit": -0.30,      # 诉讼 (负面)
    }

    # 事件严重程度阈值
    SEVERITY_THRESHOLDS = {
        "high_positive": 0.5,
        "medium_positive": 0.2,
        "medium_negative": -0.2,
        "high_negative": -0.5,
    }

    def __init__(self):
        self.akshare = akshare_util

    def process_events(self, symbol: str, days: int = 30) -> Dict[str, Any]:
        """处理公司事件

        Args:
            symbol: 股票代码
            days: 分析天数

        Returns:
            Dict: 包含 event_signals 和 event_score
        """
        try:
            logger.info(f"[事件分析] {symbol} 开始获取公司事件, 天数: {days}")

            # 获取事件数据
            raw_events = self.akshare.get_company_events(symbol, days)
            logger.info(f"[事件分析] {symbol} 获取到 {len(raw_events) if raw_events else 0} 条事件原始数据")

            if not raw_events:
                logger.info(f"[事件分析] {symbol} 暂无重要事件")
                return {
                    "event_score": 0.0,
                    "event_signals": [],
                    "event_count": 0,
                    "positive_count": 0,
                    "negative_count": 0,
                    "description": "暂无重要事件",
                }

            # 转换为 CompanyEvent 对象
            events = []
            for raw in raw_events:
                try:
                    event = CompanyEvent(
                        event_type=raw.get("event_type", "unknown"),
                        description=raw.get("description", ""),
                        date=raw.get("date"),
                        severity=raw.get("severity", 0.0),
                        amount=raw.get("amount"),
                    )
                    events.append(event)
                except Exception as e:
                    logger.warning(f"[事件分析] {symbol} 解析事件失败: {raw}, error: {e}")

            logger.info(f"[事件分析] {symbol} 成功解析 {len(events)} 个事件")

            # 计算事件评分
            event_score = self._calculate_event_score(events)
            logger.info(f"[事件分析] {symbol} 事件评分: {event_score:.3f}")

            # 统计正负面事件
            positive_count = len([e for e in events if e.severity > 0.2])
            negative_count = len([e for e in events if e.severity < -0.2])
            logger.info(f"[事件分析] {symbol} 正面事件: {positive_count}, 负面事件: {negative_count}")

            # 生成描述
            description = self._generate_description(events, positive_count, negative_count)
            logger.info(f"[事件分析] {symbol} 事件描述: {description}")

            return {
                "event_score": round(event_score, 3),
                "event_signals": events,
                "event_count": len(events),
                "positive_count": positive_count,
                "negative_count": negative_count,
                "description": description,
            }

        except Exception as e:
            logger.error(f"[事件分析] {symbol} 处理失败: {e}")
            return {
                "event_score": 0.0,
                "event_signals": [],
                "event_count": 0,
                "positive_count": 0,
                "negative_count": 0,
                "description": "数据获取失败",
            }

    def _calculate_event_score(self, events: List[CompanyEvent]) -> float:
        """计算事件评分

        Args:
            events: 事件列表

        Returns:
            float: 事件评分 (-1 to 1)
        """
        if not events:
            return 0.0

        total_weight = 0.0
        weighted_sum = 0.0

        for event in events:
            # 获取事件类型权重
            weight = self.EVENT_WEIGHTS.get(event.event_type, 0.15)

            # 计算加权分数
            weighted_sum += event.severity * weight
            total_weight += abs(weight)

        if total_weight == 0:
            return 0.0

        # 归一化到 -1 to 1
        score = weighted_sum / total_weight
        return max(-1.0, min(1.0, score))

    def _generate_description(
        self,
        events: List[CompanyEvent],
        positive_count: int,
        negative_count: int
    ) -> str:
        """生成事件描述

        Args:
            events: 事件列表
            positive_count: 正面事件数
            negative_count: 负面事件数

        Returns:
            str: 描述文本
        """
        if not events:
            return "暂无重要事件"

        parts = []

        if positive_count > 0:
            parts.append(f"{positive_count}项正面事件")
        if negative_count > 0:
            parts.append(f"{negative_count}项负面事件")

        if not parts:
            return "事件影响中性"

        # 添加最新事件的简要描述
        latest_events = sorted(events, key=lambda e: e.date or "", reverse=True)[:2]
        if latest_events:
            latest_desc = "，".join([e.description[:20] for e in latest_events if e.description])
            parts.append(f"最新: {latest_desc}")

        return "；".join(parts)

    def get_event_signals_summary(self, events: List[CompanyEvent]) -> List[Dict[str, Any]]:
        """获取事件信号摘要

        Args:
            events: 事件列表

        Returns:
            List[Dict]: 信号摘要列表
        """
        summary = []

        for event in events:
            # 根据严重程度判断信号方向
            if event.severity > self.SEVERITY_THRESHOLDS["high_positive"]:
                signal = "强正面"
            elif event.severity > self.SEVERITY_THRESHOLDS["medium_positive"]:
                signal = "正面"
            elif event.severity < self.SEVERITY_THRESHOLDS["high_negative"]:
                signal = "强负面"
            elif event.severity < self.SEVERITY_THRESHOLDS["medium_negative"]:
                signal = "负面"
            else:
                signal = "中性"

            summary.append({
                "event_type": event.event_type,
                "description": event.description,
                "date": event.date,
                "severity": event.severity,
                "signal": signal,
            })

        return summary


# 全局实例
event_processor = EventProcessor()
