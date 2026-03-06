import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock react-router-dom: BrowserRouter → MemoryRouter, 忽略 future 属性
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter>{children}</actual.MemoryRouter>
    ),
  };
});

// Mock antd Sider 响应式断点 hook, 避免 matchMedia 兼容性问题
jest.mock('antd/lib/grid/hooks/useBreakpoint', () => ({
  __esModule: true,
  default: () => ({}),
}));

// Mock 所有页面组件, 避免加载真实组件和 API 调用
jest.mock('../pages/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard-page">仪表板内容</div>;
  };
});

jest.mock('../pages/BacktestResults', () => {
  return function MockBacktestResults() {
    return <div data-testid="backtest-results-page">回测结果内容</div>;
  };
});

jest.mock('../pages/BacktestManager', () => {
  return function MockBacktestManager() {
    return <div data-testid="backtest-manager-page">回测管理内容</div>;
  };
});

jest.mock('../pages/Settings', () => {
  return function MockSettings() {
    return <div data-testid="settings-page">系统设置内容</div>;
  };
});

// Mock darkTheme
jest.mock('../styles/darkTheme', () => ({
  darkTheme: {
    cardBackground: '#1f1f1f',
    textPrimary: '#ffffff',
    textSecondary: '#999999',
    border: '#333333',
    accent: '#1890ff',
  },
  globalDarkStyles: '',
}));

// Mock index.css
jest.mock('../index.css', () => ({}));

import App from '../App';

describe('App', () => {
  it('应该渲染不崩溃', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
    expect(screen.getByText('量化交易系统')).toBeInTheDocument();
  });

  it('应该显示导航菜单项', () => {
    render(<App />);

    expect(screen.getByText('仪表板')).toBeInTheDocument();
    expect(screen.getByText('回测结果')).toBeInTheDocument();
    expect(screen.getByText('回测管理')).toBeInTheDocument();
    expect(screen.getByText('系统设置')).toBeInTheDocument();
  });

  it('应该显示管理员信息', () => {
    render(<App />);
    expect(screen.getByText('管理员')).toBeInTheDocument();
  });

  it('默认路由应该渲染仪表板页面', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });
});
