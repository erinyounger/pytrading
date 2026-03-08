"""
关注列表服务层

功能: 002-stock-watchlist
提供关注列表的 CRUD 操作、指标更新和关注类型变化检测
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from collections import defaultdict

from sqlalchemy.orm import Session

from pytrading.config.settings import config
from pytrading.config.watch_type import WatchType
from pytrading.db.mysql import WatchlistItem, BackTestResult, TradeRecord, BacktestTask, Strategy
from pytrading.logger import logger


class WatchlistService:
    """关注列表服务类"""

    @staticmethod
    def _get_session() -> Session:
        """获取数据库会话"""
        from pytrading.db.mysql import MySQLClient
        client = MySQLClient(
            host=config.mysql_host,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password,
            db_name=config.mysql_database,
        )
        return client.get_session()

    # ==================== CRUD 操作 ====================

    @classmethod
    def add_watch(
        cls,
        symbol: str,
        name: str,
        strategy_id: int,
    ) -> WatchlistItem:
        """添加股票到关注列表

        Args:
            symbol: 股票代码
            name: 股票名称
            strategy_id: 策略ID

        Returns:
            WatchlistItem: 新增或已存在的关注条目
        """
        session = cls._get_session()
        try:
            # 检查是否已存在（幂等）
            existing = session.query(WatchlistItem).filter(
                WatchlistItem.symbol == symbol,
                WatchlistItem.strategy_id == strategy_id,
            ).first()

            if existing:
                return existing

            # 创建新关注条目
            item = WatchlistItem(
                symbol=symbol,
                name=name,
                strategy_id=strategy_id,
                watch_type=WatchType.NO_STATE.value,
                created_at=datetime.now(),
            )
            session.add(item)
            session.commit()
            session.refresh(item)
            return item
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def remove_watch(cls, item_id: int) -> bool:
        """从关注列表移除

        Args:
            item_id: 关注条目ID

        Returns:
            bool: 是否成功移除
        """
        session = cls._get_session()
        try:
            item = session.query(WatchlistItem).filter(
                WatchlistItem.id == item_id
            ).first()
            if not item:
                return False

            session.delete(item)
            session.commit()
            return True
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def get_watchlist(
        cls,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        watch_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """获取关注列表

        Args:
            sort_by: 排序字段
            sort_order: 排序方向 (asc/desc)
            watch_type: 筛选关注类型

        Returns:
            Dict: 包含 data, total, type_changed_count
        """
        session = cls._get_session()
        try:
            query = session.query(WatchlistItem)

            # 筛选
            if watch_type:
                query = query.filter(WatchlistItem.watch_type == watch_type)

            # 统计有变化的条数
            type_changed_count = query.filter(WatchlistItem.type_changed == True).count()

            # 回测指标字段需要从 BackTestResult JOIN 获取，不支持直接排序
            # 对于指标排序，先获取全部数据再在 Python 中排序
            metrics_sort_fields = {"pnl_ratio", "sharp_ratio", "max_drawdown", "win_ratio"}

            if sort_by not in metrics_sort_fields:
                # 非指标字段直接在数据库排序
                sort_column = getattr(WatchlistItem, sort_by, WatchlistItem.created_at)
                if sort_order == "desc":
                    query = query.order_by(WatchlistItem.type_changed.desc(), sort_column.desc())
                else:
                    query = query.order_by(WatchlistItem.type_changed.desc(), sort_column.asc())

            items = query.all()
            total = len(items)

            # JOIN BackTestResult 获取指标数据
            result_data = []
            for item in items:
                backtest = None
                if item.last_backtest_task_id:
                    backtest = session.query(BackTestResult).filter(
                        BackTestResult.task_id == item.last_backtest_task_id,
                        BackTestResult.symbol == item.symbol,
                    ).first()

                result_data.append({
                    "item": item,
                    "pnl_ratio": float(backtest.pnl_ratio) if backtest and backtest.pnl_ratio else None,
                    "sharp_ratio": float(backtest.sharp_ratio) if backtest and backtest.sharp_ratio else None,
                    "max_drawdown": float(backtest.max_drawdown) if backtest and backtest.max_drawdown else None,
                    "win_ratio": float(backtest.win_ratio) if backtest and backtest.win_ratio else None,
                    "current_price": float(backtest.current_price) if backtest and backtest.current_price else None,
                    "last_backtest_time": backtest.backtest_end_time if backtest else None,
                    "backtest_start_time": backtest.backtest_start_time if backtest else None,
                    "backtest_end_time": backtest.backtest_end_time if backtest else None,
                })

            # 对于指标排序，在 Python 中排序
            if sort_by in metrics_sort_fields:
                reverse = sort_order == "desc"
                result_data.sort(
                    key=lambda x: (
                        not (x["item"].type_changed or False),  # type_changed=True 置顶
                        x[sort_by] if x[sort_by] is not None else float('-inf') if reverse else float('inf'),
                    ),
                    reverse=reverse,
                )

            return {
                "data": result_data,
                "total": total,
                "type_changed_count": type_changed_count,
            }
        finally:
            session.close()

    @classmethod
    def get_watchlist_by_symbols(cls, strategy_id: int) -> List[str]:
        """批量获取已关注的股票代码

        Args:
            strategy_id: 策略ID

        Returns:
            List[str]: 已关注的股票代码列表
        """
        session = cls._get_session()
        try:
            items = session.query(WatchlistItem.symbol).filter(
                WatchlistItem.strategy_id == strategy_id
            ).all()
            return [item.symbol for item in items]
        finally:
            session.close()

    # ==================== 关注类型变化检测 ====================

    @classmethod
    def _check_has_close_signal(cls, session: Session, symbol: str, task_id: str) -> bool:
        """检查是否有清仓信号

        Args:
            session: 数据库会话
            symbol: 股票代码
            task_id: 任务ID

        Returns:
            bool: 是否有清仓信号
        """
        # 查询最新的交易记录，检查最后一条是否是清仓
        record = session.query(TradeRecord).filter(
            TradeRecord.task_id == task_id,
            TradeRecord.symbol == symbol,
        ).order_by(TradeRecord.bar_time.desc()).first()

        return record is not None and record.action == "close"

    @classmethod
    def update_metrics(
        cls,
        item_id: int,
        task_id: str,
    ) -> Optional[WatchlistItem]:
        """从回测结果更新关注条目的关注类型

        指标数据（pnl_ratio 等）直接从 BackTestResult 表读取，不再冗余保存。
        此方法只更新 watch_type、last_backtest_task_id 等状态字段。

        Args:
            item_id: 关注条目ID
            task_id: 回测任务ID

        Returns:
            Optional[WatchlistItem]: 更新后的关注条目
        """
        session = cls._get_session()
        try:
            item = session.query(WatchlistItem).filter(
                WatchlistItem.id == item_id
            ).first()
            if not item:
                return None

            # 获取最新的回测结果
            result = session.query(BackTestResult).filter(
                BackTestResult.task_id == task_id,
                BackTestResult.symbol == item.symbol,
            ).order_by(BackTestResult.backtest_end_time.desc()).first()

            if not result:
                return item

            # 只更新任务关联，不再冗余保存指标
            item.last_backtest_task_id = task_id

            # 计算新的关注类型
            has_close_signal = cls._check_has_close_signal(session, item.symbol, task_id)
            new_watch_type = WatchType.from_trending_type(
                result.trending_type,
                has_close_signal=has_close_signal,
            )

            # 检测关注类型变化
            if new_watch_type.participates_in_change_detection():
                current_watch_type = WatchType(item.watch_type)
                if current_watch_type != new_watch_type and current_watch_type != WatchType.NO_STATE:
                    # 记录变化
                    item.previous_watch_type = item.watch_type
                    item.watch_type = new_watch_type.value
                    item.type_changed = True
                    item.type_changed_at = datetime.now()
                elif current_watch_type == WatchType.NO_STATE:
                    # 从无状态变为有效状态
                    item.watch_type = new_watch_type.value
            else:
                # "无状态"不参与变化，但更新显示值
                item.watch_type = new_watch_type.value

            session.commit()
            session.refresh(item)
            return item
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def mark_as_read(cls, item_id: int) -> Optional[WatchlistItem]:
        """标记关注类型变化为已读

        Args:
            item_id: 关注条目ID

        Returns:
            Optional[WatchlistItem]: 更新后的关注条目
        """
        session = cls._get_session()
        try:
            item = session.query(WatchlistItem).filter(
                WatchlistItem.id == item_id
            ).first()
            if not item:
                return None

            item.type_changed = False
            session.commit()
            session.refresh(item)
            return item
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    # ==================== 一键回测 ====================

    @staticmethod
    def _resolve_start_time(session: Session, item: WatchlistItem) -> str:
        """通过 last_backtest_task_id 查找原回测任务的 start_time

        Args:
            session: 数据库会话
            item: 关注条目

        Returns:
            str: 回测开始时间字符串 (YYYY-MM-DD HH:MM:SS)
        """
        if item.last_backtest_task_id:
            task = session.query(BacktestTask).filter(
                BacktestTask.task_id == item.last_backtest_task_id
            ).first()
            if task and task.start_time:
                return task.start_time.strftime('%Y-%m-%d %H:%M:%S')
        # 回退到全局配置
        return config.start_time

    @classmethod
    def create_backtest_tasks(cls, source: str = "manual") -> Dict[str, Any]:
        """为关注列表创建回测任务

        按 strategy_id 分组，每组创建一个回测任务。
        去重检查：同 strategy_id 已有 pending/running 任务则跳过。

        Args:
            source: 触发来源 ("manual" 或 "scheduled")

        Returns:
            Dict: {"task_ids": [...], "skipped_strategies": [...]}
        """
        session = cls._get_session()
        try:
            # 查全部 watchlist items
            items = session.query(WatchlistItem).all()
            if not items:
                return {"task_ids": [], "skipped_strategies": [], "message": "关注列表为空"}

            # 按 strategy_id 分组
            groups: Dict[int, List[WatchlistItem]] = defaultdict(list)
            for item in items:
                groups[item.strategy_id].append(item)

            task_ids = []
            skipped_strategies = []
            today_end = datetime.now().replace(hour=16, minute=0, second=0, microsecond=0)

            for strategy_id, group_items in groups.items():
                # 查询策略名称
                strategy = session.query(Strategy).filter(
                    Strategy.id == strategy_id
                ).first()
                strategy_name = strategy.name if strategy else f"s{strategy_id}"

                # 去重检查：同 strategy_id 已有 pending/running 任务则跳过
                existing = session.query(BacktestTask).filter(
                    BacktestTask.strategy_id == strategy_id,
                    BacktestTask.status.in_(['pending', 'running']),
                ).first()
                if existing:
                    skipped_strategies.append(strategy_name)
                    logger.info(f"跳过策略 {strategy_name}: 已有 {existing.status} 任务 {existing.task_id}")
                    continue

                # 每组取最早的 start_time
                start_times = [cls._resolve_start_time(session, item) for item in group_items]
                earliest_start = min(start_times)

                # 收集该组所有 symbols
                symbols = [item.symbol for item in group_items]

                # 生成 task_id
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                task_id = f"watchlist_{source}_{strategy_name}_{timestamp}"

                # 创建 BacktestTask
                task = BacktestTask(
                    task_id=task_id,
                    strategy_id=strategy_id,
                    symbols=symbols,
                    start_time=datetime.strptime(earliest_start, '%Y-%m-%d %H:%M:%S'),
                    end_time=today_end,
                    status='pending',
                    progress=0,
                    parameters={
                        "mode": "single",
                        "strategy": strategy_name,
                        "source": f"watchlist_{source}",
                    },
                )
                session.add(task)
                task_ids.append(task_id)
                logger.info(f"创建关注列表回测任务: {task_id}, 股票数: {len(symbols)}")

            session.commit()
            return {
                "task_ids": task_ids,
                "skipped_strategies": skipped_strategies,
            }
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
