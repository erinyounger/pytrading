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
from typing import List, Optional
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
from pytrading.db.mysql import MySQLClient, Strategy, StockSymbol, BacktestTask, SystemConfig, BackTestResult
from pytrading.py_trading import PyTrading
from pytrading.logger import logger
from sqlalchemy import func
from gm.api import set_token, get_constituents

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

                for task in pending_tasks:
                    logger.info(f"准备执行任务: {task.task_id}")
                    # 在新线程中执行任务,避免阻塞调度器
                    thread = threading.Thread(target=execute_backtest_task, args=(task.task_id,))
                    thread.daemon = True
                    thread.start()

            session.close()

            # 动态调整检查频率
            # 如果有pending任务，加快检查频率
            if pending_tasks:
                check_count += 1
                # 如果连续3次检查都有任务，则继续快速检查
                if check_count >= 3:
                    # 继续快速检查
                    check_count = 0

        except Exception as e:
            logger.error(f"任务调度器执行出错: {str(e)}")

        # 动态睡眠间隔：如果有pending任务，检查更频繁
        sleep_time = fast_check_interval
        time.sleep(sleep_time)

    logger.info("回测任务调度器停止")

@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    global task_scheduler_running, task_scheduler_thread
    
    logger.info("FastAPI应用启动")
    
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
    min_pnl_ratio: Optional[float] = None,
    max_pnl_ratio: Optional[float] = None,
    min_win_ratio: Optional[float] = None,
    max_win_ratio: Optional[float] = None,
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
                min_pnl_ratio=min_pnl_ratio,
                max_pnl_ratio=max_pnl_ratio,
                min_win_ratio=min_win_ratio,
                max_win_ratio=max_win_ratio,
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
                    "created_at": task.created_at.strftime('%Y-%m-%d %H:%M:%S') if task.created_at else None
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