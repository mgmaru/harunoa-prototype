'use client';

import { useState, useEffect, useCallback } from 'react';

type OfflineState = {
  isOffline: boolean;
  wasOffline: boolean;
};

/**
 * オフライン状態を検知するフック
 *
 * @returns isOffline - 現在オフラインかどうか
 * @returns wasOffline - オフラインから復帰したばかりかどうか（同期トリガー用）
 */
export function useOffline(): OfflineState {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setWasOffline(true);
    setIsOffline(false);
    // wasOfflineフラグは一定時間後にリセット（同期処理が完了する時間を確保）
    setTimeout(() => setWasOffline(false), 5000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
  }, []);

  useEffect(() => {
    // SSR時はnavigatorが存在しないため、クライアントでのみ初期化
    if (typeof window === 'undefined') return;

    // 初期状態を設定
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOffline, wasOffline };
}
