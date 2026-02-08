import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false,
}) => {
  const typeStyles = {
    danger: {
      icon: 'text-red-400',
      confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: 'text-yellow-400',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    info: {
      icon: 'text-blue-400',
      confirmButton: 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white',
    },
  };

  const styles = typeStyles[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-2 rounded-full bg-[var(--bg-tertiary)]', styles.icon)}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-[var(--text-secondary)]">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn('btn', styles.confirmButton, loading && 'opacity-50 cursor-not-allowed')}
          >
            {loading ? '处理中...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
