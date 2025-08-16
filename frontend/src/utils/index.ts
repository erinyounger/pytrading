import dayjs from 'dayjs';
import { BacktestResult } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (value: number, precision = 2): string => {
  return `${(value * 100).toFixed(precision)}%`;
};

export const formatNumber = (value: number, precision = 0): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
};

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  return dayjs(date).format(format);
};

export const formatVolume = (volume: number): string => {
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(1)}亿`;
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(1)}万`;
  }
  return volume.toString();
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'active': '#52c41a',
    'running': '#1890ff',
    'completed': '#52c41a',
    'paused': '#faad14',
    'pending': '#faad14',
    'stopped': '#ff4d4f',
    'failed': '#ff4d4f',
  };
  return colorMap[status] || '#d9d9d9';
};

export const getPerformanceLevel = (value: number, type: 'pnl' | 'sharp' | 'drawdown'): string => {
  switch (type) {
    case 'pnl':
      if (value >= 0.2) return 'excellent';
      if (value >= 0.1) return 'good';
      if (value >= 0) return 'fair';
      return 'poor';
    
    case 'sharp':
      if (value >= 2) return 'excellent';
      if (value >= 1) return 'good';
      if (value >= 0.5) return 'fair';
      return 'poor';
    
    case 'drawdown':
      if (value >= -0.05) return 'excellent';
      if (value >= -0.1) return 'good';
      if (value >= -0.2) return 'fair';
      return 'poor';
    
    default:
      return 'fair';
  }
};

export const calculateSummaryStats = (results: BacktestResult[]) => {
  if (results.length === 0) {
    return {
      totalCount: 0,
      avgReturn: 0,
      avgSharpe: 0,
      avgWinRate: 0,
      bestPerformer: null,
      worstPerformer: null,
      profitableCount: 0,
      profitableRate: 0,
    };
  }

  const totalReturn = results.reduce((sum, r) => sum + r.pnl_ratio, 0);
  const totalSharpe = results.reduce((sum, r) => sum + r.sharp_ratio, 0);
  const totalWinRate = results.reduce((sum, r) => sum + r.win_ratio, 0);
  
  const sorted = [...results].sort((a, b) => b.pnl_ratio - a.pnl_ratio);
  const profitableCount = results.filter(r => r.pnl_ratio > 0).length;

  return {
    totalCount: results.length,
    avgReturn: totalReturn / results.length,
    avgSharpe: totalSharpe / results.length,
    avgWinRate: totalWinRate / results.length,
    bestPerformer: sorted[0] || null,
    worstPerformer: sorted[sorted.length - 1] || null,
    profitableCount,
    profitableRate: profitableCount / results.length,
  };
};

export const downloadCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      // 处理包含逗号的值
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${dayjs().format('YYYYMMDD')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
};