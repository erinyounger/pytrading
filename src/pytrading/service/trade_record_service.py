#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：交易记录服务 - 保存和查询K线图买卖信号
@Author  ：EEric
@Date    ：2026-03-07
"""
from pytrading.db.mysql import MySQLClient, TradeRecord
from pytrading.config.settings import config
from pytrading.logger import logger
from datetime import datetime


class TradeRecordService:
    """交易记录服务"""

    @staticmethod
    def _get_session():
        db_client = MySQLClient(
            host=config.mysql_host,
            db_name=config.mysql_database,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password
        )
        return db_client.get_session()

    @staticmethod
    def save_trade_record(task_id, symbol, action, target_percent, price, volume, signal_type, bar_time):
        """保存交易信号记录"""
        if not config.save_db or not task_id:
            return
        session = TradeRecordService._get_session()
        try:
            record = TradeRecord(
                task_id=task_id,
                symbol=symbol,
                action=action,
                target_percent=target_percent,
                price=price,
                volume=volume,
                signal_type=signal_type,
                bar_time=bar_time if isinstance(bar_time, datetime) else datetime.strptime(str(bar_time), '%Y-%m-%d %H:%M:%S'),
            )
            session.merge(record)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.warning(f"保存交易记录失败: {e}")
        finally:
            session.close()

    @staticmethod
    def get_trade_records(task_id, symbol=None):
        """查询交易信号记录"""
        session = TradeRecordService._get_session()
        try:
            query = session.query(TradeRecord).filter_by(task_id=task_id)
            if symbol:
                query = query.filter_by(symbol=symbol)
            query = query.order_by(TradeRecord.bar_time.asc())
            return query.all()
        finally:
            session.close()
