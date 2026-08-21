'use client';

import { useEffect } from 'react';
import { useTimerStore } from '@/stores/timerStore';

/** ハートビートの記録間隔（ミリ秒） */
export const HEARTBEAT_INTERVAL_MS = 10_000;

/**
 * 計測中にアプリの最終アクティブ時刻を記録し続けるフック
 *
 * 一定間隔での記録に加えて、ページが非表示になる直前（タブを閉じる、
 * ブラウザ終了、他アプリへの切り替え等）にも記録する。
 * これにより、次回起動時に「ブラウザを閉じた時刻」でセッションを確定できる。
 */
export const useTimerHeartbeat = () => {
  const status = useTimerStore((state) => state.status);

  useEffect(() => {
    if (status === 'stopped') {
      return;
    }

    const heartbeat = () => useTimerStore.getState().heartbeat();

    // 計測中と判明した時点で一度記録する
    heartbeat();

    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    // ページ破棄直前に同期的に記録する（unload中は非同期処理が保証されないため、
    // ここではlocalStorageへの書き込みのみを行う）
    const handlePageHide = () => heartbeat();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        heartbeat();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);
};
