// ========================================
// xTrading Type Definitions
// ========================================

// Theme Types
export type Theme = 'dark' | 'light';

export interface ThemeConfig {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'trader' | 'viewer';
}

// Market Data Types
export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: number;
}

export interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

// Trade Types
export interface Trade {
  id: string;
  symbol: string;
  name: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  amount: number;
  fee: number;
  timestamp: number;
  status: 'pending' | 'filled' | 'cancelled';
}

// Strategy Types
export interface Strategy {
  id: string;
  name: string;
  type: 'trend' | 'mean_reversion' | 'breakout' | 'momentum';
  status: 'running' | 'paused' | 'stopped';
  description: string;
  parameters: Record<string, any>;
  stockCount: number;
  todayReturn: number;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  createdAt: string;
  updatedAt: string;
}

// Backtest Types
export interface Backtest {
  id: string;
  name: string;
  strategyId: string;
  strategyName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  stockCount: number;
  parameters: Record<string, any>;
  results?: BacktestResults;
}

export interface BacktestResults {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitLossRatio: number;
  totalTrades: number;
  avgHoldingPeriod: number;
  returnData: ReturnDataPoint[];
}

export interface ReturnDataPoint {
  date: string;
  value: number;
}

// Signal Types
export interface Signal {
  id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  strength: number; // 0-1
  strategy: string;
  price: number;
  volume: number;
  timestamp: string;
  reason: string;
  isRead: boolean;
}

// Risk Types
export interface RiskMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'danger';
  unit: string;
}

export interface RiskAlert {
  id: string;
  type: 'position' | 'drawdown' | 'concentration' | 'stop_loss';
  level: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  availableCash: number;
  totalReturn: number;
  dayReturn: number;
  positions: Position[];
  createdAt: string;
}

export interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
  weight: number; // 持仓权重
}

// Performance Types
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
  profitLossRatio: number;
  totalTrades: number;
  avgHoldingPeriod: number;
}

export interface MonthlyReturn {
  month: string;
  return: number;
  benchmark: number;
}

export interface TradeStatistic {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  profitLossRatio: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

// Form Types
export interface BacktestForm {
  name: string;
  strategyId: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  parameters: Record<string, any>;
}

export interface StrategyForm {
  name: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
}

// Table Types
export interface Column {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  order: 'asc' | 'desc';
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

// Filter Types
export interface FilterConfig {
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  strategy?: string[];
  status?: string[];
  symbol?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Dashboard Types
export interface DashboardData {
  portfolio: Portfolio;
  recentTrades: Trade[];
  activeStrategies: Strategy[];
  recentSignals: Signal[];
  riskAlerts: RiskAlert[];
  performanceMetrics: PerformanceMetrics;
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Export all types
export type {
  Theme,
  ThemeConfig,
  NavItem,
  User,
  MarketData,
  IndexData,
  Trade,
  Strategy,
  Backtest,
  BacktestResults,
  ReturnDataPoint,
  Signal,
  RiskMetric,
  RiskAlert,
  Portfolio,
  Position,
  PerformanceMetrics,
  MonthlyReturn,
  TradeStatistic,
  ApiResponse,
  PaginatedResponse,
  ChartData,
  ChartDataset,
  BacktestForm,
  StrategyForm,
  Column,
  SortConfig,
  WebSocketMessage,
  MarketDataUpdate,
  FilterConfig,
  Notification,
  DashboardData,
  LoadingState,
};
