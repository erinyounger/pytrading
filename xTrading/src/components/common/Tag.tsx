import React from 'react';
import { cn } from '@/utils/cn';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

const variantMap = {
  default: 'bg-gray-500/20 text-gray-400',
  primary: 'bg-blue-500/20 text-blue-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  onRemove,
  className,
}) => {
  const isClickable = !!onClick;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        variantMap[variant],
        sizeMap[size],
        isClickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-white transition-colors"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Tag;
