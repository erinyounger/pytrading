import React from 'react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {icon && (
        <div className="w-16 h-16 mb-4 text-[var(--text-disabled)]">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--text-secondary)] text-center mb-4 max-w-md">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
