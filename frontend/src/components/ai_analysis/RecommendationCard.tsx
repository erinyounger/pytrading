import React from 'react';
import { Card, Tag, Progress, Tooltip } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { AIAnalysisResult } from '../../services/aiAnalysisApi';

interface RecommendationCardProps {
  analysis: AIAnalysisResult;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ analysis }) => {
  // 推荐颜色映射
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case '买入':
        return '#52c41a';
      case '持有':
        return '#1890ff';
      case '卖出':
        return '#ff4d4f';
      case '观望':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  };

  // 推荐图标
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case '买入':
        return <RiseOutlined />;
      case '持有':
        return <MinusOutlined />;
      case '卖出':
        return <FallOutlined />;
      case '观望':
        return <EyeOutlined />;
      default:
        return null;
    }
  };

  // 风险颜色
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case '高':
        return '#ff4d4f';
      case '中':
        return '#faad14';
      case '低':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // 分数进度条颜色
  const getScoreColor = (score: number, type: 'technical' | 'sentiment' | 'event' | 'news') => {
    if (type === 'sentiment' || type === 'news') {
      // -1 to 1 范围
      if (score > 0.2) return '#52c41a';
      if (score < -0.2) return '#ff4d4f';
      return '#faad14';
    }
    // 0-100 范围
    if (score >= 70) return '#52c41a';
    if (score >= 50) return '#1890ff';
    if (score >= 30) return '#faad14';
    return '#ff4d4f';
  };

  const recommendationColor = getRecommendationColor(analysis.recommendation);

  return (
    <Card size="small" title="AI 推荐" styles={{ body: { padding: 12 } }}>
      {/* 推荐标签 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Tag
          icon={getRecommendationIcon(analysis.recommendation)}
          color={recommendationColor}
          style={{
            fontSize: 16,
            padding: '4px 16px',
            borderRadius: 4,
          }}
        >
          {analysis.recommendation}
        </Tag>
      </div>

      {/* 置信度 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Tooltip title="置信度">
          <Progress
            type="circle"
            percent={Math.round(analysis.confidence * 100)}
            size={80}
            strokeColor={recommendationColor}
            format={(percent) => (
              <span style={{ fontSize: 18, fontWeight: 500 }}>
                {percent}%
              </span>
            )}
          />
        </Tooltip>
      </div>

      {/* 风险等级 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Tag color={getRiskColor(analysis.risk_level)}>
          风险: {analysis.risk_level}
        </Tag>
      </div>

      {/* 分数进度条 */}
      <div style={{ fontSize: 12 }}>
        {/* 技术评分 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>技术面</span>
            <span>{analysis.technical_score.toFixed(1)}</span>
          </div>
          <Progress
            percent={analysis.technical_score}
            showInfo={false}
            strokeColor={getScoreColor(analysis.technical_score, 'technical')}
            size="small"
          />
        </div>

        {/* 情绪评分 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>情绪面</span>
            <span>{analysis.sentiment_score.toFixed(2)}</span>
          </div>
          <Progress
            percent={((analysis.sentiment_score + 1) / 2) * 100}
            showInfo={false}
            strokeColor={getScoreColor(analysis.sentiment_score, 'sentiment')}
            size="small"
          />
        </div>

        {/* 事件评分 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>事件驱动</span>
            <span>{analysis.event_score?.toFixed(2) || '0.00'}</span>
          </div>
          <Progress
            percent={((analysis.event_score || 0) + 1) / 2 * 100}
            showInfo={false}
            strokeColor={getScoreColor(analysis.event_score || 0, 'event')}
            size="small"
          />
        </div>

        {/* 新闻影响 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>新闻舆情</span>
            <span>{analysis.news_impact.toFixed(2)}</span>
          </div>
          <Progress
            percent={((analysis.news_impact + 1) / 2) * 100}
            showInfo={false}
            strokeColor={getScoreColor(analysis.news_impact, 'news')}
            size="small"
          />
        </div>
      </div>

      {/* LLM 见解 */}
      {analysis.llm_insight && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: '#f5f5f5',
            borderRadius: 4,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <strong>AI 见解:</strong>
          <p style={{ margin: '4px 0 0 0' }}>{analysis.llm_insight}</p>
        </div>
      )}
    </Card>
  );
};

export default RecommendationCard;
