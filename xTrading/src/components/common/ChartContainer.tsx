import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  height?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
  loading = false,
  error,
  className,
  height = '400px',
}) => {
  return (
    <div className={cn('card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="chart-title">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="chart-actions flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="chart-content relative"
        style={{ height }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
              <p className="text-[var(--text-secondary)]">加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[var(--error)]" />
              <p className="text-[var(--error)]">{error}</p>
              <button className="btn btn-secondary text-sm">
                重试
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
