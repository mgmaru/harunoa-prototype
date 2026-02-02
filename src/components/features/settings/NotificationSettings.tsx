'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useSettings } from '@/hooks/useSettings';

type ToggleProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  'aria-label'?: string;
};

const Toggle = ({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        'w-12 h-6 rounded-full relative transition-colors',
        checked ? 'bg-primary-600' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
          checked && 'translate-x-6'
        )}
      />
    </button>
  );
};

export const NotificationSettings = () => {
  const { settings, update, isLoading } = useSettings();
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSoundToggle = async () => {
    if (!settings || isUpdating) return;

    setIsUpdating(true);
    try {
      await update({ soundEnabled: !settings.soundEnabled });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!settings || isUpdating) return;

    setIsUpdating(true);
    try {
      if (!settings.browserNotificationEnabled) {
        // ONにする場合は許可をリクエスト
        if (notificationPermission === 'default') {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          if (permission === 'granted') {
            await update({ browserNotificationEnabled: true });
          }
        } else if (notificationPermission === 'granted') {
          await update({ browserNotificationEnabled: true });
        }
      } else {
        // OFFにする
        await update({ browserNotificationEnabled: false });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getPermissionMessage = (): string => {
    switch (notificationPermission) {
      case 'denied':
        return 'ブラウザで通知がブロックされています';
      case 'granted':
        return '通知が許可されています';
      default:
        return 'ブラウザの許可が必要です';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 rounded animate-pulse" />
        <div className="h-16 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 通知音 */}
      <div className="flex justify-between items-center py-2">
        <div>
          <span className="font-medium text-gray-700">通知音</span>
          <p className="text-sm text-gray-500">
            ポモドーロ終了時に音で通知します
          </p>
        </div>
        <Toggle
          checked={settings?.soundEnabled ?? false}
          onChange={handleSoundToggle}
          disabled={isUpdating}
          aria-label={`通知音を${settings?.soundEnabled ? 'オフ' : 'オン'}にする`}
        />
      </div>

      {/* ブラウザ通知 */}
      <div className="flex justify-between items-center py-2">
        <div>
          <span className="font-medium text-gray-700">ブラウザ通知</span>
          <p className="text-sm text-gray-500">{getPermissionMessage()}</p>
        </div>
        <Toggle
          checked={settings?.browserNotificationEnabled ?? false}
          onChange={handleNotificationToggle}
          disabled={isUpdating || notificationPermission === 'denied'}
          aria-label={`ブラウザ通知を${settings?.browserNotificationEnabled ? 'オフ' : 'オン'}にする`}
        />
      </div>

      {/* ブロック時の案内 */}
      {notificationPermission === 'denied' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-700">
            ブラウザの設定から通知を許可してください。許可後、ページを再読み込みしてください。
          </p>
        </div>
      )}
    </div>
  );
};
