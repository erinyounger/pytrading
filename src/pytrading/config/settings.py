import os
from pathlib import Path
from typing import Any, Dict, List
from dataclasses import dataclass
from dotenv import load_dotenv
from gm.api import MODE_BACKTEST, MODE_LIVE

# 加载环境变量
load_dotenv()

# 项目根目录
APP_ROOT_DIR = Path(__file__).parent.parent.parent.parent

@dataclass
class Config:
    """统一配置类"""
    # 基础配置
    app_root_dir: Path = APP_ROOT_DIR
    save_db: bool = os.getenv('SAVE_DB', "false").lower() == "true"
    
    # 日志配置
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    log_file: str = str(APP_ROOT_DIR / "logs" / "trading.log")
    
    # 交易配置
    trading_mode: str = os.getenv('TRADING_MODE', 'backtest')
    backtest_strategy_id: str = os.getenv('BACKTEST_STRATEGY_ID')
    backtest_trading_token: str = os.getenv('BACKTEST_TRADING_TOKEN')

    live_strategy_id: str = os.getenv('LIVE_STRATEGY_ID')
    live_trading_token: str = os.getenv('LIVE_TRADING_TOKEN')
    symbols: List[str] = None
    

    def __post_init__(self):
        # 设置交易模式
        self.trading_mode = MODE_LIVE if self.trading_mode == 'live' else MODE_BACKTEST
        # 设置当前策略ID
        self.strategy_id = self.live_strategy_id if self.trading_mode == MODE_LIVE else self.backtest_strategy_id
        # 设置账号ID
        self.token = self.live_trading_token if self.trading_mode == MODE_LIVE else self.backtest_trading_token
        # 设置交易标的
        env_symbols = os.getenv('SYMBOLS', '').strip()
        if env_symbols:
            self.symbols = [s.strip() for s in env_symbols.split(',') if s.strip()]
        elif self.symbols is None:
            self.symbols = """
            SZSE.002459
            SZSE.002920
            """.strip().splitlines()
    
    def __getitem__(self, key: str) -> Any:
        return getattr(self, key)
    
    def get(self, key: str, default: Any = None) -> Any:
        return getattr(self, key, default)
    
    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if not k.startswith('_')}

# 创建全局配置实例
config = Config() 