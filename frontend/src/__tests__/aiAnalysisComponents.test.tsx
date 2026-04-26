import React from 'react';
import { render, screen } from '@testing-library/react';
import RecommendationCard from '../components/ai_analysis/RecommendationCard';
import MarketSentimentBadge from '../components/ai_analysis/MarketSentimentBadge';
import AIFactorsList from '../components/ai_analysis/AIFactorsList';
import { AIAnalysisResult } from '../services/aiAnalysisApi';

// Mock antd components
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    Card: ({ children, title, size }: any) => (
      <div data-testid="card" data-title={title} data-size={size}>
        {children}
      </div>
    ),
    Tag: ({ children, color, icon }: any) => (
      <span data-testid="tag" data-color={color}>
        {icon} {children}
      </span>
    ),
    Progress: ({ percent, strokeColor, format, size }: any) => (
      <div data-testid="progress" data-percent={percent} data-color={strokeColor}>
        {format?.(percent)}
      </div>
    ),
    Tooltip: ({ children, title }: any) => (
      <div data-testid="tooltip" data-title={title}>
        {children}
      </div>
    ),
    List: ({ dataSource, renderItem }: any) => (
      <div data-testid="list">
        {dataSource?.map((item: any, index: number) => (
          <div key={index} data-testid="list-item">
            {renderItem(item)}
          </div>
        ))}
      </div>
    ),
    Button: ({ children, onClick, icon, type }: any) => (
      <button data-testid="button" onClick={onClick} data-type={type}>
        {icon} {children}
      </button>
    ),
  };
});

// Mock icons
jest.mock('@ant-design/icons', () => ({
  RiseOutlined: () => <span data-testid="icon-rise">↑</span>,
  FallOutlined: () => <span data-testid="icon-fall">↓</span>,
  HoldOutlined: () => <span data-testid="icon-hold">-</span>,
  EyeOutlined: () => <span data-testid="icon-eye">👁</span>,
  PlusOutlined: () => <span data-testid="icon-plus">+</span>,
  MinusOutlined: () => <span data-testid="icon-minus">-</span>,
  InfoCircleOutlined: () => <span data-testid="icon-info">i</span>,
}));

describe('RecommendationCard 组件测试', () => {
  const mockAnalysis: AIAnalysisResult = {
    id: 1,
    symbol: 'SHSE.600000',
    recommendation: '买入',
    confidence: 0.85,
    sentiment_score: 0.3,
    technical_score: 75.0,
    event_signals: [
      {
        event_type: 'dividend',
        description: '分红公告',
        severity: 0.3,
        date: '2026-04-20',
      },
    ],
    news_impact: 0.2,
    risk_level: '中',
    analysis_date: '2026-04-26',
    created_at: '2026-04-26T10:00:00',
    llm_insight: '建议关注该股票',
  };

  test('渲染推荐卡片', () => {
    render(<RecommendationCard analysis={mockAnalysis} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  test('显示正确的推荐类型', () => {
    render(<RecommendationCard analysis={mockAnalysis} />);
    expect(screen.getByText('买入')).toBeInTheDocument();
  });

  test('显示置信度', () => {
    render(<RecommendationCard analysis={mockAnalysis} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('显示风险等级', () => {
    render(<RecommendationCard analysis={mockAnalysis} />);
    expect(screen.getByText('风险: 中')).toBeInTheDocument();
  });
});

describe('MarketSentimentBadge 组件测试', () => {
  test('渲染看涨标签', () => {
    render(<MarketSentimentBadge sentiment="bullish" score={0.6} />);
    expect(screen.getByTestId('tag')).toBeInTheDocument();
    expect(screen.getByText('看涨')).toBeInTheDocument();
  });

  test('渲染看跌标签', () => {
    render(<MarketSentimentBadge sentiment="bearish" score={-0.4} />);
    expect(screen.getByText('看跌')).toBeInTheDocument();
  });

  test('渲染中性标签', () => {
    render(<MarketSentimentBadge sentiment="neutral" score={0.0} />);
    expect(screen.getByText('中性')).toBeInTheDocument();
  });

  test('显示板块名称', () => {
    render(<MarketSentimentBadge sentiment="bullish" score={0.5} sectorName="银行" />);
    expect(screen.getByText(/银行/)).toBeInTheDocument();
  });
});

describe('AIFactorsList 组件测试', () => {
  const mockFactors = [
    {
      event_type: 'dividend',
      description: '分红公告',
      severity: 0.3,
      date: '2026-04-20',
    },
    {
      event_type: 'repurchase',
      description: '股份回购',
      severity: 0.4,
      date: '2026-04-15',
    },
    {
      event_type: 'lawsuit',
      description: '诉讼风险',
      severity: -0.5,
      date: '2026-04-10',
    },
  ];

  test('渲染空列表', () => {
    render(<AIFactorsList factors={[]} />);
    expect(screen.getByText('暂无关键因素')).toBeInTheDocument();
  });

  test('渲染因素列表', () => {
    render(<AIFactorsList factors={mockFactors} />);
    expect(screen.getByText('分红公告')).toBeInTheDocument();
    expect(screen.getByText('股份回购')).toBeInTheDocument();
  });

  test('显示正面因素图标', () => {
    render(<AIFactorsList factors={mockFactors} />);
    expect(screen.getByTestId('icon-plus')).toBeInTheDocument();
  });

  test('显示负面因素图标', () => {
    render(<AIFactorsList factors={mockFactors} />);
    expect(screen.getByTestId('icon-minus')).toBeInTheDocument();
  });

  test('限制显示数量', () => {
    render(<AIFactorsList factors={mockFactors} maxVisible={2} />);
    expect(screen.getByText('展开更多')).toBeInTheDocument();
  });
});
