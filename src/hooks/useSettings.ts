'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getUserSettings, updateUserSettings } from '@/services/settings';
import { UserSettings, UpdateUserSettingsInput } from '@/types/settings';

export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getUserSettings(user.uid);
      setSettings(data);
    } catch (e) {
      console.error('Failed to fetch settings:', e);
      setError(e instanceof Error ? e : new Error('設定の取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const update = useCallback(
    async (input: UpdateUserSettingsInput): Promise<void> => {
      if (!user) {
        throw new Error('認証が必要です');
      }

      await updateUserSettings(user.uid, input);
      setSettings((prev) =>
        prev
          ? { ...prev, ...input, updatedAt: new Date() }
          : null
      );
    },
    [user]
  );

  return {
    settings,
    isLoading,
    error,
    update,
    refresh: fetchSettings,
  };
};
