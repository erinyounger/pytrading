import axios from 'axios';
import { BacktestResult, Strategy, Symbol, BacktestConfig, TaskStatus, SystemConfig, ApiResponse } from '../types';

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
    limit?: number;
  }): Promise<ApiResponse<BacktestResult[]>> => {
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
};