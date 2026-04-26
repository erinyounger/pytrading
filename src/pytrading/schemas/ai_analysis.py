#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AI股票分析相关的Pydantic schemas
@Author  ：EEric
@Date    ：2026-04-26
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime


class EventSignal(BaseModel):
    """事件信号"""
    event_type: str = Field(..., description="事件类型: dividend/repurchase/forecast/announcement")
    description: str = Field(..., description="事件描述")
    severity: float = Field(..., ge=-1, le=1, description="严重程度/影响: -1(负面) to 1(正面)")
    date: Optional[str] = Field(None, description="事件日期")


class AIAnalysisRequest(BaseModel):
    """AI分析请求"""
    symbol: str = Field(..., description="股票代码")
    start_date: Optional[str] = Field(None, description="分析开始日期 (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="分析结束日期 (YYYY-MM-DD)")


class AIAnalysisResponse(BaseModel):
    """AI分析响应"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    symbol: str
    recommendation: str  # 买入/持有/卖出/观望
    confidence: float  # 0-1
    sentiment_score: float  # -1 to 1
    technical_score: float  # 0-100
    event_signals: List[EventSignal]
    news_impact: float  # -1 to 1
    risk_level: str  # 高/中/低
    analysis_date: str
    created_at: str
    llm_insight: Optional[str] = None


class BatchAnalysisRequest(BaseModel):
    """批量分析请求"""
    symbols: List[str] = Field(..., description="股票代码列表", min_length=1, max_length=100)
    start_date: Optional[str] = Field(None, description="分析开始日期 (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="分析结束日期 (YYYY-MM-DD)")


class BatchAnalysisResponse(BaseModel):
    """批量分析响应"""
    task_id: str
    status: str
    total_count: int
    message: str


class AnalysisStatusResponse(BaseModel):
    """分析状态响应"""
    task_id: str
    status: str  # pending/running/completed/failed
    progress: int  # 0-100
    completed_count: int
    total_count: int
    error_message: Optional[str] = None


class MarketSentimentResponse(BaseModel):
    """市场情绪响应"""
    sentiment: str  # bullish/bearish/neutral
    score: float  # -1 to 1
    description: str
    sector_sentiments: Optional[List[dict]] = None


class CompanyEventsResponse(BaseModel):
    """公司事件响应"""
    symbol: str
    events: List[EventSignal]
    total_count: int
