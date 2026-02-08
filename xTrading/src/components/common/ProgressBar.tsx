import React from 'react';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const colorMap = {
  primary: 'bg-[var(--brand-primary)]',
  success: 'bg-green-400',
  warning: 'bg-yellow-400',
  danger: 'bg-red-400',
};

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'primary',
  size = 'md',
  animated = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-[var(--text-secondary)]">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden',
          sizeMap[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            colorMap[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
