#!/usr/bin/env python 
# -*- coding:utf-8 -*-
"""
@Description    ：回测日志仓储层
@Author  ：Claude
@Date    ：2025-10-05
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from typing import Optional, List, Dict, Union


class LogRepository:
    """回测日志仓储，负责 backtest_logs 表的增删查"""
    
    def __init__(self, db_client=None, engine=None):
        """
        初始化日志仓储
        Args:
            db_client: MySQLClient 实例（优先使用，复用其 engine）
            engine: SQLAlchemy Engine 实例（次选）
        """
        if db_client is not None:
            # 复用 MySQLClient 的 engine 和 Session
            self.engine = db_client.engine
            self.Session = db_client.Session
        elif engine is not None:
            self.engine = engine
            self.Session = sessionmaker(bind=self.engine)
        else:
            raise ValueError("必须提供 db_client 或 engine 参数")
    
    @classmethod
    def from_config(cls, host: str, db_name: str, port: int = 3306, username: str = "", password: str = ""):
        """从配置创建独立实例（不推荐，建议复用 MySQLClient）"""
        engine = create_engine(
            f"mysql+pymysql://{username}:{password}@{host}:{port}/{db_name}?charset=utf8mb4",
            pool_size=5,
            max_overflow=10,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False
        )
        return cls(engine=engine)
    
    def append_log(self, task_id: str, message: str, level: str = 'INFO', symbol: Optional[str] = None) -> Optional[int]:
        """追加一条日志到 backtest_logs"""
        from pytrading.db.mysql import BacktestLog
        session = self.Session()
        try:
            log = BacktestLog(task_id=task_id, symbol=symbol, level=level, message=message)
            session.add(log)
            session.commit()
            return log.id
        except Exception as e:
            session.rollback()
            print(f"追加日志失败: {e}")
            return None
        finally:
            session.close()
    
    def append_task_log(self, task_id: str, message: str, level: str = 'INFO') -> Optional[int]:
        """追加任务级日志"""
        return self.append_log(task_id=task_id, message=message, level=level, symbol=None)
    
    def append_result_log(self, task_id: str, symbol: str, message: str, level: str = 'INFO') -> Optional[int]:
        """追加个股级日志"""
        return self.append_log(task_id=task_id, message=message, level=level, symbol=symbol)
    
    def query_logs(self, task_id: str, symbol: Optional[str] = None, after_id: int = 0, limit: int = 500) -> Dict:
        """按 task_id(+symbol) 增量拉取日志"""
        from pytrading.db.mysql import BacktestLog
        session = self.Session()
        try:
            q = session.query(BacktestLog).filter(BacktestLog.task_id == task_id)
            if symbol:
                q = q.filter(BacktestLog.symbol == symbol)
            else:
                q = q.filter(BacktestLog.symbol.is_(None))
            if after_id:
                q = q.filter(BacktestLog.id > after_id)
            rows = q.order_by(BacktestLog.id.asc()).limit(limit).all()
            items = []
            last_id = after_id
            for r in rows:
                items.append({
                    "id": r.id,
                    "task_id": r.task_id,
                    "symbol": r.symbol,
                    "level": r.level,
                    "message": r.message,
                    "created_at": r.created_at.strftime('%Y-%m-%d %H:%M:%S') if r.created_at else None
                })
                last_id = r.id
            return {"items": items, "last_id": last_id}
        finally:
            session.close()
