#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：数据模型定义
@Author  ：Claude
@Date    ：2025-08-16
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BacktestResult(BaseModel):
    """回测结果模型"""
    id: Optional[int] = None
    symbol: str
    name: str
    strategy_name: str  # 添加策略名称字段
    backtest_start_time: str
    backtest_end_time: str
    pnl_ratio: float
    sharp_ratio: float
    max_drawdown: float
    risk_ratio: float
    open_count: int
    close_count: int
    win_count: int
    lose_count: int
    win_ratio: float
    trending_type: str
    created_at: Optional[str] = None

class BacktestConfig(BaseModel):
    """回测配置模型"""
    symbol: str
    strategy: str
    start_time: str
    end_time: str
    parameters: Optional[dict] = {}

class Strategy(BaseModel):
    """策略模型"""
    name: str
    display_name: str
    description: str
    parameters: List[dict]

class Symbol(BaseModel):
    """股票代码模型"""
    symbol: str
    name: str

class SystemConfig(BaseModel):
    """系统配置模型"""
    trading_mode: str
    db_type: str
    save_db: bool
    symbols: List[str]

class TaskStatus(BaseModel):
    """任务状态模型"""
    task_id: str
    status: str
    progress: int
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    message: str