import React from 'react';
import { Tag } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
} from '@ant-design/icons';

interface MarketSentimentBadgeProps {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  sectorName?: string;
}

const MarketSentimentBadge: React.FC<MarketSentimentBadgeProps> = ({
  sentiment,
  score,
  sectorName,
}) => {
  // 情绪颜色
  const getSentimentColor = () => {
    switch (sentiment) {
      case 'bullish':
        return '#52c41a';
      case 'bearish':
        return '#ff4d4f';
      case 'neutral':
        return '#faad14';
      default:
        return '#d9d9d9';
    }
  };

  // 情绪图标
  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'bullish':
        return <RiseOutlined />;
      case 'bearish':
        return <FallOutlined />;
      case 'neutral':
        return <MinusOutlined />;
      default:
        return null;
    }
  };

  // 情绪文本
  const getSentimentText = () => {
    switch (sentiment) {
      case 'bullish':
        return '看涨';
      case 'bearish':
        return '看跌';
      case 'neutral':
        return '中性';
      default:
        return '未知';
    }
  };

  const color = getSentimentColor();

  return (
    <Tag
      icon={getSentimentIcon()}
      color={color}
      style={{
        fontSize: 12,
        padding: '2px 8px',
      }}
    >
      {sectorName && `${sectorName}: `}
      {getSentimentText()}
      {score !== undefined && ` (${(score * 100).toFixed(0)}%)`}
    </Tag>
  );
};

export default MarketSentimentBadge;
