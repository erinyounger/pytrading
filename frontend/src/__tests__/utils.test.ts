import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatVolume,
  getStatusColor,
  getPerformanceLevel,
  calculateSummaryStats,
  debounce,
  throttle,
} from '../utils';
import { BacktestResult } from '../types';

describe('formatCurrency', () => {
  it('应该格式化正数为人民币', () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('应该格式化负数', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500.00');
  });

  it('应该格式化零', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });
});

describe('formatPercent', () => {
  it('应该将小数转为百分比', () => {
    expect(formatPercent(0.1234)).toBe('12.34%');
  });

  it('应该处理负数', () => {
    expect(formatPercent(-0.05)).toBe('-5.00%');
  });

  it('应该支持自定义精度', () => {
    expect(formatPercent(0.12345, 1)).toBe('12.3%');
  });

  it('应该处理零', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('formatNumber', () => {
  it('应该格式化整数', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('应该支持小数精度', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });
});

describe('formatVolume', () => {
  it('应该将大于1亿的值转为亿', () => {
    expect(formatVolume(150000000)).toBe('1.5亿');
  });

  it('应该将大于1万的值转为万', () => {
    expect(formatVolume(50000)).toBe('5.0万');
  });

  it('应该保留小于1万的原始值', () => {
    expect(formatVolume(9999)).toBe('9999');
  });

  it('应该处理精确1亿的值', () => {
    expect(formatVolume(100000000)).toBe('1.0亿');
  });

  it('应该处理精确1万的值', () => {
    expect(formatVolume(10000)).toBe('1.0万');
  });
});

describe('getStatusColor', () => {
  it('应该返回 active 状态的绿色', () => {
    expect(getStatusColor('active')).toBe('#52c41a');
  });

  it('应该返回 running 状态的蓝色', () => {
    expect(getStatusColor('running')).toBe('#1890ff');
  });

  it('应该返回 failed 状态的红色', () => {
    expect(getStatusColor('failed')).toBe('#ff4d4f');
  });

  it('应该返回 pending 状态的黄色', () => {
    expect(getStatusColor('pending')).toBe('#faad14');
  });

  it('应该对未知状态返回默认灰色', () => {
    expect(getStatusColor('unknown')).toBe('#d9d9d9');
  });
});

describe('getPerformanceLevel', () => {
  it('应该正确评级收益率', () => {
    expect(getPerformanceLevel(0.25, 'pnl')).toBe('excellent');
    expect(getPerformanceLevel(0.15, 'pnl')).toBe('good');
    expect(getPerformanceLevel(0.05, 'pnl')).toBe('fair');
    expect(getPerformanceLevel(-0.1, 'pnl')).toBe('poor');
  });

  it('应该正确评级夏普比率', () => {
    expect(getPerformanceLevel(2.5, 'sharp')).toBe('excellent');
    expect(getPerformanceLevel(1.5, 'sharp')).toBe('good');
    expect(getPerformanceLevel(0.7, 'sharp')).toBe('fair');
    expect(getPerformanceLevel(0.3, 'sharp')).toBe('poor');
  });

  it('应该正确评级最大回撤', () => {
    expect(getPerformanceLevel(-0.03, 'drawdown')).toBe('excellent');
    expect(getPerformanceLevel(-0.08, 'drawdown')).toBe('good');
    expect(getPerformanceLevel(-0.15, 'drawdown')).toBe('fair');
    expect(getPerformanceLevel(-0.25, 'drawdown')).toBe('poor');
  });
});

describe('calculateSummaryStats', () => {
  const mockResults: BacktestResult[] = [
    {
      symbol: 'SHSE.600000', name: '浦发银行', strategy_name: 'MACD',
      backtest_start_time: '2024-01-01', backtest_end_time: '2024-12-31',
      pnl_ratio: 0.2, sharp_ratio: 1.5, max_drawdown: -0.1,
      risk_ratio: 0.8, open_count: 10, close_count: 8,
      win_count: 6, lose_count: 2, win_ratio: 0.75, trending_type: 'up',
    },
    {
      symbol: 'SZSE.000001', name: '平安银行', strategy_name: 'MACD',
      backtest_start_time: '2024-01-01', backtest_end_time: '2024-12-31',
      pnl_ratio: -0.1, sharp_ratio: 0.5, max_drawdown: -0.2,
      risk_ratio: 0.4, open_count: 8, close_count: 6,
      win_count: 3, lose_count: 3, win_ratio: 0.5, trending_type: 'down',
    },
  ];

  it('应该正确计算空结果集', () => {
    const stats = calculateSummaryStats([]);
    expect(stats.totalCount).toBe(0);
    expect(stats.avgReturn).toBe(0);
    expect(stats.bestPerformer).toBeNull();
  });

  it('应该正确计算总数', () => {
    const stats = calculateSummaryStats(mockResults);
    expect(stats.totalCount).toBe(2);
  });

  it('应该正确计算平均收益率', () => {
    const stats = calculateSummaryStats(mockResults);
    expect(stats.avgReturn).toBeCloseTo(0.05, 5);
  });

  it('应该正确识别最佳和最差表现', () => {
    const stats = calculateSummaryStats(mockResults);
    expect(stats.bestPerformer?.symbol).toBe('SHSE.600000');
    expect(stats.worstPerformer?.symbol).toBe('SZSE.000001');
  });

  it('应该正确计算盈利率', () => {
    const stats = calculateSummaryStats(mockResults);
    expect(stats.profitableCount).toBe(1);
    expect(stats.profitableRate).toBe(0.5);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该延迟执行函数', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该在多次调用时只执行最后一次', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该立即执行第一次调用', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('应该在节流期间忽略后续调用', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
