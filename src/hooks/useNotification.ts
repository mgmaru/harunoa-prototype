'use client';

import { useCallback, useRef } from 'react';
import { useSettings } from './useSettings';
import { usePresets } from './usePresets';
import { useToastStore } from '@/stores/toastStore';
import { NotificationSound } from '@/types/preset';

type NotificationOptions = {
  title: string;
  message: string;
  sound?: 'focus' | 'break' | null;
};

/**
 * 通知フック
 *
 * 以下の機能を提供：
 * - 通知音の再生（プリセット設定に基づく）
 * - ブラウザ Notification API を使用した通知
 * - アプリ内トースト通知（フォールバック）
 */
export const useNotification = () => {
  const { settings } = useSettings();
  const { activePreset } = usePresets();
  const { addToast } = useToastStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * ブラウザ通知の許可をリクエスト
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
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

  /**
   * 通知音を再生
   */
  const playSound = useCallback(
    (soundType: 'focus' | 'break') => {
      if (!settings?.soundEnabled) return;

      // アクティブなプリセットから音を取得
      const soundName: NotificationSound | undefined =
        soundType === 'focus'
          ? activePreset?.focusEndSound
          : activePreset?.breakEndSound;

      if (!soundName || soundName === 'none') return;

      const soundFile = `/sounds/${soundName}.mp3`;

      // 前の音声を停止
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(soundFile);
      audioRef.current.play().catch((e) => {
        console.warn('Audio playback failed:', e);
      });
    },
    [settings?.soundEnabled, activePreset]
  );

  /**
   * ブラウザ通知を送信
   */
  const sendBrowserNotification = useCallback(
    async (title: string, message: string): Promise<boolean> => {
      if (!settings?.browserNotificationEnabled) return false;

      const hasPermission = await requestPermission();
      if (hasPermission) {
        new Notification(title, {
          body: message,
          icon: '/icon-192x192.png',
          tag: 'harunoa-pomodoro',
        });
        return true;
      }
      return false;
    },
    [settings?.browserNotificationEnabled, requestPermission]
  );

  /**
   * アプリ内通知（トースト）を表示
   */
  const showInAppNotification = useCallback(
    (title: string, message: string) => {
      addToast({
        type: 'info',
        title,
        message,
        duration: 5000,
      });
    },
    [addToast]
  );

  /**
   * 統合通知関数
   * 設定に応じて通知音、ブラウザ通知、アプリ内通知を実行
   */
  const notify = useCallback(
    async ({ title, message, sound }: NotificationOptions) => {
      // 通知音を再生
      if (sound) {
        playSound(sound);
      }

      // ブラウザ通知
      if (settings?.browserNotificationEnabled) {
        const sent = await sendBrowserNotification(title, message);
        // ブラウザ通知が送信できなかった場合はアプリ内通知
        if (!sent) {
          showInAppNotification(title, message);
        }
      } else {
        // ブラウザ通知がOFFの場合もアプリ内通知
        showInAppNotification(title, message);
      }
    },
    [
      settings?.browserNotificationEnabled,
      playSound,
      sendBrowserNotification,
      showInAppNotification,
    ]
  );

  return {
    notify,
    playSound,
    requestPermission,
    sendBrowserNotification,
    showInAppNotification,
  };
};
