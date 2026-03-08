#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：FastAPI Web服务主入口
@Author  ：Claude
@Date    ：2025-08-16
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional, Dict, Any
from fastapi import Query
from pydantic import BaseModel
import uvicorn
import os
import sys
import asyncio
import threading
import time
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
project_root = os.path.join(os.path.dirname(__file__), '../../..')
sys.path.insert(0, project_root)
sys.path.insert(0, os.path.join(project_root, 'src'))

from pytrading.config.settings import config
from pytrading.model.back_test import BackTest
from pytrading.model.back_test_saver_factory import get_backtest_saver
from pytrading.db.mysql import MySQLClient, Strategy, StockSymbol, BacktestTask, SystemConfig, BackTestResult, StockKline
from pytrading.py_trading import PyTrading
from pytrading.logger import logger
from sqlalchemy import func
from gm.api import set_token, get_constituents, history, get_instruments
from pytrading.utils.talib_util import TA_MACD
import akshare as ak
from pytrading.utils.akshare_util import akshare_util
import pandas as pd

# 设置掘金量化token
set_token(config.token)

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

# 全局变量:任务调度器
task_scheduler_running = False
task_scheduler_thread = None
_last_scheduled_date = None  # 防止同一天重复触发定时回测

def execute_backtest_task(task_id: str):
    """
    后台执行回测任务
    Args:
        task_id: 任务ID
    """
    try:
        logger.info(f"开始执行后台回测任务: {task_id}")
        PyTrading.run_backtest_task(task_id)
        logger.info(f"后台回测任务执行完成: {task_id}")
    except Exception as e:
        logger.error(f"后台回测任务执行失败: {task_id}, 错误: {str(e)}")

def _check_scheduled_backtest(db_client):
    """检查是否需要触发定时回测"""
    global _last_scheduled_date
    now = datetime.now()

    # 仅工作日（周一至周五）
    if now.weekday() >= 5:
        return

    today_str = now.strftime('%Y-%m-%d')
    if _last_scheduled_date == today_str:
        return  # 今天已触发过

    try:
        session = db_client.get_session()
        try:
            enabled_row = session.query(SystemConfig).filter_by(
                config_key="watchlist_auto_backtest_enabled"
            ).first()
            if not enabled_row or enabled_row.config_value != "true":
                return

            time_row = session.query(SystemConfig).filter_by(
                config_key="watchlist_auto_backtest_time"
            ).first()
            target_time = time_row.config_value if time_row else "17:00"

            # 解析目标时间
            hour, minute = map(int, target_time.split(':'))
            target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

            if now >= target:
                from pytrading.service.watchlist_service import WatchlistService
                result = WatchlistService.create_backtest_tasks(source="scheduled")
                _last_scheduled_date = today_str
                logger.info(f"定时回测已触发: task_ids={result['task_ids']}, skipped={result['skipped_strategies']}")
        finally:
            session.close()
    except Exception as e:
        logger.error(f"定时回测检查失败: {e}")


