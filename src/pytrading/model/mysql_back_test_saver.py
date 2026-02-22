#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：MySQL回测数据保存实现
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:50 
"""
import traceback
import enum
from decimal import Decimal
from datetime import datetime

from .back_test_saver import BackTestSaver
from sqlalchemy import or_, func, and_
from pytrading.logger import logger
from pytrading.db.mysql import MySQLClient, BackTestResult
from pytrading.config import config
from pytrading.utils import float_fmt


class MySQLBackTestSaver(BackTestSaver):
    """MySQL回测数据保存实现"""
    
    def __init__(self):
        self.mysql_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        # 自动创建表（如果不存在）
        self.mysql_client.create_tables()
    
    def test_connection(self):
        """测试MySQL数据库连接"""
        try:
            from sqlalchemy import text
            session = self.mysql_client.get_session()
            # 执行简单查询测试连接
            session.execute(text("SELECT 1")).fetchone()
            session.close()
            return True
        except Exception as e:
            logger.error(f"MySQL数据库连接测试失败: {e}")
            raise e
    
    def get_all_results(self, symbol=None, start_date=None, end_date=None,
                        trending_type=None,
                        min_pnl_ratio=None, max_pnl_ratio=None,
                        min_win_ratio=None, max_win_ratio=None,
                        limit=100, page=1, per_page=10,
                        sort_by=None, sort_order='desc'):
        """获取所有回测结果，支持分页、筛选和排序（全部在数据库查询层完成）"""
        logger.info(
            f"从MySQL获取回测结果，参数: symbol={symbol}, trending_type={trending_type},"
            f" pnl[{min_pnl_ratio},{max_pnl_ratio}], win[{min_win_ratio},{max_win_ratio}],"
            f" page={page}, per_page={per_page}, sort_by={sort_by}, sort_order={sort_order}"
        )
        session = self.mysql_client.get_session()
        
        try:
            # 基础查询
            query = session.query(BackTestResult)
            
            # 应用过滤条件
            if symbol:
                # 同时支持股票代码与名称的模糊匹配
                like_expr = f'%{symbol}%'
                query = query.filter(or_(
                    BackTestResult.symbol.like(like_expr),
                    BackTestResult.name.like(like_expr)
                ))
            if start_date:
                query = query.filter(BackTestResult.backtest_start_time >= start_date)
            if end_date:
                query = query.filter(BackTestResult.backtest_end_time <= end_date)
            if trending_type:
                query = query.filter(BackTestResult.trending_type == trending_type)
            # 注意：数据库中存储的 pnl_ratio / win_ratio 通常为小数(0-1)
            if min_pnl_ratio is not None:
                query = query.filter(BackTestResult.pnl_ratio >= (min_pnl_ratio / 100.0))
            if max_pnl_ratio is not None:
                query = query.filter(BackTestResult.pnl_ratio <= (max_pnl_ratio / 100.0))
            if min_win_ratio is not None:
                query = query.filter(BackTestResult.win_ratio >= (min_win_ratio / 100.0))
            if max_win_ratio is not None:
                query = query.filter(BackTestResult.win_ratio <= (max_win_ratio / 100.0))
            
            # 获取总记录数
            total_count = query.count()
            
            # 计算分页参数
            offset = (page - 1) * per_page
            
            # 应用排序
            sort_field_map = {
                'pnl_ratio': BackTestResult.pnl_ratio,
                'win_ratio': BackTestResult.win_ratio,
                'sharp_ratio': BackTestResult.sharp_ratio,
                'max_drawdown': BackTestResult.max_drawdown,
                'created_at': BackTestResult.created_at
            }
            
            if sort_by and sort_by in sort_field_map:
                sort_field = sort_field_map[sort_by]
                if sort_order.lower() == 'asc':
                    query = query.order_by(sort_field.asc())
                else:
                    query = query.order_by(sort_field.desc())
            else:
                # 默认按创建时间倒序
                query = query.order_by(BackTestResult.created_at.desc())
            
            # 应用分页
            query = query.offset(offset).limit(per_page)
            
            results = []
            for row in query.all():
                result_dict = {
                    'id': row.id,
                    'symbol': row.symbol,
                    'name': row.name,
                    # 优先取strategy_name字段，如果没有则回退到none
                    'strategy_name': row.strategy_name if hasattr(row, 'strategy_name') else None,
                    'backtest_start_time': row.backtest_start_time.strftime('%Y-%m-%d %H:%M:%S') if row.backtest_start_time else None,
                    'backtest_end_time': row.backtest_end_time.strftime('%Y-%m-%d %H:%M:%S') if row.backtest_end_time else None,
                    'pnl_ratio': float(row.pnl_ratio) if row.pnl_ratio else 0.0,
                    'sharp_ratio': float(row.sharp_ratio) if row.sharp_ratio else 0.0,
                    'max_drawdown': float(row.max_drawdown) if row.max_drawdown else 0.0,
                    'risk_ratio': float(row.risk_ratio) if row.risk_ratio else 0.0,
                    'open_count': row.open_count or 0,
                    'close_count': row.close_count or 0,
                    'win_count': row.win_count or 0,
                    'lose_count': row.lose_count or 0,
                    'win_ratio': float(row.win_ratio) if row.win_ratio else 0.0,
                    'trending_type': row.trending_type,
                    'current_price': row.current_price,
                    'created_at': row.created_at.strftime('%Y-%m-%d %H:%M:%S') if row.created_at else None,
                }
                results.append(result_dict)
            
            logger.info(f"成功从MySQL获取 {len(results)} 条回测结果，总记录数: {total_count}")
            return {
                'data': results,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            logger.error(f"从MySQL获取回测结果失败: {e}")
            raise e
        finally:
            session.close()
    
    def save(self, backtest_obj):
        """保存回测数据到MySQL"""
        session = self.mysql_client.get_session()
        # 安全的数据类型转换
        safe_data = dict()
        
        try:
            # 获取数据并转换
            data = backtest_obj.to_dict()
            for key, value in data.items():
                if value is None:
                    safe_data[key] = None
                elif isinstance(value, enum.Enum):
                    # 枚举类型转换为其值
                    safe_data[key] = value.value
                elif isinstance(value, (int, str)):
                    safe_data[key] = value
                elif isinstance(value, float):
                    # 转换为Decimal避免精度问题
                    safe_data[key] = Decimal(str(float_fmt(value)))
                elif isinstance(value, datetime):
                    safe_data[key] = value
                else:
                    safe_data[key] = str(value)
            
            # 检查是否已存在相同记录
            existing = session.query(BackTestResult).filter_by(
                symbol=safe_data['symbol'],
                strategy_name=safe_data['strategy_name']
            ).first()
            
            if existing:
                # 更新现有记录
                for key, value in safe_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                existing.updated_at = datetime.now()
            else:
                # 创建新记录
                safe_data['created_at'] = datetime.now()
                safe_data['updated_at'] = datetime.now()
                result = BackTestResult(**safe_data)
                session.add(result)
            logger.info(f"Create/Update backtest record: {safe_data['symbol']}, Task ID: {safe_data['task_id']}")
            
            # 提交事务
            session.commit()
            
        except Exception as e:
            logger.error(f"Save backtest data to MySQL failed: {e}\n, DATA:{safe_data}")
            logger.error(f"Error details: {traceback.format_exc()}")
            session.rollback()
            raise
        finally:
            session.close() 