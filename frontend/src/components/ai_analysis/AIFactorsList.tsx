import React, { useState } from 'react';
import { List, Tag, Button } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { EventSignal } from '../../services/aiAnalysisApi';

interface AIFactorsListProps {
  factors: EventSignal[];
  maxVisible?: number;
}

const AIFactorsList: React.FC<AIFactorsListProps> = ({
  factors,
  maxVisible = 5,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!factors || factors.length === 0) {
    return (
      <div style={{ color: '#999', fontSize: 12, padding: '8px 0' }}>
        暂无关键因素
      </div>
    );
  }

  // 获取显示的因素列表
  const visibleFactors = expanded ? factors : factors.slice(0, maxVisible);
  const hasMore = factors.length > maxVisible;

  // 因素颜色
  const getFactorColor = (severity: number) => {
    if (severity > 0.3) return '#52c41a';
    if (severity > 0) return '#73d13d';
    if (severity < -0.3) return '#ff4d4f';
    if (severity < 0) return '#ff7875';
    return '#faad14';
  };

  // 因素图标
  const getFactorIcon = (severity: number) => {
    if (severity > 0) return <PlusOutlined style={{ color: '#52c41a' }} />;
    if (severity < 0) return <MinusOutlined style={{ color: '#ff4d4f' }} />;
    return <InfoCircleOutlined style={{ color: '#faad14' }} />;
  };

  // 事件类型文本
  const getEventTypeText = (eventType: string) => {
    const typeMap: Record<string, string> = {
      dividend: '分红',
      repurchase: '回购',
      forecast: '业绩预告',
      announcement: '公告',
      lawsuit: '诉讼',
    };
    return typeMap[eventType] || eventType;
  };

  return (
    <div>
      <List
        size="small"
        dataSource={visibleFactors}
        renderItem={(factor) => (
          <List.Item
            style={{
              padding: '6px 0',
              borderBottom: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%',
              }}
            >
              <div style={{ marginRight: 8, marginTop: 2 }}>
                {getFactorIcon(factor.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag
                    color={getFactorColor(factor.severity)}
                    style={{ fontSize: 10, padding: '0 4px', marginRight: 0 }}
                  >
                    {getEventTypeText(factor.event_type)}
                  </Tag>
                  {factor.date && (
                    <span style={{ fontSize: 10, color: '#999' }}>
                      {factor.date}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>
                  {factor.description}
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />

      {hasMore && (
        <Button
          type="link"
          size="small"
          onClick={() => setExpanded(!expanded)}
          style={{ padding: 0, fontSize: 12, height: 'auto' }}
        >
          {expanded
            ? '收起'
            : `展开更多 (${factors.length - maxVisible} 项)`}
        </Button>
      )}
    </div>
  );
};

export default AIFactorsList;
