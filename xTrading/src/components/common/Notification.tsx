import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    icon: 'text-green-400',
    title: 'text-green-400',
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    icon: 'text-red-400',
    title: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    icon: 'text-yellow-400',
    title: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    icon: 'text-blue-400',
    title: 'text-blue-400',
  },
};

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
        colors.bg,
        colors.border,
        'animate-slide-in'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.icon)} />
      <div className="flex-1 min-w-0">
        <h4 className={cn('font-medium text-sm', colors.title)}>{title}</h4>
        {message && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
