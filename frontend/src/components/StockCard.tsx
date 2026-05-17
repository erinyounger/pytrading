import React, { useEffect, useState } from 'react';
import { Card, Tag, Spin, Empty } from 'antd';
import { TagOutlined } from '@ant-design/icons';
import { darkTheme } from '../styles/darkTheme';
import { stockApi, StockInfo } from '../api/stock';

interface StockCardProps {
  symbol: string;
  name?: string;
  currentPrice?: number;
  pnlRatio?: number;
}

/**
 * 股票信息卡片组件
 * 显示行业分类和概念板块标签
 */
const StockCard: React.FC<StockCardProps> = ({ symbol, name, currentPrice, pnlRatio }) => {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const info = await stockApi.getStockInfo(symbol);
        setStockInfo(info);
      } catch (err) {
        console.error('Failed to fetch stock info:', err);
        setError('获取股票信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStockInfo();
  }, [symbol]);

  // 渲染行业分类标签
  const renderIndustryTag = () => {
    if (!stockInfo?.industry_sw) return null;

    return (
      <div style={{ marginBottom: 8 }}>
        <TagOutlined style={{ marginRight: 6, color: darkTheme.textSecondary }} />
        <span style={{ color: darkTheme.textSecondary, fontSize: 12 }}>行业:</span>
        <Tag
          color="blue"
          style={{ marginLeft: 6 }}
        >
          {stockInfo.industry_sw}
        </Tag>
      </div>
    );
  };

  // 渲染概念板块标签组
  const renderConceptBoards = () => {
    if (!stockInfo?.concept_boards || stockInfo.concept_boards.length === 0) return null;

    // 限制显示数量，避免过多标签
    const maxDisplay = 5;
    const displayBoards = stockInfo.concept_boards.slice(0, maxDisplay);
    const remainingCount = stockInfo.concept_boards.length - maxDisplay;

    return (
      <div style={{ marginTop: 8 }}>
        <span style={{ color: darkTheme.textSecondary, fontSize: 12 }}>概念:</span>
        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {displayBoards.map((board, index) => (
            <Tag
              key={index}
              color="cyan"
              style={{ marginRight: 0 }}
            >
              {board}
            </Tag>
          ))}
          {remainingCount > 0 && (
            <Tag color="default">+{remainingCount}</Tag>
          )}
        </div>
      </div>
    );
  };

  // 渲染价格信息
  const renderPriceInfo = () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {currentPrice !== undefined && (
          <span style={{ fontSize: 18, fontWeight: 500, color: darkTheme.textPrimary }}>
            {currentPrice.toFixed(2)}
          </span>
        )}
        {pnlRatio !== undefined && (
          <Tag color={pnlRatio >= 0 ? 'red' : 'green'}>
            {pnlRatio >= 0 ? '+' : ''}{pnlRatio.toFixed(2)}%
          </Tag>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card
        size="small"
        style={{ background: darkTheme.cardBackground, border: `1px solid ${darkTheme.border}` }}
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="small" />
        </div>
      </Card>
    );
  }

  if (error || !stockInfo) {
    return (
      <Card
        size="small"
        title={<span style={{ color: darkTheme.textPrimary }}>{name || symbol}</span>}
        style={{ background: darkTheme.cardBackground, border: `1px solid ${darkTheme.border}` }}
      >
        <Empty description={error || '暂无数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <span style={{ color: darkTheme.textPrimary }}>
          {stockInfo.name || name || symbol}
          <span style={{ color: darkTheme.textSecondary, fontSize: 12, marginLeft: 8 }}>
            {stockInfo.symbol}
          </span>
        </span>
      }
      styles={{
        body: { padding: 12, background: darkTheme.cardBackgroundAlt },
        header: { background: darkTheme.cardBackground, borderBottom: `1px solid ${darkTheme.border}` }
      }}
      style={{ background: darkTheme.cardBackground, border: `1px solid ${darkTheme.border}` }}
    >
      {renderPriceInfo()}
      {renderIndustryTag()}
      {renderConceptBoards()}
    </Card>
  );
};

export default StockCard;
