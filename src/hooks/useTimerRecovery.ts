'use client';

import { useEffect, useRef, useState } from 'react';
import { recoverTimerSession } from '@/lib/timer/recovery';
import { useTimerStore } from '@/stores/timerStore';
import { useToastStore } from '@/stores/toastStore';
import { useAuth } from './useAuth';

/**
 * ブラウザクローズによって中断された計測を、アプリ起動時に復旧するフック
 *
 * 認証済みユーザーが確定した時点で一度だけ実行する。
 */
export const useTimerRecovery = () => {
  const { user } = useAuth();
  const hasRecoveredRef = useRef(false);

  // 認証完了を待つ間にハートビートで上書きされるため、
  // 起動直後（初回レンダー時）の最終アクティブ時刻を保持しておく
  const [initialLastActiveAt] = useState(
    () => useTimerStore.getState().lastActiveAt
  );

  useEffect(() => {
    if (!user || hasRecoveredRef.current) {
      return;
    }
    hasRecoveredRef.current = true;

    const recover = async () => {
      try {
        const result = await recoverTimerSession(user.uid, {
          lastActiveAt: initialLastActiveAt,
        });

        if (result === 'saved') {
          useToastStore.getState().addToast({
            type: 'info',
            title: '計測を終了しました',
            message:
              'ブラウザが閉じられたため、最後に記録された時刻で作業記録を保存しました',
            duration: 5000,
          });
        } else if (result === 'discarded') {
          useToastStore.getState().addToast({
            type: 'info',
            title: '計測を終了しました',
            message: '作業時間が0のため、作業記録は保存されませんでした',
            duration: 5000,
          });
        }
      } catch (error) {
        console.error('Failed to recover timer session:', error);
      }
    };

    void recover();
  }, [user, initialLastActiveAt]);
};
