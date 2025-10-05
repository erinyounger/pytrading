# -*- coding:utf-8 -*-
import os
import logging
import contextvars

# 可选：数据库日志写入
try:
    from pytrading.config import config
    from pytrading.db.log_repository import LogRepository
except Exception:
    config = None
    LogRepository = None

# 日志上下文（用于DB写入）
_ctx_task_id = contextvars.ContextVar("log_task_id", default=None)
_ctx_symbol = contextvars.ContextVar("log_symbol", default=None)
_ctx_db_enabled = contextvars.ContextVar("log_db_enabled", default=False)

log_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", "logs")
log_file = os.path.join(log_path, "py-trading.log")

if not os.path.exists(log_path):
    os.makedirs(log_path)

logger = logging.getLogger("xtrading")
ch_handler = logging.StreamHandler()
fh_handler = logging.FileHandler(log_file)

formatter = logging.Formatter('[%(asctime)s][%(name)-4s][%(filename)s line:%(lineno)d][%(levelname)-4s][%(thread)d] > %(message)s')
ch_handler.setFormatter(formatter)
fh_handler.setFormatter(formatter)

logger.addHandler(ch_handler)
logger.addHandler(fh_handler)
logger.setLevel(logging.INFO)


class DBLogHandler(logging.Handler):
    """将日志写入 backtest_logs（仅当设置了 task_id 时）"""
    def __init__(self, task_id: str = None, symbol: str = None):
        super().__init__()
        self._repo = None
        self._fixed_task_id = task_id
        self._fixed_symbol = symbol

    def emit(self, record: logging.LogRecord) -> None:
        try:
            # 是否启用DB
            if not _ctx_db_enabled.get():
                # 若显式绑定了 task_id/symbol，也认为启用
                if not self._fixed_task_id and not self._fixed_symbol:
                    return

            task_id = self._fixed_task_id if self._fixed_task_id is not None else _ctx_task_id.get()
            if not task_id:
                return
            symbol = self._fixed_symbol if self._fixed_symbol is not None else _ctx_symbol.get()
            message = record.getMessage()
            level = record.levelname
            if LogRepository is None or config is None:
                return
            if self._repo is None:
                # 使用便捷方法创建（内部创建独立 engine）
                self._repo = LogRepository.from_config(
                    host=getattr(config, 'mysql_host', ''),
                    db_name=getattr(config, 'mysql_database', ''),
                    port=getattr(config, 'mysql_port', 3306),
                    username=getattr(config, 'mysql_username', ''),
                    password=getattr(config, 'mysql_password', ''),
                )
            if symbol:
                self._repo.append_result_log(task_id, symbol, message, level=level)
            else:
                self._repo.append_task_log(task_id, message, level=level)
        except Exception:
            # 避免日志写入失败影响主流程
            pass


def set_log_context(task_id: str = None, symbol: str = None, enable_db: bool = False):
    """设置日志上下文（线程/协程局部）"""
    if task_id is not None:
        _ctx_task_id.set(task_id)
    if symbol is not None:
        _ctx_symbol.set(symbol)
    _ctx_db_enabled.set(bool(enable_db))


def clear_log_context():
    """清理日志上下文"""
    _ctx_task_id.set(None)
    _ctx_symbol.set(None)
    _ctx_db_enabled.set(False)


# 注册数据库日志处理器（最后添加，避免与控制台/文件处理器冲突）
try:
    # 全局不默认写DB，仅当 get_logger/task 上下文显式启用后才写入
    db_handler = DBLogHandler()
    db_handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(db_handler)
except Exception:
    pass


def get_logger(name=None, task_id: str = None, symbol: str = None):
    "获取logger: 默认console/file；当提供task_id或symbol时，同时写入DB"
    base_name = name or "xtrading"
    if task_id or symbol:
        # 设置上下文并启用DB
        set_log_context(task_id=task_id, symbol=symbol, enable_db=True)
    else:
        # 仅console/file
        set_log_context(task_id=None, symbol=None, enable_db=False)
    return logging.getLogger(base_name)