def task_scheduler():
    """
    定时轮询pending状态的任务并执行
    """
    global task_scheduler_running
    logger.info("回测任务调度器启动")

    # 快速检查间隔：5秒（原来是30秒）
    fast_check_interval = 5
    check_count = 0

    while task_scheduler_running:
        try:
            # 获取数据库连接
            db_client = MySQLClient(
                host=config.mysql_host,
                db_name=config.mysql_database,
                port=config.mysql_port,
                username=config.mysql_username,
                password=config.mysql_password
            )
            session = db_client.get_session()

            # 查询pending状态的任务
            pending_tasks = session.query(BacktestTask).filter_by(status='pending').all()
            if pending_tasks:
                logger.info(f"发现 {len(pending_tasks)} 个待执行的回测任务")

            if pending_tasks:
                logger.info(f"发现 {len(pending_tasks)} 个待执行的回测任务")

                for task in pending_tasks:
                    logger.info(f"准备执行任务: {task.task_id}, status: {task.status}")
                    # 在新线程中执行任务,避免阻塞调度器
                    thread = threading.Thread(target=execute_backtest_task, args=(task.task_id,))
                    thread.daemon = True
                    thread.start()

            session.close()

            # ===== 定时回测检查 =====
            _check_scheduled_backtest(db_client)

            # 动态调整检查频率
            # 如果有pending任务，加快检查频率
            if pending_tasks:
                check_count += 1
                # 如果连续3次检查都有任务，则继续快速检查
                if check_count >= 3:
                    # 继续快速检查
                    check_count = 0

        except Exception as e:
            logger.error(f"任务调度器执行出错: {str(e)}", exc_info=True)

        # 动态睡眠间隔：如果有pending任务，检查更频繁
        sleep_time = fast_check_interval
        time.sleep(sleep_time)

    logger.info("回测任务调度器停止")

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    global task_scheduler_running, task_scheduler_thread

    logger.info("FastAPI应用启动")

    # 创建数据库表（如果不存在）
    try:
        from pytrading.db.mysql import MySQLClient
        client = MySQLClient(
            host=config.mysql_host,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password,
            db_name=config.mysql_database,
        )
        client.create_tables()
        logger.info("数据库表创建完成")
    except Exception as e:
        logger.warning(f"创建数据库表失败（表可能已存在）: {e}")

    # 启动任务调度器
    task_scheduler_running = True
    task_scheduler_thread = threading.Thread(target=task_scheduler)
    task_scheduler_thread.daemon = True
    task_scheduler_thread.start()
    logger.info("回测任务调度器已启动")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    global task_scheduler_running
    
    logger.info("FastAPI应用关闭")
    
    # 停止任务调度器
    task_scheduler_running = False
    logger.info("回测任务调度器已停止")

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
    industry: Optional[str] = None,
    min_pnl_ratio: Optional[float] = None,
    max_pnl_ratio: Optional[float] = None,
    min_win_ratio: Optional[float] = None,
    max_win_ratio: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_drawdown_duration: Optional[int] = None,
    max_drawdown_duration: Optional[int] = None,
    page: int = 1,
    per_page: int = 10,
    sort_by: Optional[str] = None,  # 排序字段
    sort_order: Optional[str] = 'desc'  # 排序方向：asc/desc
):
    """获取回测结果列表"""
    try:
        saver = get_backtest_saver()
        
        if not saver:
            logger.error("数据库连接失败 - BackTest saver 初始化失败")
            raise HTTPException(status_code=500, detail="数据库连接失败，无法获取回测结果")
        
        # 从数据库获取真实数据
        try:
            # 直接在数据库层执行筛选与分页
            result_data = saver.get_all_results(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                trending_type=trending_type,
                industry=industry,
                min_pnl_ratio=min_pnl_ratio,
                max_pnl_ratio=max_pnl_ratio,
                min_win_ratio=min_win_ratio,
                max_win_ratio=max_win_ratio,
                min_market_cap=min_market_cap,
                max_market_cap=max_market_cap,
                min_drawdown_duration=min_drawdown_duration,
                max_drawdown_duration=max_drawdown_duration,
                page=page,
                per_page=per_page,
                sort_by=sort_by,
                sort_order=sort_order
            )
            logger.info(f"数据库分页完成，当前页: {page}, 每页: {per_page}, 总记录数: {result_data['total']}, 排序字段: {sort_by}, 排序方向: {sort_order}")
        except Exception as db_error:
            logger.error(f"数据库查询失败 - {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"数据库查询失败: {str(db_error)}")
        
        return result_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取回测结果时发生未知错误 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

@app.get("/api/system-status")
async def get_system_status():
    """获取系统状态"""
    try:
        saver = get_backtest_saver()
        
        if not saver:
            logger.error("数据库连接失败 - 无法获取系统状态")
            raise HTTPException(status_code=500, detail="数据库连接失败，无法获取系统状态")
        
        # 从数据库统计真实数据
        try:
            result_data = saver.get_all_results(limit=100, page=1, per_page=100)
            backtest_results = result_data['data']
            logger.info(f"成功从数据库获取 {len(backtest_results)} 条数据用于统计系统状态")
            
            active_strategies = len([r for r in backtest_results if r.get("pnl_ratio", 0) > 0])
            total_pnl = sum([r.get("pnl_ratio", 0) for r in backtest_results]) * 100000  # 计算总资金
            
        except Exception as db_error:
            logger.error(f"获取系统状态数据失败 - {str(db_error)}")
            raise HTTPException(status_code=500, detail=f"数据库查询失败: {str(db_error)}")

        if not backtest_results:
            logger.warning("数据库中没有回测结果数据")
            raise HTTPException(status_code=404, detail="数据库中没有回测结果数据")
        
        system_status_data = {
            "trading_mode": os.getenv("TRADING_MODE", "backtest"),
            "system_status": "running",
            "active_strategies": active_strategies,
            "total_positions": 0, # 实时数据接口已删除，这里返回0
            "total_pnl": round(total_pnl, 2),
            "last_update": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        logger.info(f"成功生成系统状态数据 - 活跃策略: {active_strategies}, 总盈亏: {total_pnl:.2f}")
        return system_status_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取系统状态时发生未知错误 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")

def get_db_client():
    """获取数据库客户端"""
    return MySQLClient(
        host=config.mysql_host,
        db_name=config.mysql_database,
        port=config.mysql_port,
        username=config.mysql_username,
        password=config.mysql_password
    )

@app.get("/api/logs/task/{task_id}")
async def get_task_logs(task_id: str, after_id: int = 0, limit: int = 500):
    """获取任务级日志(增量)"""
    try:
        from pytrading.db.log_repository import LogRepository
        db_client = get_db_client()
        log_repo = LogRepository(db_client=db_client)
        result = log_repo.query_logs(task_id=task_id, symbol=None, after_id=after_id, limit=min(max(limit, 1), 2000))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务日志失败: {str(e)}")


@app.get("/api/logs/result")
async def get_result_logs(task_id: str, symbol: str, after_id: int = 0, limit: int = 500):
    """获取个股级日志(增量)"""
    if not task_id or not symbol:
        raise HTTPException(status_code=400, detail="task_id 和 symbol 为必填")
    try:
        from pytrading.db.log_repository import LogRepository
        db_client = get_db_client()
        log_repo = LogRepository(db_client=db_client)
        result = log_repo.query_logs(task_id=task_id, symbol=symbol, after_id=after_id, limit=min(max(limit, 1), 2000))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取个股日志失败: {str(e)}")

@app.get("/api/strategies")
async def get_strategies():
    """获取可用策略列表"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            strategies = session.query(Strategy).filter_by(is_active=True).all()
            
            # 如果数据库中没有策略,返回默认策略
            if not strategies:
                default_strategies = [
                    {
                        "name": "MACD",
                        "display_name": "MACD趋势策略",
                        "description": "基于MACD指标的趋势跟踪策略，使用ATR进行仓位管理",
                        "parameters": [
                            {"name": "fast_period", "type": "int", "default": 12, "description": "快速EMA周期"},
                            {"name": "slow_period", "type": "int", "default": 26, "description": "慢速EMA周期"},
                            {"name": "signal_period", "type": "int", "default": 9, "description": "信号线周期"}
                        ]
                    },
                    {
                        "name": "BOLL",
                        "display_name": "布林带策略", 
                        "description": "基于布林带的均值回归策略",
                        "parameters": [
                            {"name": "period", "type": "int", "default": 20, "description": "均线周期"},
                            {"name": "std_dev", "type": "float", "default": 2.0, "description": "标准差倍数"}
                        ]
                    },
                    {
                        "name": "TURTLE",
                        "display_name": "海龟策略",
                        "description": "经典的海龟交易突破策略",
                        "parameters": [
                            {"name": "entry_period", "type": "int", "default": 20, "description": "入场突破周期"},
                            {"name": "exit_period", "type": "int", "default": 10, "description": "出场突破周期"}
                        ]
                    }
                ]
                return {"data": default_strategies}
            
            result = []
            for strategy in strategies:
                params = strategy.parameters if strategy.parameters else []
                result.append({
                    "id": strategy.id,
                    "name": strategy.name,
                    "display_name": strategy.display_name,
                    "description": strategy.description,
                    "strategy_type": strategy.strategy_type,
                    "parameters": params
                })
            
            return {"data": result}
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"获取策略列表失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取策略列表失败: {str(e)}")

@app.get("/api/symbols")
async def get_symbols():
    """获取股票代码列表"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            symbols = session.query(StockSymbol).filter_by(is_active=True).all()
            
            # 如果数据库中没有股票,返回默认股票池
            if not symbols:
                default_symbols = [
                    {"symbol": "SHSE.600000", "name": "浦发银行"},
                    {"symbol": "SHSE.600036", "name": "招商银行"},
                    {"symbol": "SHSE.600519", "name": "贵州茅台"},
                    {"symbol": "SHSE.600887", "name": "伊利股份"},
                    {"symbol": "SZSE.000001", "name": "平安银行"},
                    {"symbol": "SZSE.000002", "name": "万科A"},
                    {"symbol": "SZSE.000625", "name": "长安汽车"},
                    {"symbol": "SZSE.000858", "name": "五粮液"},
                ]
                return {"data": default_symbols}
            
            result = []
            for symbol in symbols:
                result.append({
                    "id": symbol.id,
                    "symbol": symbol.symbol,
                    "name": symbol.name,
                    "market": symbol.market,
                    "industry": symbol.industry
                })
            
            return {"data": result}
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"获取股票列表失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取股票列表失败: {str(e)}")

@app.post("/api/backtest/start")
async def start_backtest(backtest_config: dict):
    """启动回测任务"""
    try:
        # 验证配置参数
        required_fields = ["strategy", "start_time", "end_time"]
        for field in required_fields:
            if field not in backtest_config:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # 验证mode参数
        mode = backtest_config.get('mode', 'single')
        if mode not in ['single', 'index']:
            raise HTTPException(status_code=400, detail="Invalid mode, must be 'single' or 'index'")
        
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            # 查找策略ID
            strategy = session.query(Strategy).filter_by(name=backtest_config['strategy']).first()
            strategy_id = strategy.id if strategy else None
            
            # 根据模式获取股票列表
            symbols = []
            task_name = ""
            
            if mode == 'single':
                # 单股票模式
                if 'symbols' not in backtest_config or not backtest_config['symbols']:
                    raise HTTPException(status_code=400, detail="单股票模式需要提供symbols参数")
                symbols = backtest_config['symbols'] if isinstance(backtest_config['symbols'], list) else [backtest_config['symbols']]
                task_name = f"{'_'.join(symbols[:3])}"
                if len(symbols) > 3:
                    task_name += f"_等{len(symbols)}只"
            else:
                # 指数成分股模式 - 只保存指数代码,不立即获取成分股
                if 'index_symbol' not in backtest_config:
                    raise HTTPException(status_code=400, detail="指数模式需要提供index_symbol参数")
                
                index_symbol = backtest_config['index_symbol']
                
                # 只保存指数代码,实际执行时再获取成分股
                symbols = [index_symbol]  # 暂存指数代码
                task_name = index_symbol
                
                logger.info(f"创建指数回测任务 - 指数: {index_symbol}")
            
            # 生成任务ID
            task_id = f"{mode}_{task_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # 保存所有参数到parameters字段
            parameters = {
                "mode": mode,
                "strategy": backtest_config['strategy'],
            }
            
            if mode == 'index':
                parameters['index_symbol'] = backtest_config['index_symbol']
            
            # 保存用户自定义参数
            if 'parameters' in backtest_config:
                parameters.update(backtest_config['parameters'])
            
            # 创建回测任务
            task = BacktestTask(
                task_id=task_id,
                strategy_id=strategy_id,
                symbols=symbols,
                start_time=datetime.strptime(backtest_config['start_time'], '%Y-%m-%d %H:%M:%S'),
                end_time=datetime.strptime(backtest_config['end_time'], '%Y-%m-%d %H:%M:%S'),
                status='pending',
                progress=0,
                parameters=parameters
            )
            session.add(task)
            session.commit()
            
            logger.info(f"创建回测任务成功 - task_id: {task_id}, 股票数量: {len(symbols)}")
            
            # 返回信息
            if mode == 'index':
                message = f"回测任务已创建,将在执行时获取指数 {backtest_config['index_symbol']} 的成分股"
                symbol_count = 0  # 指数模式暂时返回0,执行时才知道实际数量
            else:
                message = f"回测任务已创建,包含 {len(symbols)} 只股票"
                symbol_count = len(symbols)
            
            return {
                "task_id": task_id,
                "status": "started",
                "message": message,
                "symbol_count": symbol_count,
                "config": backtest_config
            }
            
        finally:
            session.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建回测任务失败 - {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"创建回测任务失败: {str(e)}")

@app.get("/api/backtest/status/{task_id}")
async def get_backtest_status(task_id: str):
    """获取回测任务状态"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()
            
            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")
            
            return {
                "task_id": task.task_id,
                "status": task.status,
                "progress": task.progress,
                "start_time": task.start_time.strftime('%Y-%m-%d %H:%M:%S') if task.start_time else None,
                "end_time": task.end_time.strftime('%Y-%m-%d %H:%M:%S') if task.end_time else None,
                "message": task.error_message if task.error_message else "任务进行中" if task.status == 'running' else "任务完成"
            }
            
        finally:
            session.close()
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取任务状态失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取任务状态失败: {str(e)}")

@app.post("/api/backtest/stop/{task_id}")
async def stop_backtest(task_id: str):
    """停止回测任务"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            # 只有运行中的任务才能停止
            if task.status != 'running':
                return {
                    "task_id": task_id,
                    "status": task.status,
                    "message": f"任务当前状态为 {task.status}，无法停止"
                }

            # 更新任务状态为 cancelled
            task.status = 'cancelled'
            task.updated_at = datetime.now()
            session.commit()

            # 取消任务，停止接收新任务
            try:
                PyTrading.terminate_task(task_id)
            except Exception as e:
                logger.error(f"取消任务失败: {e}")

            logger.info(f"任务已停止 - task_id: {task_id}")

            return {
                "task_id": task_id,
                "status": "cancelled",
                "message": "任务已停止"
            }

        finally:
            session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"停止任务失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"停止任务失败: {str(e)}")

@app.post("/api/backtest/restart/{task_id}")
async def restart_backtest(task_id: str):
    """重启回测任务"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            # 查询原任务
            original_task = session.query(BacktestTask).filter_by(task_id=task_id).first()

            if not original_task:
                raise HTTPException(status_code=404, detail="任务不存在")

            # 只有已完成、失败或取消的任务才能重启
            if original_task.status not in ['completed', 'failed', 'cancelled']:
                return {
                    "task_id": task_id,
                    "status": original_task.status,
                    "message": f"任务当前状态为 {original_task.status}，无法重启"
                }

            # 生成新任务ID（简化格式避免超过100字符限制）
            # 从原始task_id中提取关键部分
            parts = task_id.split('_')
            if len(parts) >= 2:
                prefix = parts[0]  # 取第一个部分作为前缀，如 index
                if len(parts) >= 3:
                    prefix = parts[0] + '_' + parts[1][:10]  # 加上股票代码前10字符
            else:
                prefix = 'restart'
            new_task_id = f"{prefix}_r{datetime.now().strftime('%Y%m%d%H%M%S')}"

            # 创建新任务，复用原任务的参数
            new_task = BacktestTask(
                task_id=new_task_id,
                strategy_id=original_task.strategy_id,
                symbols=original_task.symbols,
                start_time=original_task.start_time,
                end_time=original_task.end_time,
                status='pending',
                progress=0,
                parameters=original_task.parameters
            )
            session.add(new_task)
            session.commit()

            logger.info(f"任务已重启 - original_task_id: {task_id}, new_task_id: {new_task_id}")

            return {
                "task_id": new_task_id,
                "status": "started",
                "message": f"任务已重启，新任务ID: {new_task_id}",
                "original_task_id": task_id
            }

        finally:
            session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重启任务失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"重启任务失败: {str(e)}")

@app.get("/api/backtest/tasks")
async def get_backtest_tasks(
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 10
):
    """获取回测任务列表"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            query = session.query(BacktestTask)
            
            # 状态筛选
            if status:
                query = query.filter_by(status=status)
            
            # 获取总数
            total_count = query.count()
            
            # 分页
            offset = (page - 1) * per_page
            tasks = query.order_by(BacktestTask.created_at.desc()).offset(offset).limit(per_page).all()
            
            result = []
            for task in tasks:
                # 计算耗时：running 状态用当前时间，其他状态用 updated_at
                end_time = datetime.now() if task.status == 'running' else task.updated_at
                duration = int((end_time - task.created_at).total_seconds()) if end_time and task.created_at else None

                result.append({
                    "id": task.id,
                    "task_id": task.task_id,
                    "strategy_id": task.strategy_id,
                    "symbols": task.symbols,
                    "symbol_count": len(task.symbols) if task.symbols else 0,
                    "start_time": task.start_time.strftime('%Y-%m-%d %H:%M:%S') if task.start_time else None,
                    "end_time": task.end_time.strftime('%Y-%m-%d %H:%M:%S') if task.end_time else None,
                    "status": task.status,
                    "progress": task.progress,
                    "parameters": task.parameters,
                    "result_summary": task.result_summary,
                    "error_message": task.error_message,
                    "created_at": task.created_at.strftime('%Y-%m-%d %H:%M:%S') if task.created_at else None,
                    "updated_at": task.updated_at.strftime('%Y-%m-%d %H:%M:%S') if task.updated_at else None,
                    "duration": duration
                })
            
            return {
                "data": result,
                "total": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page
            }
            
        finally:
            session.close()
            
    except Exception as e:
        logger.error(f"获取任务列表失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")

@app.get("/api/backtest/tasks/{task_id}/results")
async def get_task_results(task_id: str):
    """获取任务的回测结果列表"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        
        try:
            # 获取任务信息
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()
            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")
            
            # 获取该任务的所有回测结果
            results = session.query(BackTestResult).filter(
                BackTestResult.task_id == task_id,
                BackTestResult.backtest_start_time == task.start_time,
                BackTestResult.backtest_end_time == task.end_time
            ).all()
            
            result_list = []
            for r in results:
                result_list.append({
                    "id": r.id,
                    "symbol": r.symbol,
                    "name": r.name,
                    "strategy_name": r.strategy_name,
                    "backtest_start_time": r.backtest_start_time.strftime('%Y-%m-%d %H:%M:%S') if r.backtest_start_time else None,
                    "backtest_end_time": r.backtest_end_time.strftime('%Y-%m-%d %H:%M:%S') if r.backtest_end_time else None,
                    "pnl_ratio": float(r.pnl_ratio) if r.pnl_ratio else 0,
                    "sharp_ratio": float(r.sharp_ratio) if r.sharp_ratio else 0,
                    "max_drawdown": float(r.max_drawdown) if r.max_drawdown else 0,
                    "win_ratio": float(r.win_ratio) if r.win_ratio else 0,
                    "current_price": float(r.current_price) if r.current_price else None,
                    "open_count": r.open_count,
                    "close_count": r.close_count,
                    "win_count": r.win_count,
                    "lose_count": r.lose_count,
                })
            
            return {
                "data": result_list
            }
        finally:
            session.close()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务结果失败: {str(e)}")

@app.delete("/api/backtest/tasks/{task_id}")
async def delete_backtest_task(task_id: str):
    """删除回测任务及其关联的回测结果"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            # 查询任务
            task = session.query(BacktestTask).filter_by(task_id=task_id).first()

            if not task:
                raise HTTPException(status_code=404, detail="任务不存在")

            # 先删除关联的回测结果
            deleted_results = session.query(BackTestResult).filter_by(task_id=task_id).delete()
            logger.info(f"删除回测结果 {deleted_results} 条")

            # 删除任务
            session.delete(task)
            session.commit()

            logger.info(f"任务已删除 - task_id: {task_id}")

            return {
                "task_id": task_id,
                "status": "deleted",
                "message": f"任务已删除，同时删除了 {deleted_results} 条关联回测结果"
            }

        finally:
            session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除任务失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除任务失败: {str(e)}")

@app.delete("/api/backtest/results/{result_id}")
async def delete_backtest_result(result_id: int):
    """删除单条回测结果"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            # 查询回测结果
            result = session.query(BackTestResult).filter_by(id=result_id).first()

            if not result:
                raise HTTPException(status_code=404, detail="回测结果不存在")

            # 记录相关信息用于日志
            task_id = result.task_id
            symbol = result.symbol

            # 删除回测结果
            session.delete(result)
            session.commit()

            logger.info(f"回测结果已删除 - result_id: {result_id}, task_id: {task_id}, symbol: {symbol}")

            return {
                "result_id": result_id,
                "status": "deleted",
                "message": f"回测结果已删除 (task_id: {task_id}, symbol: {symbol})"
            }

        finally:
            session.close()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除回测结果失败 - {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除回测结果失败: {str(e)}")

@app.get("/api/config")
async def get_config():
    """获取系统配置"""
    base_config = {
        "trading_mode": os.getenv("TRADING_MODE", "backtest"),
        "db_type": os.getenv("DB_TYPE", "mysql"),
        "save_db": os.getenv("SAVE_DB", "true").lower() == "true",
        "symbols": os.getenv("SYMBOLS", "").split(",") if os.getenv("SYMBOLS") else []
    }

    # 从 SystemConfig 表读取定时回测配置
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        try:
            for key in ["watchlist_auto_backtest_enabled", "watchlist_auto_backtest_time"]:
                row = session.query(SystemConfig).filter_by(config_key=key).first()
                if row:
                    if key == "watchlist_auto_backtest_enabled":
                        base_config[key] = row.config_value == "true"
                    else:
                        base_config[key] = row.config_value
                else:
                    if key == "watchlist_auto_backtest_enabled":
                        base_config[key] = False
                    else:
                        base_config[key] = "17:00"
        finally:
            session.close()
    except Exception as e:
        logger.warning(f"读取定时回测配置失败: {e}")
        base_config["watchlist_auto_backtest_enabled"] = False
        base_config["watchlist_auto_backtest_time"] = "17:00"

    return base_config

@app.post("/api/config")
async def update_config(config: dict):
    """更新系统配置"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()
        try:
            watchlist_keys = {"watchlist_auto_backtest_enabled", "watchlist_auto_backtest_time"}
            for key in watchlist_keys:
                if key in config:
                    value = config[key]
                    if key == "watchlist_auto_backtest_enabled":
                        value = "true" if value else "false"

                    row = session.query(SystemConfig).filter_by(config_key=key).first()
                    if row:
                        row.config_value = str(value)
                    else:
                        row = SystemConfig(
                            config_key=key,
                            config_value=str(value),
                            config_type="string",
                            description="关注列表定时回测配置",
                        )
                        session.add(row)
            session.commit()
        finally:
            session.close()

        return {
            "status": "success",
            "message": "配置已更新",
            "config": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def sync_kline_data(symbol: str, days: int = 365, start_date: str = None, end_date: str = None):
    """
    同步K线数据到数据库
    Args:
        symbol: 股票代码
        days: 获取天数，默认为365天（仅在未指定 start_date/end_date 时使用）
        start_date: 可选，回测开始日期 (YYYY-MM-DD)
        end_date: 可选，回测结束日期 (YYYY-MM-DD)
    """
    from datetime import datetime, timedelta

    try:
        # 计算日期范围
        if start_date and end_date:
            # 使用指定日期范围，多取60天确保MACD预热
            fetch_start = (datetime.strptime(start_date, '%Y-%m-%d') - timedelta(days=60)).strftime('%Y-%m-%d')
            fetch_end = end_date
        else:
            fetch_end = datetime.now().strftime('%Y-%m-%d')
            fetch_start = (datetime.now() - timedelta(days=days + 60)).strftime('%Y-%m-%d')  # 多取60天以确保有足够数据计算MACD

        # 获取历史K线数据
        bars = history(
            symbol=symbol,
            frequency='1d',
            start_time=fetch_start,
            end_time=fetch_end,
            fields='symbol,open,high,low,close,volume,eob',
            df=True
        )

        if bars is None or bars.empty:
            logger.warning(f"获取K线数据失败: {symbol}")
            return False

        # 计算MACD
        close_prices = bars['close'].values.astype(float)
        diff, dea, macd_hist = TA_MACD(close_prices, fastperiod=12, slowperiod=26, signalperiod=9)

        # 获取数据库连接
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            # 裁剪到目标范围
            if start_date and end_date:
                # 按日期范围过滤：保留 start_date ~ end_date 的数据
                # eob 是 tz-aware datetime64，用 pd.Timestamp 对齐类型
                target_start = pd.Timestamp(start_date).tz_localize(bars['eob'].dt.tz) if bars['eob'].dt.tz else pd.Timestamp(start_date)
                mask = bars['eob'] >= target_start
                trim_idx = mask.idxmax() if mask.any() else 0
                bars = bars.loc[trim_idx:].reset_index(drop=True)
                diff = diff[trim_idx:]
                dea = dea[trim_idx:]
                macd_hist = macd_hist[trim_idx:]
            else:
                # 保留最近的 days 天数据
                bars = bars.tail(days).reset_index(drop=True)
                diff = diff[-days:]
                dea = dea[-days:]
                macd_hist = macd_hist[-days:]

            saved_count = 0
            for i in range(len(bars)):
                row = bars.iloc[i]
                # 解析日期
                if 'eob' in row:
                    date_val = row['eob']
                else:
                    continue

                # 检查是否已存在
                existing = session.query(StockKline).filter_by(
                    symbol=symbol,
                    date=date_val.date() if isinstance(date_val, datetime) else date_val
                ).first()

                if existing:
                    # 更新
                    existing.open = float(row['open']) if pd.notna(row['open']) else None
                    existing.high = float(row['high']) if pd.notna(row['high']) else None
                    existing.low = float(row['low']) if pd.notna(row['low']) else None
                    existing.close = float(row['close']) if pd.notna(row['close']) else None
                    existing.volume = int(row['volume']) if pd.notna(row['volume']) and row['volume'] else 0
                    existing.macd_diff = float(diff[i]) if i < len(diff) and pd.notna(diff[i]) else None
                    existing.macd_dea = float(dea[i]) if i < len(dea) and pd.notna(dea[i]) else None
                    existing.macd_hist = float(macd_hist[i]) if i < len(macd_hist) and pd.notna(macd_hist[i]) else None
                else:
                    # 新增
                    kline = StockKline(
                        symbol=symbol,
                        date=date_val.date() if isinstance(date_val, datetime) else date_val,
                        open=float(row['open']) if pd.notna(row['open']) else None,
                        high=float(row['high']) if pd.notna(row['high']) else None,
                        low=float(row['low']) if pd.notna(row['low']) else None,
                        close=float(row['close']) if pd.notna(row['close']) else None,
                        volume=int(row['volume']) if pd.notna(row['volume']) and row['volume'] else 0,
                        macd_diff=float(diff[i]) if i < len(diff) and pd.notna(diff[i]) else None,
                        macd_dea=float(dea[i]) if i < len(dea) and pd.notna(dea[i]) else None,
                        macd_hist=float(macd_hist[i]) if i < len(macd_hist) and pd.notna(macd_hist[i]) else None
                    )
                    session.add(kline)
                    saved_count += 1

            session.commit()
            logger.info(f"K线数据同步完成: {symbol}, 新增/更新 {saved_count} 条")
            return True

        finally:
            session.close()

    except Exception as e:
        logger.error(f"同步K线数据失败: {symbol}, error: {str(e)}")
        return False


@app.get("/api/trade-records")
async def get_trade_records(task_id: str, symbol: Optional[str] = None):
    """获取回测交易信号记录"""
    try:
        from pytrading.service.trade_record_service import TradeRecordService
        from pytrading.db.mysql import TradeRecord as TradeRecordModel

        records = TradeRecordService.get_trade_records(task_id, symbol)

        # 构建标签
        def make_label(r):
            if r.action == 'build':
                return '建'
            elif r.action == 'buy':
                pct = int(r.target_percent * 100) if r.target_percent else 0
                return f'买{pct}%'
            elif r.action == 'sell':
                pct = int(r.target_percent * 100) if r.target_percent else 0
                return f'卖{pct}%'
            elif r.action == 'close':
                return '平'
            return r.action

        return {
            "data": [
                {
                    "action": r.action,
                    "label": make_label(r),
                    "target_percent": float(r.target_percent) if r.target_percent else None,
                    "price": float(r.price) if r.price else None,
                    "volume": r.volume,
                    "signal_type": r.signal_type,
                    "bar_time": r.bar_time.strftime('%Y-%m-%d') if r.bar_time else None,
                }
                for r in records
            ]
        }
    except Exception as e:
        logger.error(f"获取交易记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/kline/{symbol}")
async def get_kline_data(symbol: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """获取K线数据"""
    try:
        db_client = get_db_client()
        session = db_client.get_session()

        try:
            # 查询K线数据，按日期升序排列
            query = session.query(StockKline).filter_by(
                symbol=symbol
            )

            # MACD预热需要额外60天数据
            macd_warmup_days = 60

            # 日期范围过滤（包含预热期）
            if start_date:
                from datetime import datetime as dt, timedelta
                start_dt = dt.strptime(start_date, '%Y-%m-%d') - timedelta(days=macd_warmup_days)
                query = query.filter(StockKline.date >= start_dt.date())
            if end_date:
                from datetime import datetime as dt
                query = query.filter(StockKline.date <= dt.strptime(end_date, '%Y-%m-%d').date())

            klines = query.order_by(StockKline.date.asc()).all()

            if not klines:
                # 如果没有数据，返回提示信息
                return {
                    "symbol": symbol,
                    "data": [],
                    "message": "暂无K线数据，请先同步"
                }

            result = []
            for k in klines:
                result.append({
                    "date": k.date.strftime('%Y-%m-%d') if k.date else None,
                    "open": float(k.open) if k.open else None,
                    "high": float(k.high) if k.high else None,
                    "low": float(k.low) if k.low else None,
                    "close": float(k.close) if k.close else None,
                    "volume": k.volume,
                    "macd_diff": float(k.macd_diff) if k.macd_diff else None,
                    "macd_dea": float(k.macd_dea) if k.macd_dea else None,
                    "macd_hist": float(k.macd_hist) if k.macd_hist else None
                })

            return {
                "symbol": symbol,
                "data": result
            }

        finally:
            session.close()

    except Exception as e:
        logger.error(f"获取K线数据失败: {symbol}, error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取K线数据失败: {str(e)}")


@app.post("/api/kline/sync")
async def sync_kline(sync_request: dict):
    """同步K线数据"""
    try:
        symbol = sync_request.get("symbol")
        days = sync_request.get("days", 365)  # 默认365天
        start_date = sync_request.get("start_date")
        end_date = sync_request.get("end_date")

        if not symbol:
            raise HTTPException(status_code=400, detail="缺少symbol参数")

        # 调用同步函数
        success = sync_kline_data(symbol, days, start_date=start_date, end_date=end_date)

        if success:
            return {
                "status": "success",
                "message": f"K线数据同步成功: {symbol}",
                "symbol": symbol,
                "days": days
            }
        else:
            raise HTTPException(status_code=500, detail=f"K线数据同步失败: {symbol}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"同步K线数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"同步K线数据失败: {str(e)}")

@app.get("/api/stock-info/{symbol}")
async def get_stock_info(symbol: str):
    """获取股票基本信息"""
    try:
        # 先从数据库获取股票基本信息（复用 /api/symbols 的逻辑）
        db_client = get_db_client()
        session = db_client.get_session()

        db_name = None
        db_industry = None

        try:
            # 获取所有活跃的股票
            all_symbols = session.query(StockSymbol).filter_by(is_active=True).all()

            if all_symbols:
                # 精确匹配或部分匹配
                symbol_lower = symbol.lower()
                for s in all_symbols:
                    if s.symbol.lower() == symbol_lower or symbol_lower.endswith(s.symbol.lower()) or s.symbol.lower().endswith(symbol_lower):
                        db_name = s.name
                        db_industry = s.industry
                        break
            else:
                # 如果数据库没有，返回默认股票池中查找
                default_symbols = [
                    {"symbol": "SHSE.600000", "name": "浦发银行", "industry": "银行"},
                    {"symbol": "SHSE.600036", "name": "招商银行", "industry": "银行"},
                    {"symbol": "SHSE.600519", "name": "贵州茅台", "industry": "白酒"},
                    {"symbol": "SHSE.600887", "name": "伊利股份", "industry": "食品饮料"},
                    {"symbol": "SZSE.000001", "name": "平安银行", "industry": "银行"},
                    {"symbol": "SZSE.000002", "name": "万科A", "industry": "房地产"},
                    {"symbol": "SZSE.000625", "name": "长安汽车", "industry": "汽车"},
                    {"symbol": "SZSE.000858", "name": "五粮液", "industry": "白酒"},
                ]
                for ds in default_symbols:
                    if ds["symbol"].lower() == symbol.lower():
                        db_name = ds["name"]
                        db_industry = ds["industry"]
                        break

        finally:
            session.close()

        # 调用掘金API获取更多股票信息
        try:
            # 使用回测token获取股票信息（live token没有数据查询权限）
            original_token = config.token
            config.token = config.backtest_trading_token
            set_token(config.token)
            stock_info_list = get_instruments(symbols=symbol)
            # 恢复原token
            config.token = original_token
            set_token(config.token)
            stock_info = stock_info_list[0] if stock_info_list and len(stock_info_list) > 0 else {}
        except Exception as e:
            logger.warning(f"掘金API获取失败: {symbol}, error: {str(e)}")
            stock_info = {}


        # 使用AkShare工具类获取详细信息
        # 尝试使用AkShare获取详细信息，失败则使用掘金数据
        try:
            akshare_info = akshare_util.get_stock_individual_info(symbol)
        except Exception as e:
            logger.warning(f"AkShare调用失败，使用掘金数据: {str(e)}")
            akshare_info = {}
        
        # 构建返回数据（优先使用AkShare数据，丰富掘金API字段）
        # 计算市值（如果AkShare失败，使用昨收价*股本估算）
        total_shares = akshare_info.get("总股本")
        circulating_shares = akshare_info.get("流通股")
        pre_close = stock_info.get('pre_close')
        
        if total_shares and pre_close:
            estimated_total_mv = total_shares * pre_close * 100000000  # 股数 × 价格
        else:
            estimated_total_mv = akshare_info.get("总市值")
            
        if circulating_shares and pre_close:
            estimated_circulating_mv = circulating_shares * pre_close * 100000000
        else:
            estimated_circulating_mv = akshare_info.get("流通市值")
        
        result = {
            "symbol": symbol,
            "name": akshare_info.get("股票简称") or db_name or stock_info.get('sec_name'),
            "industry": akshare_info.get("行业") or db_industry,
            "exchange": "SHSE" if symbol.startswith("SHSE") else "SZSE" if symbol.startswith("SZSE") else stock_info.get('exchange'),
            "list_date": akshare_info.get("上市时间") or stock_info.get('listed_date'),
            "total_shares": total_shares,
            "circulating_shares": circulating_shares,
            "total_market_cap": estimated_total_mv,
            "circulating_market_cap": estimated_circulating_mv,
            "latest_price": akshare_info.get("最新") or pre_close,
            # 补充更多掘金API字段
            "sec_type": stock_info.get('sec_type'),
            "sec_level": stock_info.get('sec_level'),
            "sec_abbr": stock_info.get('sec_abbr'),
            "pre_close": pre_close,
            "upper_limit": stock_info.get('upper_limit'),
            "lower_limit": stock_info.get('lower_limit'),
            "price_tick": stock_info.get('price_tick'),
            "margin_ratio": stock_info.get('margin_ratio'),
            "adj_factor": stock_info.get('adj_factor'),
            "is_suspended": stock_info.get('is_suspended'),
            "board": stock_info.get('board'),
            "trade_date": stock_info.get('trade_date'),
            "delist_date": stock_info.get('delisted_date'),
            "is_hs": stock_info.get('is_hs'),
            "status": stock_info.get('status'),
        }

        logger.info(f"成功获取股票信息: {symbol}, name: {result.get('name')}")
        return {"data": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取股票信息失败: {symbol}, error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取股票信息失败: {str(e)}")


# ==================== 关注列表 API ====================

class WatchlistRequest(BaseModel):
    """关注请求模型"""
    symbol: str
    name: Optional[str] = None
    strategy_id: int


@app.post("/api/watchlist", response_model=Dict[str, Any])
async def add_watchlist_item(request: WatchlistRequest):
    """添加股票到关注列表"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        item = WatchlistService.add_watch(
            symbol=request.symbol,
            name=request.name or "",
            strategy_id=request.strategy_id,
        )

        # 检查是否已存在
        existing_count = WatchlistService.get_watchlist()["total"]
        is_existing = existing_count > 0  # 简化判断

        return {
            "id": item.id,
            "symbol": item.symbol,
            "name": item.name,
            "strategy_id": item.strategy_id,
            "watch_type": item.watch_type,
            "created_at": item.created_at.isoformat() if item.created_at else None,
            "message": "该股票已在关注列表中" if is_existing else None,
        }
    except Exception as e:
        logger.error(f"添加关注失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"添加关注失败: {str(e)}")


@app.delete("/api/watchlist/{item_id}")
async def remove_watchlist_item(item_id: int):
    """取消关注"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        success = WatchlistService.remove_watch(item_id)
        if not success:
            raise HTTPException(status_code=404, detail="关注条目不存在")

        return {"message": "已取消关注", "symbol": None}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取消关注失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"取消关注失败: {str(e)}")


@app.get("/api/watchlist")
async def get_watchlist(
    sort_by: str = Query("created_at", description="排序字段"),
    sort_order: str = Query("desc", description="排序方向"),
    watch_type: Optional[str] = Query(None, description="筛选关注类型"),
):
    """获取关注列表"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        result = WatchlistService.get_watchlist(
            sort_by=sort_by,
            sort_order=sort_order,
            watch_type=watch_type,
        )

        # 转换为响应格式
        data = []
        for entry in result["data"]:
            item = entry["item"]
            # 获取策略名称
            strategy_name = None
            from pytrading.db.mysql import Strategy
            session = WatchlistService._get_session()
            try:
                strategy = session.query(Strategy).filter(Strategy.id == item.strategy_id).first()
                if strategy:
                    strategy_name = strategy.name
            finally:
                session.close()

            data.append({
                "id": item.id,
                "symbol": item.symbol,
                "name": item.name,
                "strategy_id": item.strategy_id,
                "strategy_name": strategy_name,
                "watch_type": item.watch_type,
                "previous_watch_type": item.previous_watch_type,
                "type_changed": item.type_changed,
                "type_changed_at": item.type_changed_at.isoformat() if item.type_changed_at else None,
                "pnl_ratio": entry["pnl_ratio"],
                "sharp_ratio": entry["sharp_ratio"],
                "max_drawdown": entry["max_drawdown"],
                "win_ratio": entry["win_ratio"],
                "current_price": entry["current_price"],
                "last_backtest_task_id": entry["last_backtest_task_id"],
                "last_backtest_time": entry["last_backtest_time"].isoformat() if entry["last_backtest_time"] else None,
                "backtest_start_time": entry["backtest_start_time"].isoformat() if entry["backtest_start_time"] else None,
                "backtest_end_time": entry["backtest_end_time"].isoformat() if entry["backtest_end_time"] else None,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            })

        return {
            "data": data,
            "total": result["total"],
            "type_changed_count": result["type_changed_count"],
        }
    except Exception as e:
        logger.error(f"获取关注列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取关注列表失败: {str(e)}")


@app.get("/api/watchlist/watched-symbols")
async def get_watched_symbols(strategy_id: int = Query(..., description="策略ID")):
    """批量查询已关注的股票代码"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        watched = WatchlistService.get_watchlist_by_symbols(strategy_id)
        return {"watched": watched}
    except Exception as e:
        logger.error(f"批量查询失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量查询失败: {str(e)}")



@app.put("/api/watchlist/{item_id}/read")
async def mark_watchlist_item_read(item_id: int):
    """标记关注类型变化已读"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        item = WatchlistService.mark_as_read(item_id)
        if not item:
            raise HTTPException(status_code=404, detail="关注条目不存在")

        return {
            "id": item.id,
            "type_changed": item.type_changed,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"标记已读失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"标记已读失败: {str(e)}")


@app.post("/api/watchlist/backtest")
async def start_watchlist_backtest():
    """一键回测关注列表中的股票"""
    try:
        from pytrading.service.watchlist_service import WatchlistService

        result = WatchlistService.create_backtest_tasks(source="manual")
        task_ids = result["task_ids"]
        skipped = result["skipped_strategies"]

        if not task_ids and not skipped:
            return {"task_ids": [], "skipped_strategies": [], "message": "关注列表为空，无需回测"}

        parts = []
        if task_ids:
            parts.append(f"已创建 {len(task_ids)} 个回测任务")
        if skipped:
            parts.append(f"跳过 {len(skipped)} 个策略（已有进行中的任务）")

        return {
            "task_ids": task_ids,
            "skipped_strategies": skipped,
            "message": "，".join(parts),
        }
    except Exception as e:
        logger.error(f"一键回测失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"一键回测失败: {str(e)}")


if __name__ == "__main__":
    # 开发模式运行
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
