"""
关注类型枚举和 TrendingType 映射函数

功能: 002-stock-watchlist
"""

from enum import Enum
from typing import Optional

from pytrading.config.strategy_enum import TrendingType


class WatchType(Enum):
    """关注列表中的关注类型枚举

    用于用户界面展示的简化趋势状态分类
    """
    NO_STATE = "无状态"      # 无明确趋势方向
    WATCHING = "关注中"     # 出现上涨信号，等待确认
    TREND_UP = "趋势上涨"   # 策略识别到上涨趋势
    TREND_DOWN = "趋势下行" # 策略识别到下行趋势
    TREND_END = "趋势结束"  # 趋势终结，仓位已清

    @classmethod
    def from_trending_type(cls, trending_type: Optional[str], has_close_signal: bool = False) -> "WatchType":
        """从内部 TrendingType 映射到关注类型

        Args:
            trending_type: 内部 TrendingType 枚举值
            has_close_signal: 是否有清仓信号（优先级最高）

        Returns:
            WatchType: 映射后的关注类型

        映射优先级:
            1. has_close_signal=True → TREND_END (清仓信号最高优先级)
            2. TrendingType.Unknown / UpDown → NO_STATE
            3. TrendingType.Observing → WATCHING
            4. TrendingType.RisingUp / ZeroAxisUp → TREND_UP
            5. TrendingType.DeadXDown / FallingDown → TREND_DOWN
        """
        # 清仓信号优先级最高
        if has_close_signal:
            return cls.TREND_END

        # 无效输入处理
        if not trending_type:
            return cls.NO_STATE

        # 映射 TrendingType 到 WatchType (TrendingType 是字符串常量，不是枚举)
        if trending_type in (TrendingType.TrendingUnknown, TrendingType.UpAndDown):
            return cls.NO_STATE
        elif trending_type == TrendingType.Observing:
            return cls.WATCHING
        elif trending_type in (TrendingType.RisingUp, TrendingType.ZeroAxisRisingUp):
            return cls.TREND_UP
        elif trending_type in (TrendingType.DeadXDecliningDown, TrendingType.ContinueDecliningDown):
            return cls.TREND_DOWN
        else:
            return cls.NO_STATE

    def participates_in_change_detection(self) -> bool:
        """判断该关注类型是否参与变化检测

        Returns:
            bool: True 表示参与变化检测
        """
        # "无状态"不参与变化检测
        return self != WatchType.NO_STATE

    @property
    def display_name(self) -> str:
        """获取中文显示名称"""
        return self.value
