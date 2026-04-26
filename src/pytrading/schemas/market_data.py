#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：市场数据相关的Pydantic schemas
@Author  ：EEric
@Date    ：2026-04-26
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date, datetime


class SentimentData(BaseModel):
    """市场情绪数据"""
    model_config = ConfigDict(from_attributes=True)

    symbol: str = Field(..., description="股票代码")
    hot_rank: Optional[int] = Field(None, description="热度排名")
    sentiment_score: float = Field(..., ge=-1, le=1, description="情绪评分 -1 to 1")
    hsgt_flow: Optional[float] = Field(None, description="沪深港通资金流向 (万元)")
    description: str = Field("", description="情绪描述")


class CompanyEvent(BaseModel):
    """公司事件"""
    model_config = ConfigDict(from_attributes=True)

    event_type: str = Field(..., description="事件类型: dividend/repurchase/forecast/announcement/lawsuit")
    description: str = Field(..., description="事件描述")
    date: Optional[str] = Field(None, description="事件日期")
    severity: float = Field(..., ge=-1, le=1, description="影响程度 -1(负面) to 1(正面)")
    amount: Optional[float] = Field(None, description="涉及金额 (万元)")


class NewsItem(BaseModel):
    """新闻条目"""
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., description="新闻标题")
    content: Optional[str] = Field(None, description="新闻内容摘要")
    url: Optional[str] = Field(None, description="新闻链接")
    publish_date: Optional[str] = Field(None, description="发布日期")
    sentiment: float = Field(..., ge=-1, le=1, description="情感评分 -1 to 1")
    source: str = Field("unknown", description="新闻来源")


class SectorData(BaseModel):
    """板块数据"""
    model_config = ConfigDict(from_attributes=True)

    board_code: str = Field(..., description="板块代码")
    board_name: str = Field(..., description="板块名称")
    sentiment: str = Field(..., description="情绪状态: bullish/bearish/neutral")
    score: float = Field(..., ge=-1, le=1, description="情绪评分 -1 to 1")
    change_pct: Optional[float] = Field(None, description="涨跌幅 (%)")
    turnover_rate: Optional[float] = Field(None, description="换手率 (%)")


class MarketSentimentData(BaseModel):
    """市场整体情绪"""
    model_config = ConfigDict(from_attributes=True)

    sentiment: str = Field(..., description="情绪状态: bullish/bearish/neutral")
    score: float = Field(..., ge=-1, le=1, description="情绪评分 -1 to 1")
    description: str = Field(..., description="描述")
    timestamp: str = Field(..., description="时间戳")
    sector_sentiments: Optional[List[SectorData]] = Field(None, description="各板块情绪")


class IndustryData(BaseModel):
    """行业数据"""
    model_config = ConfigDict(from_attributes=True)

    industry_code: str = Field(..., description="行业代码")
    industry_name: str = Field(..., description="行业名称")
    sentiment: str = Field(..., description="情绪状态")
    score: float = Field(..., ge=-1, le=1, description="情绪评分")
    avg_change_pct: Optional[float] = Field(None, description="平均涨跌幅")


class ConceptSpotData(BaseModel):
    """概念板块行情"""
    model_config = ConfigDict(from_attributes=True)

    concept_code: str = Field(..., description="概念代码")
    concept_name: str = Field(..., description="概念名称")
    change_pct: float = Field(..., description="涨跌幅 (%)")
    lead_stock: Optional[str] = Field(None, description="龙头股")
    sentiment: str = Field(..., description="情绪状态")
