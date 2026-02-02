'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
} from '@/services/auth';
import { ensureDefaultPreset } from '@/services/presets';
import { archiveOldSessions } from '@/services/sessions';

export function useAuth() {
  const { user, isLoading, setUser } = useAuthStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setUser(authUser);

      // ユーザーがログインしたら初期化処理を実行
      if (authUser && !initializedRef.current) {
        initializedRef.current = true;

        // デフォルトプリセットを確保
        try {
          await ensureDefaultPreset(authUser.uid);
        } catch (error) {
          console.error('Failed to ensure default preset:', error);
        }

        // 1年以上前のセッションをアーカイブ
        try {
          const result = await archiveOldSessions(authUser.uid);
          if (result.archivedCount > 0) {
            console.log(
              `${result.archivedCount}件のセッションをアーカイブしました`
            );
          }
        } catch (error) {
          // アーカイブ失敗は致命的エラーではないため、処理を継続
          console.error('セッションアーカイブに失敗しました:', error);
        }
      }

      // ログアウト時はフラグをリセット
      if (!authUser) {
        initializedRef.current = false;
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  return {
    user,
    isLoading,
    signIn: signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
