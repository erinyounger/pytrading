#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AkShare工具类 - 获取股票信息和市场数据
@Author  ：EEric
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
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

    # ==================== 情绪数据 ====================

    def get_stock_hot_rank_em(self, symbol: str) -> Optional[int]:
        """获取股票热度排名

        Args:
            symbol: 股票代码

        Returns:
            int: 热度排名，None表示获取失败
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.stock_hot_rank_em()
            if df is None or df.empty:
                return None
            # 查找该股票
            match = df[df['代码'] == code]
            if match.empty:
                return None
            return int(match.iloc[0]['排名'])
        except Exception as e:
            logger.warning(f"获取股票热度排名失败: {symbol}, error: {e}")
            return None

    def get_stock_sentiment(self, symbol: str) -> Dict[str, Any]:
        """获取股票情绪数据

        Args:
            symbol: 股票代码

        Returns:
            Dict包含 hot_rank, sentiment_score, hsgt_flow
        """
        result = {
            "symbol": symbol,
            "hot_rank": None,
            "sentiment_score": 0.0,
            "hsgt_flow": None,
            "description": ""
        }

        try:
            # 获取热度排名
            hot_rank = self.get_stock_hot_rank_em(symbol)
            result["hot_rank"] = hot_rank

            # 根据热度计算情绪评分
            if hot_rank is not None:
                # 排名越靠前，情绪越高
                if hot_rank <= 10:
                    result["sentiment_score"] = 0.8
                    result["description"] = "极度热门"
                elif hot_rank <= 50:
                    result["sentiment_score"] = 0.5
                    result["description"] = "热门"
                elif hot_rank <= 100:
                    result["sentiment_score"] = 0.2
                    result["description"] = "较热门"
                elif hot_rank <= 500:
                    result["sentiment_score"] = 0.0
                    result["description"] = "一般"
                else:
                    result["sentiment_score"] = -0.2
                    result["description"] = "冷门"
            else:
                result["sentiment_score"] = 0.0
                result["description"] = "暂无热度数据"

        except Exception as e:
            logger.warning(f"获取股票情绪数据失败: {symbol}, error: {e}")

        return result

    # ==================== 公司事件数据 ====================

    def get_stock_notice(self, symbol: str, days: int = 30) -> List[Dict[str, Any]]:
        """获取公司公告

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[Dict]: 公告列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            end_date = datetime.now().strftime('%Y%m%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y%m%d')

            df = ak.stock_notice(symbol=code, start_date=start_date, end_date=end_date)
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "event_type": "announcement",
                    "description": str(row.get('公告标题', '')),
                    "date": str(row.get('公告日期', '')),
                    "severity": 0.0,
                })
            return result
        except Exception as e:
            logger.warning(f"获取公司公告失败: {symbol}, error: {e}")
            return []

    def get_stock_dividend_cninfo(self, symbol: str) -> List[Dict[str, Any]]:
        """获取分红数据

        Args:
            symbol: 股票代码

        Returns:
            List[Dict]: 分红列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.stock_dividend_cninfo(symbol=code)
            if df is None or df.empty:
                return []

            result = []
            seen_descriptions = set()  # 去重
            for _, row in df.iterrows():
                # 分红通常被视为正面事件
                desc = row.get('方案', '')
                amount = row.get('分红金额(亿元)', None)
                # 如果方案为空，使用金额作为描述
                if not desc:
                    if amount:
                        desc = f"分红 {amount}亿元"
                    else:
                        # 如果方案和金额都为空，跳过这条记录
                        continue
                # 去重
                if desc in seen_descriptions:
                    continue
                seen_descriptions.add(desc)
                result.append({
                    "event_type": "dividend",
                    "description": desc,
                    "date": str(row.get('除权除息日', '')),
                    "severity": 0.3,
                    "amount": amount,
                })
            return result
        except Exception as e:
            logger.warning(f"获取分红数据失败: {symbol}, error: {e}")
            return []

    def get_stock_repurchase_em(self, symbol: str) -> List[Dict[str, Any]]:
        """获取股票回购数据

        Args:
            symbol: 股票代码

        Returns:
            List[Dict]: 回购列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.stock_repurchase_em()
            if df is None or df.empty:
                return []

            # 筛选该股票
            df = df[df['代码'] == code]
            if df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                # 回购通常被视为正面事件
                result.append({
                    "event_type": "repurchase",
                    "description": f"回购: {row.get('回购简称', '')}",
                    "date": str(row.get('公告日期', '')),
                    "severity": 0.4,
                    "amount": row.get('回购金额(万元)', None),
                })
            return result
        except Exception as e:
            logger.warning(f"获取回购数据失败: {symbol}, error: {e}")
            return []

    def get_stock_profit_forecast_em(self, symbol: str) -> List[Dict[str, Any]]:
        """获取业绩预告/快报

        Args:
            symbol: 股票代码

        Returns:
            List[Dict]: 业绩预告列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.stock_profit_forecast_em(symbol=code)
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                # 根据业绩变化判断正负面
                change = row.get('净利润变动幅度(%)', 0)
                severity = 0.0
                if change > 50:
                    severity = 0.6
                elif change > 20:
                    severity = 0.3
                elif change < -50:
                    severity = -0.6
                elif change < -20:
                    severity = -0.3

                result.append({
                    "event_type": "forecast",
                    "description": f"业绩预告: {row.get('业绩变动', '')}",
                    "date": str(row.get('公告日期', '')),
                    "severity": severity,
                })
            return result
        except Exception as e:
            logger.warning(f"获取业绩预告失败: {symbol}, error: {e}")
            return []

    def get_company_events(self, symbol: str, days: int = 30) -> List[Dict[str, Any]]:
        """获取公司事件汇总

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[Dict]: 事件列表
        """
        events = []

        # 获取公告
        events.extend(self.get_stock_notice(symbol, days))
        # 获取分红
        events.extend(self.get_stock_dividend_cninfo(symbol))
        # 获取回购
        events.extend(self.get_stock_repurchase_em(symbol))
        # 获取业绩预告
        events.extend(self.get_stock_profit_forecast_em(symbol))

        return events

    # ==================== 新闻数据 ====================

    def get_news_baidu(self, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
        """获取百度新闻

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[Dict]: 新闻列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.news_baidu(symbol=code, start_date=(datetime.now() - timedelta(days=days)).strftime('%Y%m%d'))
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "title": str(row.get('标题', '')),
                    "content": str(row.get('摘要', ''))[:200] if row.get('摘要') else None,
                    "url": row.get('链接', None),
                    "publish_date": str(row.get('发布时间', '')),
                    "source": "百度",
                })
            return result
        except Exception as e:
            logger.warning(f"获取百度新闻失败: {symbol}, error: {e}")
            return []

    def get_news_cctv(self) -> List[Dict[str, Any]]:
        """获取央视新闻

        Returns:
            List[Dict]: 新闻列表
        """
        try:
            df = ak.news_cctv()
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "title": str(row.get('标题', '')),
                    "content": str(row.get('内容', ''))[:200] if row.get('内容') else None,
                    "url": None,
                    "publish_date": str(row.get('发布时间', '')),
                    "source": "央视",
                })
            return result
        except Exception as e:
            logger.warning(f"获取央视新闻失败: {e}")
            return []

    def get_news_stock(self, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
        """获取个股新闻

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[Dict]: 新闻列表
        """
        try:
            code = symbol.split('.')[-1] if '.' in symbol else symbol
            df = ak.news_stock(symbol=code)
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "title": str(row.get('新闻标题', '')),
                    "content": str(row.get('新闻内容', ''))[:200] if row.get('新闻内容') else None,
                    "url": row.get('新闻链接', None),
                    "publish_date": str(row.get('发布时间', '')),
                    "source": "财经",
                })
            return result
        except Exception as e:
            logger.warning(f"获取个股新闻失败: {symbol}, error: {e}")
            return []

    def get_stock_news(self, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
        """获取股票新闻汇总

        Args:
            symbol: 股票代码
            days: 获取天数

        Returns:
            List[Dict]: 新闻列表
        """
        news = []
        news.extend(self.get_news_baidu(symbol, days))
        news.extend(self.get_news_stock(symbol, days))
        return news

    # ==================== 板块/行业数据 ====================

    def get_stock_board_industry_name_em(self) -> List[Dict[str, str]]:
        """获取行业板块名称列表

        Returns:
            List[Dict]: 行业板块列表
        """
        try:
            df = ak.stock_board_industry_name_em()
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "board_code": str(row.get('板块代码', '')),
                    "board_name": str(row.get('板块名称', '')),
                })
            return result
        except Exception as e:
            logger.warning(f"获取行业板块名称失败: {e}")
            return []

    def get_stock_board_industry_spot_em(self, board_name: str) -> Optional[Dict[str, Any]]:
        """获取行业板块实时行情

        Args:
            board_name: 板块名称

        Returns:
            Dict: 板块行情数据
        """
        try:
            df = ak.stock_board_industry_spot_em()
            if df is None or df.empty:
                return None

            # 筛选板块
            match = df[df['板块名称'] == board_name]
            if match.empty:
                return None

            row = match.iloc[0]
            change_pct = float(row.get('涨跌幅', 0))

            return {
                "board_code": str(row.get('板块代码', '')),
                "board_name": board_name,
                "change_pct": change_pct,
                "sentiment": "bullish" if change_pct > 1 else "bearish" if change_pct < -1 else "neutral",
                "score": min(max(change_pct / 5, -1), 1) if change_pct else 0.0,  # 归一化到-1,1
                "turnover_rate": row.get('换手率', None),
            }
        except Exception as e:
            logger.warning(f"获取行业板块行情失败: {board_name}, error: {e}")
            return None

    def get_stock_board_concept_name_em(self) -> List[Dict[str, str]]:
        """获取概念板块名称列表

        Returns:
            List[Dict]: 概念板块列表
        """
        try:
            df = ak.stock_board_concept_name_em()
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "board_code": str(row.get('板块代码', '')),
                    "board_name": str(row.get('板块名称', '')),
                })
            return result
        except Exception as e:
            logger.warning(f"获取概念板块名称失败: {e}")
            return []

    def get_stock_board_concept_spot_em(self, board_name: str) -> Optional[Dict[str, Any]]:
        """获取概念板块实时行情

        Args:
            board_name: 板块名称

        Returns:
            Dict: 板块行情数据
        """
        try:
            df = ak.stock_board_concept_spot_em()
            if df is None or df.empty:
                return None

            # 筛选板块
            match = df[df['板块名称'] == board_name]
            if match.empty:
                return None

            row = match.iloc[0]
            change_pct = float(row.get('涨跌幅', 0))

            return {
                "board_code": str(row.get('板块代码', '')),
                "board_name": board_name,
                "change_pct": change_pct,
                "sentiment": "bullish" if change_pct > 1 else "bearish" if change_pct < -1 else "neutral",
                "score": min(max(change_pct / 5, -1), 1) if change_pct else 0.0,
                "lead_stock": row.get('龙头股票', None),
            }
        except Exception as e:
            logger.warning(f"获取概念板块行情失败: {board_name}, error: {e}")
            return None

    def get_industry_data_sw(self) -> List[Dict[str, Any]]:
        """获取申万行业数据

        Returns:
            List[Dict]: 申万行业列表
        """
        try:
            df = ak.stock_industry_sw()
            if df is None or df.empty:
                return []

            result = []
            for _, row in df.iterrows():
                result.append({
                    "industry_code": str(row.get('行业代码', '')),
                    "industry_name": str(row.get('行业名称', '')),
                    "avg_change_pct": row.get('平均涨跌幅', None),
                })
            return result
        except Exception as e:
            logger.warning(f"获取申万行业数据失败: {e}")
            return []

    def get_sector_sentiment(self, board_name: str) -> Dict[str, Any]:
        """获取板块情绪

        Args:
            board_name: 板块名称

        Returns:
            Dict: 情绪数据
        """
        # 尝试行业板块
        spot_data = self.get_stock_board_industry_spot_em(board_name)

        # 如果没有，尝试概念板块
        if not spot_data:
            spot_data = self.get_stock_board_concept_spot_em(board_name)

        if not spot_data:
            return {
                "board_name": board_name,
                "sentiment": "neutral",
                "score": 0.0,
                "description": "暂无数据"
            }

        return {
            "board_name": board_name,
            "sentiment": spot_data.get("sentiment", "neutral"),
            "score": spot_data.get("score", 0.0),
            "change_pct": spot_data.get("change_pct", 0.0),
            "description": f"{board_name} {'上涨' if spot_data.get('change_pct', 0) > 0 else '下跌'}"
        }


akshare_util = AkShareUtil()
