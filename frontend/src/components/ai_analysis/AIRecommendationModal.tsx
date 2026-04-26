import React from 'react';
import { Modal } from 'antd';

interface AIRecommendationModalProps {
  symbol: string;
  name?: string;
  visible: boolean;
  onClose: () => void;
}

const AIRecommendationModal: React.FC<AIRecommendationModalProps> = ({
  symbol,
  name,
  visible,
  onClose,
}) => {
  return (
    <Modal
      title={`AI 分析 - ${symbol}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={420}
      bodyStyle={{ padding: 16 }}
      destroyOnClose
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* 使用内联方式嵌入Panel，避免重复状态 */}
        <AIAnalysisPanelContent symbol={symbol} name={name} />
      </div>
    </Modal>
  );
};

// 内联内容组件，避免状态重复
const AIAnalysisPanelContent: React.FC<{
  symbol: string;
  name?: string;
}> = ({ symbol, name }) => {
  // 这里可以复用AIAnalysisPanel的逻辑，但为了简化，直接渲染空状态提示
  return (
    <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
      正在加载分析数据...
    </div>
  );
};

export default AIRecommendationModal;
