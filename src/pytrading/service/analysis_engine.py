#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：分析引擎 - 协调各分析器生成AI分析结果
@Author  ：EEric
@Date    ：2026-04-26
"""
import asyncio
from typing import Dict, Any, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from pytrading.logger import logger
from pytrading.db.mysql import AIAnalysisResult, MySQLClient
from pytrading.config.settings import config
from pytrading.service.technical_analyzer import TechnicalAnalyzer
from pytrading.service.sentiment_analyzer import SentimentAnalyzer
from pytrading.service.event_processor import EventProcessor
from pytrading.service.news_analyzer import NewsImpactAnalyzer
from pytrading.service.recommendation_scorer import RecommendationScorer
from pytrading.service.llm_service import llm_service
from pytrading.schemas.ai_analysis import EventSignal


class AnalysisEngine:
    """分析引擎 - 协调各分析器完成股票分析"""

    def __init__(self, db_session: Optional[Session] = None):
        self.db_session = db_session
        self.technical_analyzer = TechnicalAnalyzer(db_session)
        self.sentiment_analyzer = SentimentAnalyzer()
        self.event_processor = EventProcessor()
        self.news_analyzer = NewsImpactAnalyzer()
        self.recommendation_scorer = RecommendationScorer()

    def _get_db_session(self) -> Session:
        """获取数据库会话"""
        if self.db_session:
            return self.db_session

        client = MySQLClient(
            host=config.mysql_host,
            port=config.mysql_port,
            username=config.mysql_username,
            password=config.mysql_password,
            db_name=config.mysql_database,
        )
        return client.get_session()

    async def analyze_stock(
        self,
        symbol: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        use_llm: bool = True,
    ) -> AIAnalysisResult:
        """分析单只股票

        Args:
            symbol: 股票代码
            start_date: 分析开始日期
            end_date: 分析结束日期
            use_llm: 是否使用LLM增强

        Returns:
            AIAnalysisResult: 分析结果
        """
        import time
        start_time = time.time()
        try:
            logger.info(f"========================================")
            logger.info(f"[AI分析] 开始分析股票: {symbol}")
            logger.info(f"[AI分析] 参数: start_date={start_date}, end_date={end_date}, use_llm={use_llm}")

            # 并行执行各维度分析
            logger.info(f"[AI分析] {symbol} 启动并行分析...")
            technical_task = asyncio.create_task(
                self._analyze_technical(symbol)
            )
            sentiment_task = asyncio.create_task(
                self._analyze_sentiment(symbol)
            )
            event_task = asyncio.create_task(
                self._analyze_events(symbol, start_date, end_date)
            )
            news_task = asyncio.create_task(
                self._analyze_news(symbol)
            )

            # 等待所有分析完成
            logger.info(f"[AI分析] {symbol} 等待各维度分析完成...")
            technical_data, sentiment_data, event_data, news_data = await asyncio.gather(
                technical_task, sentiment_task, event_task, news_task
            )
            logger.info(f"[AI分析] {symbol} 各维度分析完成:")
            logger.info(f"  - 技术评分: {technical_data.get('technical_score', 'N/A')}")
            logger.info(f"  - 情绪评分: {sentiment_data.get('sentiment_score', 'N/A')}")
            logger.info(f"  - 事件评分: {event_data.get('event_score', 'N/A')}")
            logger.info(f"  - 新闻影响: {news_data.get('news_impact', 'N/A')}")

            # 综合评分
            logger.info(f"[AI分析] {symbol} 计算综合评分...")
            scoring_result = self.recommendation_scorer.score(
                technical_data, sentiment_data, event_data, news_data
            )
            logger.info(f"[AI分析] {symbol} 综合评分结果:")
            logger.info(f"  - 综合评分: {scoring_result.get('composite_score', 'N/A')}")
            logger.info(f"  - 推荐操作: {scoring_result.get('recommendation', 'N/A')}")
            logger.info(f"  - 置信度: {scoring_result.get('confidence', 'N/A')}")
            logger.info(f"  - 风险等级: {scoring_result.get('risk_level', 'N/A')}")

            # LLM增强
            llm_insight = None
            if use_llm:
                try:
                    logger.info(f"[AI分析] {symbol} 调用LLM生成投资见解...")
                    analysis_data = {
                        "recommendation": scoring_result["recommendation"],
                        "confidence": scoring_result["confidence"],
                        "technical_score": scoring_result["technical_score"],
                        "sentiment_score": scoring_result["sentiment_score"],
                        "event_signals": event_data.get("event_signals", []),
                        "news_impact": scoring_result["news_impact"],
                        "risk_level": scoring_result["risk_level"],
                    }
                    llm_insight = await llm_service.generate_insight(symbol, analysis_data)
                    logger.info(f"[AI分析] {symbol} LLM见解生成完成, 长度: {len(llm_insight) if llm_insight else 0} 字符")
                except Exception as e:
                    logger.warning(f"[AI分析] {symbol} LLM增强失败: {e}")

            # 构建事件信号列表
            event_signals = []
            for event in event_data.get("event_signals", []):
                event_signals.append({
                    "event_type": event.event_type,
                    "description": event.description,
                    "severity": event.severity,
                    "date": event.date,
                })

            # 保存到数据库
            logger.info(f"[AI分析] {symbol} 保存分析结果到数据库...")
            result = await self._save_result(
                symbol=symbol,
                scoring_result=scoring_result,
                event_signals=event_signals,
                llm_insight=llm_insight,
                analysis_date=end_date or date.today(),
            )

            elapsed = time.time() - start_time
            logger.info(f"[AI分析] {symbol} 分析完成! 耗时: {elapsed:.2f}秒")
            logger.info(f"[AI分析] 最终结果: recommendation={scoring_result['recommendation']}, confidence={scoring_result['confidence']:.1%}")
            logger.info(f"========================================")
            return result

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[AI分析] {symbol} 分析失败! 耗时: {elapsed:.2f}秒, error: {e}")
            raise

    async def _analyze_technical(self, symbol: str) -> Dict[str, Any]:
        """技术分析"""
        try:
            # 如果有数据库会话，使用会话
            if self.db_session:
                self.technical_analyzer.db_session = self.db_session

            result = self.technical_analyzer.get_technical_score(symbol)
            return result
        except Exception as e:
            logger.error(f"技术分析失败: {symbol}, error: {e}")
            return {"technical_score": 50.0}

    async def _analyze_sentiment(self, symbol: str) -> Dict[str, Any]:
        """情绪分析"""
        try:
            result = await self.sentiment_analyzer.analyze_sentiment(symbol)
            return result
        except Exception as e:
            logger.error(f"情绪分析失败: {symbol}, error: {e}")
            return {"sentiment_score": 0.0}

    async def _analyze_events(
        self,
        symbol: str,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> Dict[str, Any]:
        """事件分析"""
        try:
            days = 30
            if start_date and end_date:
                days = (end_date - start_date).days

            result = self.event_processor.process_events(symbol, days)
            return result
        except Exception as e:
            logger.error(f"事件分析失败: {symbol}, error: {e}")
            return {"event_score": 0.0, "event_signals": []}

    async def _analyze_news(self, symbol: str) -> Dict[str, Any]:
        """新闻分析"""
        try:
            result = self.news_analyzer.analyze_news(symbol, 7)
            return result
        except Exception as e:
            logger.error(f"新闻分析失败: {symbol}, error: {e}")
            return {"news_impact": 0.0, "news_items": []}

    async def _save_result(
        self,
        symbol: str,
        scoring_result: Dict[str, Any],
        event_signals: list,
        llm_insight: Optional[str],
        analysis_date: date,
    ) -> AIAnalysisResult:
        """保存分析结果"""
        session = self._get_db_session()
        try:
            result = AIAnalysisResult(
                symbol=symbol,
                recommendation=scoring_result["recommendation"],
                confidence=scoring_result["confidence"],
                sentiment_score=scoring_result["sentiment_score"],
                technical_score=scoring_result["technical_score"],
                event_signals=event_signals,
                news_impact=scoring_result["news_impact"],
                risk_level=scoring_result["risk_level"],
                analysis_date=analysis_date,
                llm_insight=llm_insight,
            )
            session.add(result)
            session.commit()
            session.refresh(result)
            return result
        except Exception as e:
            session.rollback()
            logger.error(f"保存分析结果失败: {e}")
            raise
        finally:
            if not self.db_session:
                session.close()

    def get_analysis_result(
        self,
        symbol: str,
        analysis_date: Optional[date] = None,
    ) -> Optional[AIAnalysisResult]:
        """获取已有分析结果

        Args:
            symbol: 股票代码
            analysis_date: 分析日期

        Returns:
            Optional[AIAnalysisResult]: 分析结果
        """
        session = self._get_db_session()
        try:
            query = session.query(AIAnalysisResult).filter(
                AIAnalysisResult.symbol == symbol
            )

            if analysis_date:
                query = query.filter(AIAnalysisResult.analysis_date == analysis_date)
            else:
                query = query.order_by(AIAnalysisResult.analysis_date.desc())

            return query.first()
        finally:
            if not self.db_session:
                session.close()


# 全局实例（需要时可创建带会话的实例）
analysis_engine = AnalysisEngine()
