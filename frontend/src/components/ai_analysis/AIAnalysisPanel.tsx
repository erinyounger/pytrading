import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Spin, message, Empty, Button } from 'antd';
import { aiAnalysisApi, AIAnalysisResult } from '../../services/aiAnalysisApi';
import RecommendationCard from './RecommendationCard';
import MarketSentimentBadge from './MarketSentimentBadge';
import AIFactorsList from './AIFactorsList';

interface AIAnalysisPanelProps {
  symbol: string;
  name?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  symbol,
  name,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [marketSentiment, setMarketSentiment] = useState<any | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      const result = await aiAnalysisApi.getAnalysis(symbol);
      setAnalysis(result);
    } catch (error: any) {
      console.error('获取AI分析失败:', error);
      if (error.response?.status === 404) {
        message.info('暂无该股票的分析数据，请稍后再试');
      } else {
        message.error('获取AI分析失败');
      }
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const fetchMarketSentiment = useCallback(async () => {
    try {
      const result = await aiAnalysisApi.getMarketSentiment();
      setMarketSentiment(result);
    } catch (error) {
      console.error('获取市场情绪失败:', error);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!symbol) return;

    setLoading(true);
    try {
      // 触发批量分析
      const result = await aiAnalysisApi.batchAnalyze([symbol]);
      message.success('分析任务已启动，请在分析完成后刷新');

      // 轮询状态
      const pollStatus = async () => {
        const status = await aiAnalysisApi.getAnalysisStatus(result.task_id);
        if (status.status === 'completed') {
          message.success('分析完成');
          fetchAnalysis();
        } else if (status.status === 'failed') {
          message.error('分析失败: ' + status.error_message);
        } else {
          setTimeout(pollStatus, 2000);
        }
      };

      if (result.status === 'pending') {
        setTimeout(pollStatus, 1000);
      }
    } catch (error: any) {
      console.error('启动分析失败:', error);
      message.error('启动分析失败');
    } finally {
      setLoading(false);
    }
  }, [symbol, fetchAnalysis]);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchAnalysis();
      fetchMarketSentiment();
    }
  }, [isOpen, symbol, fetchAnalysis, fetchMarketSentiment]);

  return (
    <Drawer
      title={
        <div>
          <span>AI 分析 - {symbol}</span>
          {name && <span style={{ color: '#999', marginLeft: 8 }}>({name})</span>}
        </div>
      }
      placement="right"
      width={400}
      open={isOpen}
      onClose={onClose}
      extra={
        <Button type="link" size="small" onClick={handleAnalyze}>
          重新分析
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#999' }}>正在分析...</div>
        </div>
      ) : analysis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 市场情绪 */}
          {marketSentiment && (
            <div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                市场情绪
              </div>
              <MarketSentimentBadge
                sentiment={marketSentiment.sentiment}
                score={marketSentiment.score}
              />
              <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
                {marketSentiment.description}
              </div>
            </div>
          )}

          {/* 推荐卡片 */}
          <RecommendationCard analysis={analysis} />

          {/* 关键因素 */}
          <div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
              关键驱动因素
            </div>
            <AIFactorsList factors={analysis.event_signals || []} />
          </div>

          {/* 分析时间 */}
          <div style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
            分析时间: {analysis.created_at?.replace('T', ' ').substring(0, 19)}
          </div>
        </div>
      ) : (
        <Empty
          description="暂无分析数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="link" onClick={handleAnalyze}>立即分析</Button>
        </Empty>
      )}
    </Drawer>
  );
};

export default AIAnalysisPanel;
