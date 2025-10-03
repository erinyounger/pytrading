export interface BacktestResult {
  id?: number;
  symbol: string;
  name: string;
  strategy_name: string; // 添加策略名称字段
  backtest_start_time: string;
  backtest_end_time: string;
  pnl_ratio: number;
  sharp_ratio: number;
  max_drawdown: number;
  risk_ratio: number;
  open_count: number;
  close_count: number;
  win_count: number;
  lose_count: number;
  win_ratio: number;
  trending_type: string;
  current_price?: number;
  created_at?: string;
}

export interface Strategy {
  name: string;
  display_name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    default: any;
    description: string;
  }[];
}

export interface Symbol {
  symbol: string;
  name: string;
}

export interface BacktestConfig {
  symbol: string;
  strategy: string;
  start_time: string;
  end_time: string;
  parameters?: Record<string, any>;
}

export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  start_time?: string;
  end_time?: string;
  message: string;
}

export interface SystemConfig {
  trading_mode: string;
  db_type: string;
  save_db: boolean;
  symbols: string[];
}

export interface PaginatedApiResponse<T> {
  data: T;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  per_page?: number;
}