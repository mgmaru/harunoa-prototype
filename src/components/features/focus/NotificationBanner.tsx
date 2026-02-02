'use client';

import { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';

type BannerType = 'focus' | 'break';

type Props = {
  isVisible: boolean;
  title: string;
  message: string;
  type: BannerType;
  onClose: () => void;
};

const typeClasses: Record<BannerType, string> = {
  focus: 'bg-green-600',
  break: 'bg-blue-600',
};

const typeIcons: Record<BannerType, string> = {
  focus: '🎉',
  break: '💪',
};

export const NotificationBanner = ({
  isVisible,
  title,
  message,
  type,
  onClose,
}: Props) => {
  const [show, setShow] = useState(false);

  const handleClose = useCallback(() => {
    setShow(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // 5秒後に自動で閉じる
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, handleClose]);

  if (!show) return null;

  return (
    <div
      className={clsx(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'min-w-[320px] max-w-[90vw] rounded-lg shadow-lg text-white p-4',
        'animate-slide-down',
        typeClasses[type]
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-2xl" aria-hidden="true">
          {typeIcons[type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm opacity-90 mt-1">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 text-white/80 hover:text-white text-xl transition-colors"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
