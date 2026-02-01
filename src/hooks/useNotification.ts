'use client';

import { useCallback } from 'react';
import { useSettings } from './useSettings';

type NotificationOptions = {
  title: string;
  message: string;
  sound?: 'focus' | 'break' | null;
};

/**
 * 簡易通知フック（Phase 10で本格実装に差し替え予定）
 *
 * 現時点では以下の機能を提供：
 * - ブラウザ Notification API を使用した通知
 * - console.log によるログ出力
 */
export const useNotification = () => {
  const { settings } = useSettings();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const notify = useCallback(
    async ({ title, message, sound }: NotificationOptions) => {
      // ログ出力（デバッグ用）
      console.log(`[Notification] ${title}: ${message}`);

      // ブラウザ通知
      if (settings?.browserNotificationEnabled) {
        const hasPermission = await requestPermission();
        if (hasPermission) {
          new Notification(title, {
            body: message,
            icon: '/icon-192x192.png',
          });
        }
      }

      // 通知音（Phase 10で実装予定）
      // 現時点ではスタブとしてログ出力のみ
      if (settings?.soundEnabled && sound) {
        console.log(`[Sound] Playing ${sound} sound`);
        // TODO: Phase 10で音声ファイルを再生する実装を追加
      }
    },
    [settings?.browserNotificationEnabled, settings?.soundEnabled, requestPermission]
  );

  return {
    notify,
    requestPermission,
  };
};
