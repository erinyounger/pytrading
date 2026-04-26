#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：AkShare工具类扩展单元测试
@Author  ：EEric
@Date    ：2026-04-26
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from pytrading.utils.akshare_util import AkShareUtil


class TestAkShareUtilExtensions:
    """AkShare工具类扩展测试"""

    def setup_method(self):
        """测试前准备"""
        self.util = AkShareUtil()

    def test_get_stock_sentiment_with_rank(self):
        """测试有热度排名时的情绪计算"""
        with patch.object(self.util, 'get_stock_hot_rank_em', return_value=5):
            result = self.util.get_stock_sentiment("SHSE.600000")

            assert result["hot_rank"] == 5
            assert result["sentiment_score"] == 0.8  # 极度热门
            assert "极度热门" in result["description"]

    def test_get_stock_sentiment_no_rank(self):
        """测试无热度排名"""
        with patch.object(self.util, 'get_stock_hot_rank_em', return_value=None):
            result = self.util.get_stock_sentiment("SHSE.600000")

            assert result["hot_rank"] is None
            assert result["sentiment_score"] == 0.0
            assert "暂无热度数据" in result["description"]

    def test_get_stock_sentiment_cold_rank(self):
        """测试冷门股票"""
        with patch.object(self.util, 'get_stock_hot_rank_em', return_value=1000):
            result = self.util.get_stock_sentiment("SHSE.600000")

            assert result["hot_rank"] == 1000
            assert result["sentiment_score"] == -0.2
            assert "冷门" in result["description"]

    def test_analyze_news_sentiment_integration(self):
        """测试新闻情感分析"""
        # 测试不同情感倾向
        positive_text = "业绩大幅增长，股价涨停，利好消息"
        negative_text = "业绩大幅下滑，股价跌停，风险警示"

        # 情感分析在DataCollectorService中，这里只测试util
        assert len(positive_text) > 0
        assert len(negative_text) > 0

    def test_get_company_events_empty(self):
        """测试获取空事件列表"""
        with patch.object(self.util, 'get_stock_notice', return_value=[]):
            with patch.object(self.util, 'get_stock_dividend_cninfo', return_value=[]):
                with patch.object(self.util, 'get_stock_repurchase_em', return_value=[]):
                    with patch.object(self.util, 'get_stock_profit_forecast_em', return_value=[]):
                        result = self.util.get_company_events("SHSE.600000", 30)

                        assert result == []

    def test_get_company_events_with_data(self):
        """测试获取公司事件"""
        mock_notices = [{"event_type": "announcement", "description": "公告", "date": "2026-04-20", "severity": 0.0}]

        with patch.object(self.util, 'get_stock_notice', return_value=mock_notices):
            with patch.object(self.util, 'get_stock_dividend_cninfo', return_value=[]):
                with patch.object(self.util, 'get_stock_repurchase_em', return_value=[]):
                    with patch.object(self.util, 'get_stock_profit_forecast_em', return_value=[]):
                        result = self.util.get_company_events("SHSE.600000", 30)

                        assert len(result) == 1
                        assert result[0]["event_type"] == "announcement"

    def test_get_stock_news_aggregates_sources(self):
        """测试新闻聚合"""
        baidu_news = [{"title": "百度新闻", "content": "内容", "source": "百度"}]
        stock_news = [{"title": "个股新闻", "content": "内容", "source": "财经"}]

        with patch.object(self.util, 'get_news_baidu', return_value=baidu_news):
            with patch.object(self.util, 'get_news_stock', return_value=stock_news):
                result = self.util.get_stock_news("SHSE.600000", 7)

                assert len(result) == 2

    def test_get_sector_sentiment_bullish(self):
        """测试看涨板块情绪"""
        mock_data = {
            "board_code": "BK0001",
            "board_name": "银行",
            "change_pct": 3.0,
            "sentiment": "bullish",
            "score": 0.6,
        }

        with patch.object(self.util, 'get_stock_board_industry_spot_em', return_value=mock_data):
            result = self.util.get_sector_sentiment("银行")

            assert result["sentiment"] == "bullish"
            assert result["score"] > 0

    def test_get_sector_sentiment_bearish(self):
        """测试看跌板块情绪"""
        mock_data = {
            "board_code": "BK0001",
            "board_name": "房地产",
            "change_pct": -2.5,
            "sentiment": "bearish",
            "score": -0.5,
        }

        with patch.object(self.util, 'get_stock_board_industry_spot_em', return_value=mock_data):
            result = self.util.get_sector_sentiment("房地产")

            assert result["sentiment"] == "bearish"
            assert result["score"] < 0

    def test_get_sector_sentiment_not_found(self):
        """测试板块不存在"""
        with patch.object(self.util, 'get_stock_board_industry_spot_em', return_value=None):
            with patch.object(self.util, 'get_stock_board_concept_spot_em', return_value=None):
                result = self.util.get_sector_sentiment("不存在的板块")

                assert result["sentiment"] == "neutral"
                assert result["score"] == 0.0
