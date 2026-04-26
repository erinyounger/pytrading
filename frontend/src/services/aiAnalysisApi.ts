import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AI Analysis API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface EventSignal {
  event_type: string;
  description: string;
  severity: number;
  date?: string;
}

export interface AIAnalysisResult {
  id: number;
  symbol: string;
  recommendation: '买入' | '持有' | '卖出' | '观望';
  confidence: number;
  sentiment_score: number;
  technical_score: number;
  event_score?: number;
  event_signals: EventSignal[];
  news_impact: number;
  risk_level: '高' | '中' | '低';
  analysis_date: string;
  created_at: string;
  llm_insight?: string;
}

export interface BatchAnalysisResponse {
  task_id: string;
  status: string;
  total_count: number;
  message: string;
}

export interface AnalysisStatusResponse {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  completed_count: number;
  total_count: number;
  error_message?: string;
}

export interface MarketSentimentResponse {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  description: string;
  sector_sentiments?: {
    sector: string;
    sentiment: string;
    score: number;
  }[];
}

export interface CompanyEventsResponse {
  symbol: string;
  events: EventSignal[];
  total_count: number;
}

export const aiAnalysisApi = {
  // 获取单只股票AI分析
  getAnalysis: async (symbol: string, analysisDate?: string): Promise<AIAnalysisResult> => {
    const params: Record<string, string> = {};
    if (analysisDate) {
      params.analysis_date = analysisDate;
    }
    const response = await api.get(`/api/ai/analysis/${symbol}`, { params });
    return response.data;
  },

  // 批量分析
  batchAnalyze: async (symbols: string[], startDate?: string, endDate?: string): Promise<BatchAnalysisResponse> => {
    const body: Record<string, any> = { symbols };
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;
    const response = await api.post('/api/ai/batch-analysis', body);
    return response.data;
  },

  // 获取批量分析状态
  getAnalysisStatus: async (taskId: string): Promise<AnalysisStatusResponse> => {
    const response = await api.get(`/api/ai/analysis/status/${taskId}`);
    return response.data;
  },

  // 获取市场情绪
  getMarketSentiment: async (): Promise<MarketSentimentResponse> => {
    const response = await api.get('/api/ai/market-sentiment');
    return response.data;
  },

  // 获取公司事件
  getCompanyEvents: async (symbol: string, startDate?: string, endDate?: string): Promise<CompanyEventsResponse> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get(`/api/ai/company-events/${symbol}`, { params });
    return response.data;
  },
};
