import React from 'react';
import { cn } from '@/utils/cn';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'running' | 'paused';

interface StatusTagProps {
  status: StatusType;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  children,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const statusClasses = {
    success: 'bg-green-500/10 text-green-400 border border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border border-red-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    running: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    paused: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size],
        statusClasses[status],
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {children}
    </span>
  );
};

export default StatusTag;
