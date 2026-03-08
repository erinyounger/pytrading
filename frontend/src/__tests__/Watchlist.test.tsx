import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Watchlist from '../pages/Watchlist';

// Mock antd components
jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    Table: ({ dataSource, loading, columns }: any) => (
      <div data-testid="watchlist-table">
        {loading && <div data-testid="loading">加载中...</div>}
        {dataSource?.map((item: any, index: number) => (
          <div key={index} data-testid={`row-${item.symbol}`}>
            {columns?.map((col: any, i: number) => (
              <span key={i} data-testid={`cell-${col.dataIndex}`}>
                {col.render ? col.render(item[col.dataIndex], item) : item[col.dataIndex]}
              </span>
            ))}
          </div>
        ))}
      </div>
    ),
    Card: ({ children, title }: any) => (
      <div data-testid="card">
        <div data-testid="card-title">{title}</div>
        {children}
      </div>
    ),
    Button: ({ children, onClick, icon }: any) => (
      <button data-testid="button" onClick={onClick}>
        {icon} {children}
      </button>
    ),
    Tag: ({ children, color }: any) => (
      <span data-testid="tag" data-color={color}>{children}</span>
    ),
    Select: ({ value, onChange, children }: any) => (
      <div data-testid="select-container">
        <select data-testid="select" value={value} onChange={(e) => onChange?.(e.target.value)}>
          {children}
        </select>
      </div>
    ),
    Option: ({ children, value }: any) => (
      <option data-testid="option" value={value}>{children}</option>
    ),
    Empty: () => <div data-testid="empty">暂无数据</div>,
    Spin: ({ children }: any) => <div data-testid="spin">{children || '加载中'}</div>,
    Modal: ({ open, onOk, onCancel, title, children }: any) => (
      open ? (
        <div data-testid="modal">
          <div data-testid="modal-title">{title}</div>
          <div data-testid="modal-content">{children}</div>
          <button data-testid="modal-ok" onClick={onOk}>确定</button>
          <button data-testid="modal-cancel" onClick={onCancel}>取消</button>
        </div>
      ) : null
    ),
    message: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    },
  };
});

// Mock icons
jest.mock('@ant-design/icons', () => ({
  ReloadOutlined: () => <span data-testid="icon-reload">⟳</span>,
  DeleteOutlined: () => <span data-testid="icon-delete">🗑</span>,
  EyeOutlined: () => <span data-testid="icon-eye">👁</span>,
  StarFilled: () => <span data-testid="icon-star-filled">★</span>,
  StarOutlined: () => <span data-testid="icon-star-outlined">☆</span>,
}));

// Mock api service
jest.mock('../services/api', () => ({
  apiService: {
    getWatchlist: jest.fn(),
    triggerBacktest: jest.fn(),
    removeFromWatchlist: jest.fn(),
    markWatchAsRead: jest.fn(),
    getStockKline: jest.fn(),
  },
}));

// Mock StockChart component
jest.mock('../components/StockChart', () => {
  return function MockStockChart() {
    return <div data-testid="stock-chart">K线图</div>;
  };
});

const mockApi = require('../services/api').apiService;

describe('Watchlist 页面测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('页面渲染空列表', async () => {
    mockApi.getWatchlist.mockResolvedValue({
      data: [],
      total: 0,
      type_changed_count: 0,
    });

    render(<Watchlist />);

    // 等待异步加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    // 验证空列表显示
    const empty = screen.queryByTestId('empty');
    expect(empty).toBeInTheDocument();
  });

  test('页面渲染数据列表', async () => {
    const mockData = [
      {
        id: 1,
        symbol: 'SHSE.600000',
        name: '浦发银行',
        watch_type: '趋势上涨',
        type_changed: true,
        pnl_ratio: 0.1234,
        created_at: '2024-01-01T00:00:00',
      },
      {
        id: 2,
        symbol: 'SHSE.600036',
        name: '招商银行',
        watch_type: '关注中',
        type_changed: false,
        pnl_ratio: 0.0567,
        created_at: '2024-01-02T00:00:00',
      },
    ];

    mockApi.getWatchlist.mockResolvedValue({
      data: mockData,
      total: 2,
      type_changed_count: 1,
    });

    render(<Watchlist />);

    // 等待异步加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByTestId('row-SHSE.600000')).toBeInTheDocument();
    expect(screen.getByTestId('row-SHSE.600036')).toBeInTheDocument();
  });

  test('页面正常加载数据', async () => {
    const mockData = [
      {
        id: 1,
        symbol: 'SHSE.600000',
        name: '浦发银行',
        watch_type: '趋势上涨',
        type_changed: false,
        pnl_ratio: 0.1234,
        created_at: '2024-01-01T00:00:00',
      },
    ];

    mockApi.getWatchlist.mockResolvedValue({
      data: mockData,
      total: 1,
      type_changed_count: 0,
    });

    render(<Watchlist />);

    // 等待异步加载完成
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(screen.getByTestId('row-SHSE.600000')).toBeInTheDocument();
  });
});
