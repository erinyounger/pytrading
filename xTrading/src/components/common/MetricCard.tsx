import React, { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat';
  data?: number[];
  className?: string;
  loading?: boolean;
}

/**
 * MetricCard 组件
 * 用于展示关键指标，支持趋势图标、迷你图表和加载状态
 */
export const MetricCard: React.FC<MetricCardProps> = memo(({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  trend,
  data,
  className,
  loading = false,
}) => {
  const trendIcon = useMemo(() => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      case 'flat':
        return <Minus className="w-4 h-4" />;
      default:
        return null;
    }
  }, [trend]);

  const trendColor = useMemo(() => {
    if (changeType === 'positive') return 'text-green-400';
    if (changeType === 'negative') return 'text-red-400';
    return 'text-[var(--text-secondary)]';
  }, [changeType]);

  const changeColor = useMemo(() => {
    if (changeType === 'positive') return 'data-up';
    if (changeType === 'negative') return 'data-down';
    return '';
  }, [changeType]);

  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }, [value]);

  const MiniChart: React.FC<{ data?: number[] }> = ({ data }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    return (
      <div className="w-full h-8 mt-2">
        <svg width="100%" height="100%" viewBox="0 0 100 32">
          <path
            d={`M 0 ${32 - ((data[0] - min) / range) * 32} ${data
              .map((val, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 32 - ((val - min) / range) * 32;
                return `L ${x} ${y}`;
              })
              .join(' ')}`}
            fill="none"
            stroke={changeType === 'positive' ? '#00d084' : changeType === 'negative' ? '#ff4757' : '#4f46e5'}
            strokeWidth="2"
            className="animate-number-roll"
          />
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded w-24"></div>
            <div className="h-6 w-6 bg-[var(--bg-tertiary)] rounded"></div>
          </div>
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-32 mb-2"></div>
          <div className="h-4 bg-[var(--bg-tertiary)] rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card group cursor-pointer', className)}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          {title}
        </span>
        {icon && (
          <div className={cn(
            'p-2 rounded-lg bg-[var(--bg-tertiary)] group-hover:bg-[var(--bg-hover)] transition-colors',
            changeType === 'positive' && 'text-green-400',
            changeType === 'negative' && 'text-red-400',
            changeType === 'neutral' && 'text-[var(--text-secondary)]'
          )}>
            {icon}
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-[var(--text-primary)] font-mono">
          {formattedValue}
        </div>
      </div>

      {change && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          changeColor,
          trendColor
        )}>
          {trendIcon}
          <span>{change}</span>
        </div>
      )}

      {data && <MiniChart data={data} />}
    </div>
  );
});

export default MetricCard;
