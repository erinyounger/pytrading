#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：FastAPI Web服务主入口
@Author  ：Claude
@Date    ：2025-08-16
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
import uvicorn
import os
import sys
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
project_root = os.path.join(os.path.dirname(__file__), '../../..')
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'src'))

from pytrading.config.settings import config
from pytrading.model.back_test import BackTest
from pytrading.model.back_test_saver_factory import get_backtest_saver

app = FastAPI(
    title="PyTrading API",
    description="量化交易系统Web API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React开发服务器地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件服务
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """根路径"""
    return {"message": "PyTrading API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "timestamp": datetime.now()}

@app.get("/api/backtest-results")
async def get_backtest_results(
    symbol: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    trending_type: Optional[str] = None,
    min_pnl_ratio: Optional[float] = None,
    max_pnl_ratio: Optional[float] = None,
    min_win_ratio: Optional[float] = None,
    max_win_ratio: Optional[float] = None,
    page: int = 1,
    per_page: int = 20,
    latest_only: bool = True
):
    """获取回测结果列表"""
    try:
        saver = get_backtest_saver()
        
        if not saver:
            print("ERROR: 数据库连接失败 - BackTest saver 初始化失败")
            raise HTTPException(status_code=500, detail="数据库连接失败，无法获取回测结果")
        
        # 从数据库获取真实数据
        try:
            # 直接在数据库层执行筛选与分页
            result_data = saver.get_all_results(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                trending_type=trending_type,
                min_pnl_ratio=min_pnl_ratio,
                max_pnl_ratio=max_pnl_ratio,
                min_win_ratio=min_win_ratio,
                max_win_ratio=max_win_ratio,
                latest_only=latest_only,
                page=page,
                per_page=per_page
            )
            print(f"INFO: 数据库分页完成，当前页: {page}, 每页: {per_page}, 总记录数: {result_data['total']}")
        except Exception as db_error:
            print(f"ERROR: 数据库查询失败 - {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"数据库查询失败: {str(db_error)}")
        
        return result_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: 获取回测结果时发生未知错误 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.get("/api/system-status")
async def get_system_status():
    """获取系统状态"""
    try:
        saver = get_backtest_saver()
        
        if not saver:
            print("ERROR: 数据库连接失败 - 无法获取系统状态")
            raise HTTPException(status_code=500, detail="数据库连接失败，无法获取系统状态")
        
        # 从数据库统计真实数据
        try:
            result_data = saver.get_all_results(limit=100, page=1, per_page=100)
            backtest_results = result_data['data']
            print(f"INFO: 成功从数据库获取 {len(backtest_results)} 条数据用于统计系统状态")
            
            active_strategies = len([r for r in backtest_results if r.get("pnl_ratio", 0) > 0])
            total_pnl = sum([r.get("pnl_ratio", 0) for r in backtest_results]) * 100000  # 计算总资金
            
        except Exception as db_error:
            print(f"ERROR: 获取系统状态数据失败 - {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"数据库查询失败: {str(db_error)}")
        
        if not backtest_results:
            print("WARNING: 数据库中没有回测结果数据")
            raise HTTPException(status_code=404, detail="数据库中没有回测结果数据")
        
        system_status_data = {
            "trading_mode": os.getenv("TRADING_MODE", "backtest"),
            "system_status": "running",
            "active_strategies": active_strategies,
            "total_positions": 0, # 实时数据接口已删除，这里返回0
            "total_pnl": round(total_pnl, 2),
            "last_update": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        print(f"INFO: 成功生成系统状态数据 - 活跃策略: {active_strategies}, 总盈亏: {total_pnl:.2f}")
        return system_status_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: 获取系统状态时发生未知错误 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.get("/api/strategies")
async def get_strategies():
    """获取可用策略列表"""
    strategies = [
        {
            "name": "MACD_STRATEGY",
            "display_name": "MACD趋势策略",
            "description": "基于MACD指标的趋势跟踪策略，使用ATR进行仓位管理",
            "parameters": [
                {"name": "fast_period", "type": "int", "default": 12, "description": "快速EMA周期"},
                {"name": "slow_period", "type": "int", "default": 26, "description": "慢速EMA周期"},
                {"name": "signal_period", "type": "int", "default": 9, "description": "信号线周期"}
            ]
        },
        {
            "name": "BOLL_STRATEGY",
            "display_name": "布林带策略", 
            "description": "基于布林带的均值回归策略",
            "parameters": [
                {"name": "period", "type": "int", "default": 20, "description": "均线周期"},
                {"name": "std_dev", "type": "float", "default": 2.0, "description": "标准差倍数"}
            ]
        },
        {
            "name": "TURTLE_STRATEGY",
            "display_name": "海龟策略",
            "description": "经典的海龟交易突破策略",
            "parameters": [
                {"name": "entry_period", "type": "int", "default": 20, "description": "入场突破周期"},
                {"name": "exit_period", "type": "int", "default": 10, "description": "出场突破周期"}
            ]
        }
    ]
    return {"data": strategies}

@app.get("/api/symbols")
async def get_symbols():
    """获取股票代码列表"""
    # 上证50成分股示例
    symbols = [
        {"symbol": "SHSE.600000", "name": "浦发银行"},
        {"symbol": "SHSE.600036", "name": "招商银行"},
        {"symbol": "SHSE.600519", "name": "贵州茅台"},
        {"symbol": "SHSE.600887", "name": "伊利股份"},
        {"symbol": "SZSE.000001", "name": "平安银行"},
        {"symbol": "SZSE.000002", "name": "万科A"},
        {"symbol": "SZSE.000625", "name": "长安汽车"},
        {"symbol": "SZSE.000858", "name": "五粮液"},
    ]
    return {"data": symbols}

@app.post("/api/backtest/start")
async def start_backtest(backtest_config: dict):
    """启动回测任务"""
    try:
        # 验证配置参数
        required_fields = ["symbol", "strategy", "start_time", "end_time"]
        for field in required_fields:
            if field not in backtest_config:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # 这里应该调用实际的回测执行逻辑
        # 目前返回任务ID供前端跟踪
        task_id = f"backtest_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return {
            "task_id": task_id,
            "status": "started",
            "message": "回测任务已启动",
            "config": backtest_config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backtest/status/{task_id}")
async def get_backtest_status(task_id: str):
    """获取回测任务状态"""
    # 这里应该查询实际的任务状态
    # 目前返回固定状态
    return {
        "task_id": task_id,
        "status": "completed",  # pending, running, completed, failed
        "progress": 100,
        "start_time": "2024-01-01 09:00:00",
        "end_time": "2024-01-01 15:30:00",
        "message": "回测完成"
    }

@app.get("/api/config")
async def get_config():
    """获取系统配置"""
    return {
        "trading_mode": os.getenv("TRADING_MODE", "backtest"),
        "db_type": os.getenv("DB_TYPE", "mysql"),
        "save_db": os.getenv("SAVE_DB", "true").lower() == "true",
        "symbols": os.getenv("SYMBOLS", "").split(",") if os.getenv("SYMBOLS") else []
    }

@app.post("/api/config")
async def update_config(config: dict):
    """更新系统配置"""
    try:
        # 这里应该实现配置更新逻辑
        # 暂时返回成功响应
        return {
            "status": "success",
            "message": "配置已更新",
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 开发模式运行
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )