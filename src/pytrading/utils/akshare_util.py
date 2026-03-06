#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AkShare工具类 - 获取股票信息
@Author  ：EEric
"""
import akshare as ak
from pytrading.logger import logger


class AkShareUtil:
    """AkShare数据工具类"""

    def get_stock_individual_info(self, symbol: str) -> dict:
        """获取个股基本信息"""
        try:
            # 转换代码格式: SHSE.600000 -> 600000
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.stock_individual_info_em(symbol=code)
            if df is None or df.empty:
                return {}
            # 转换为字典
            result = {}
            for _, row in df.iterrows():
                result[row['item']] = row['value']
            return result
        except Exception as e:
            logger.warning(f"AkShare获取个股信息失败: {symbol}, error: {e}")
            return {}


akshare_util = AkShareUtil()
