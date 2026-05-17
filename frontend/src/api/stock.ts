import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface StockInfo {
  symbol: string;
  name: string;
  market: string;
  industry: string;
  industry_sw?: string;  // 申万行业分类
  concept_boards?: string[];  // 概念板块列表
  list_date: string;
  exchange: string;
  type: string;
  status: string;
  share_type: string;
  is_hs: string;
  listing_state: string;
  total_share?: number;
  float_share?: number;
  total_mv?: number;
  float_mv?: number;
  company_name?: string;
  province?: string;
  city?: string;
}

export interface StockInfoResponse {
  data: StockInfo;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Stock API Error:', error);
    return Promise.reject(error);
  }
);

export const stockApi = {
  // 获取股票基本信息（包含行业和概念板块）
  getStockInfo: async (symbol: string): Promise<StockInfo> => {
    const response = await api.get<StockInfoResponse>(`/api/stock-info/${symbol}`);
    return response.data.data;
  },
};

export default stockApi;
