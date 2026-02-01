'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
} from '@/services/auth';
import { ensureDefaultPreset } from '@/services/presets';

export function useAuth() {
  const { user, isLoading, setUser } = useAuthStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      setUser(authUser);

      // ユーザーがログインしたらデフォルトプリセットを確保
      if (authUser && !initializedRef.current) {
        initializedRef.current = true;
        try {
          await ensureDefaultPreset(authUser.uid);
        } catch (error) {
          console.error('Failed to ensure default preset:', error);
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
