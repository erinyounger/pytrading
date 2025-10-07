import axios from 'axios';
import { BacktestResult, Strategy, Symbol, BacktestConfig, TaskStatus, SystemConfig, ApiResponse, PaginatedApiResponse, LogQueryResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const apiService = {
  // 回测结果相关
  getBacktestResults: async (params?: {
    symbol?: string;
    start_date?: string;
    end_date?: string;
    trending_type?: string;
    min_pnl_ratio?: number;
    max_pnl_ratio?: number;
    min_win_ratio?: number;
    max_win_ratio?: number;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<PaginatedApiResponse<BacktestResult[]>> => {
    const response = await api.get('/api/backtest-results', { params });
    return response.data;
  },

  // 策略相关
  getStrategies: async (): Promise<ApiResponse<Strategy[]>> => {
    const response = await api.get('/api/strategies');
    return response.data;
  },

  // 股票代码相关
  getSymbols: async (): Promise<ApiResponse<Symbol[]>> => {
    const response = await api.get('/api/symbols');
    return response.data;
  },

  // 回测任务相关
  startBacktest: async (config: BacktestConfig): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await api.post('/api/backtest/start', config);
    return response.data;
  },

  getBacktestStatus: async (taskId: string): Promise<TaskStatus> => {
    const response = await api.get(`/api/backtest/status/${taskId}`);
    return response.data;
  },

  // 配置相关
  getConfig: async (): Promise<SystemConfig> => {
    const response = await api.get('/api/config');
    return response.data;
  },

  updateConfig: async (config: Partial<SystemConfig>): Promise<{ status: string; message: string }> => {
    const response = await api.post('/api/config', config);
    return response.data;
  },

  // 健康检查
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/api/health');
    return response.data;
  },

  getSystemStatus: async (): Promise<{
    trading_mode: string;
    system_status: string;
    active_strategies: number;
    total_positions: number;
    total_pnl: number;
    last_update: string;
  }> => {
    const response = await api.get('/api/system-status');
    return response.data;
  },

  // 回测任务列表
  getBacktestTasks: async (params?: {
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedApiResponse<any[]>> => {
    const response = await api.get('/api/backtest/tasks', { params });
    return response.data;
  },

  // 日志相关
  getTaskLogs: async (taskId: string, afterId: number = 0, limit: number = 500): Promise<LogQueryResponse> => {
    const response = await api.get(`/api/logs/task/${taskId}`, {
      params: { after_id: afterId, limit }
    });
    return response.data;
  },

  getResultLogs: async (taskId: string, symbol: string, afterId: number = 0, limit: number = 500): Promise<LogQueryResponse> => {
    const response = await api.get('/api/logs/result', {
      params: { task_id: taskId, symbol, after_id: afterId, limit }
    });
    return response.data;
  },

  // 获取任务的股票回测结果
  getTaskResults: async (taskId: string): Promise<ApiResponse<BacktestResult[]>> => {
    const response = await api.get(`/api/backtest/tasks/${taskId}/results`);
    return response.data;
  },

  // 获取回测池中的股票列表（用于创建回测任务时的股票选择）
  getBacktestPoolSymbols: async (): Promise<ApiResponse<{symbol: string, name: string}[]>> => {
    const response = await api.get('/api/backtest-results', { 
      params: { 
        per_page: 5000 // 获取足够数量的回测结果
      } 
    });
    
    // 从回测结果中提取唯一的股票列表
    const uniqueSymbols = new Map();
    response.data.data.forEach((result: BacktestResult) => {
      if (result.symbol && result.name) {
        uniqueSymbols.set(result.symbol, {
          symbol: result.symbol,
          name: result.name
        });
      }
    });
    
    return {
      data: Array.from(uniqueSymbols.values())
    };
  },
};