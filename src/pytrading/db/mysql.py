#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：mysql
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:36 
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, UniqueConstraint, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()


class BackTestResult(Base):
    """回测结果表模型"""
    __tablename__ = 'backtest_results'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    name = Column(String(50))
    strategy_name = Column(String(50))  # 添加策略名称字段
    trending_type = Column(String(50))
    backtest_start_time = Column(DateTime)
    backtest_end_time = Column(DateTime)
    pnl_ratio = Column(Float)
    sharp_ratio = Column(Float)
    max_drawdown = Column(Float)
    risk_ratio = Column(Float)
    open_count = Column(Integer)
    close_count = Column(Integer)
    win_count = Column(Integer)
    lose_count = Column(Integer)
    win_ratio = Column(Float)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    current_price = Column(Float)
    
    __table_args__ = (
        UniqueConstraint('symbol', 'backtest_start_time', 'backtest_end_time', name='uq_symbol_time'),
    )


class MySQLClient:
    def __init__(self, host, db_name, port=3306, username="", password=""):
        self.host = host
        self.db_name = db_name
        self.port = port
        # 使用 PyMySQL 驱动替代 mysql-connector-python
        self.engine = create_engine(
            f"mysql+pymysql://{username}:{password}@{self.host}:{self.port}/{self.db_name}?charset=utf8mb4",
            # 添加连接池配置
            pool_size=10,
            max_overflow=20,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False
        )
        self.Session = sessionmaker(bind=self.engine)
        
    def create_tables(self):
        """创建数据表"""
        Base.metadata.create_all(self.engine)
        
    def get_session(self):
        """获取数据库会话"""
        return self.Session()
    
    def test_connection(self):
        """测试数据库连接"""
        try:
            with self.engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                return True
        except Exception as e:
            print(f"连接测试失败: {e}")
            return False
