#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：mysql
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:36 
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, UniqueConstraint, text, Boolean, JSON, Enum as SQLEnum, ForeignKey, DECIMAL, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()


class Strategy(Base):
    """策略表模型"""
    __tablename__ = 'strategies'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='策略ID')
    name = Column(String(50), nullable=False, unique=True, comment='策略代码')
    display_name = Column(String(100), nullable=False, comment='策略显示名称')
    description = Column(Text, comment='策略描述')
    strategy_type = Column(String(50), nullable=False, comment='策略类型')
    parameters = Column(JSON, comment='策略参数配置')
    is_active = Column(Boolean, default=True, comment='是否启用')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')


class StockSymbol(Base):
    """股票池表模型"""
    __tablename__ = 'symbols'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='股票ID')
    symbol = Column(String(20), nullable=False, unique=True, comment='股票代码')
    name = Column(String(100), nullable=False, comment='股票名称')
    market = Column(String(10), default='A', comment='市场类型')
    industry = Column(String(50), comment='所属行业')
    is_active = Column(Boolean, default=True, comment='是否启用')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')


class BacktestTask(Base):
    """回测任务表模型"""
    __tablename__ = 'backtest_tasks'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='任务ID')
    task_id = Column(String(100), nullable=False, unique=True, comment='任务唯一标识')
    strategy_id = Column(Integer, nullable=False, comment='策略ID')
    symbols = Column(JSON, nullable=False, comment='股票代码列表或指数代码')
    start_time = Column(DateTime, nullable=False, comment='回测开始时间')
    end_time = Column(DateTime, nullable=False, comment='回测结束时间')
    status = Column(SQLEnum('pending', 'running', 'completed', 'failed', 'cancelled', name='task_status_enum'), 
                    default='pending', comment='任务状态')
    progress = Column(Integer, default=0, comment='进度百分比')
    parameters = Column(JSON, comment='任务参数(包含mode/index_symbol等配置)')
    result_summary = Column(JSON, comment='结果摘要')
    error_message = Column(Text, comment='错误信息')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')


class BackTestResult(Base):
    """回测结果表模型"""
    __tablename__ = 'backtest_results'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    task_id = Column(String(50), comment='任务ID')
    strategy_id = Column(Integer, comment='策略ID')
    symbol = Column(String(20), nullable=False, comment='股票代码')
    name = Column(String(50), comment='股票名称')
    trending_type = Column(String(50), comment='趋势类型')
    strategy_name = Column(String(50), comment='策略名称')
    backtest_start_time = Column(DateTime, comment='回测开始时间')
    backtest_end_time = Column(DateTime, comment='回测结束时间')
    pnl_ratio = Column(DECIMAL(10, 4), comment='累计收益率')
    sharp_ratio = Column(DECIMAL(10, 4), comment='夏普比率')
    max_drawdown = Column(DECIMAL(10, 4), comment='最大回撤')
    risk_ratio = Column(DECIMAL(10, 4), comment='风险比率')
    open_count = Column(Integer, comment='开仓次数')
    close_count = Column(Integer, comment='平仓次数')
    win_count = Column(Integer, comment='盈利次数')
    lose_count = Column(Integer, comment='亏损次数')
    win_ratio = Column(DECIMAL(6, 4), comment='胜率')
    total_trades = Column(Integer, comment='总交易次数')
    win_trades = Column(Integer, comment='盈利交易次数')
    current_price = Column(DECIMAL(10, 2), comment='当前股价')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    __table_args__ = (
        UniqueConstraint('symbol', 'backtest_start_time', 'backtest_end_time', name='uq_symbol_time'),
    )


class SystemConfig(Base):
    """系统配置表模型"""
    __tablename__ = 'system_config'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='配置ID')
    config_key = Column(String(100), nullable=False, unique=True, comment='配置键')
    config_value = Column(Text, comment='配置值')
    config_type = Column(String(20), default='string', comment='配置类型')
    description = Column(String(200), comment='配置描述')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')


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
