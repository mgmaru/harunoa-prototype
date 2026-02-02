'use client';

import clsx from 'clsx';
import { useToastStore, ToastType } from '@/stores/toastStore';

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
};

const typeIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

type ToastItemProps = {
  toast: {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
  };
  onClose: () => void;
};

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  return (
    <div
      className={clsx(
        'min-w-[300px] max-w-[400px] rounded-lg shadow-lg text-white p-4',
        'animate-slide-down',
        typeClasses[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-lg" aria-hidden="true">
          {typeIcons[toast.type]}
        </span>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-semibold mb-1">{toast.title}</p>
          )}
          <p className="text-sm opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2"
      aria-label="通知"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
