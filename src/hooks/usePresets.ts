'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  deleteActivePresetAndSetDefault,
  setActivePreset,
  clearActivePreset,
} from '@/services/presets';
import { PomodoroPreset, CreatePresetInput, UpdatePresetInput } from '@/types/preset';

export const usePresets = () => {
  const { user } = useAuth();
  const [presets, setPresets] = useState<PomodoroPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPresets = useCallback(async () => {
    if (!user) {
      setPresets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getPresets(user.uid);
      setPresets(data);
    } catch (e) {
      console.error('Failed to fetch presets:', e);
      setError(e instanceof Error ? e : new Error('プリセットの取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const create = useCallback(
    async (input: CreatePresetInput): Promise<PomodoroPreset> => {
      if (!user) {
        throw new Error('認証が必要です');
      }

      const preset = await createPreset(user.uid, input);
      setPresets((prev) => [...prev, preset]);
      return preset;
    },
    [user]
  );

  const update = useCallback(
    async (id: string, input: UpdatePresetInput): Promise<void> => {
      await updatePreset(id, input);
      await fetchPresets();
    },
    [fetchPresets]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        throw new Error('認証が必要です');
      }
      const preset = presets.find((p) => p.id === id);
      if (preset?.isActive) {
        // 利用中プリセット削除時はデフォルトプリセットを自動でアクティブに
        await deleteActivePresetAndSetDefault(user.uid, id);
        await fetchPresets();
      } else {
        await deletePreset(id);
        setPresets((prev) => prev.filter((p) => p.id !== id));
      }
    },
    [user, presets, fetchPresets]
  );

  const setActive = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        throw new Error('認証が必要です');
      }
      await setActivePreset(user.uid, id);
      await fetchPresets();
    },
    [user, fetchPresets]
  );

  const clearActive = useCallback(
    async (id: string): Promise<void> => {
      if (!user) {
        throw new Error('認証が必要です');
      }
      await clearActivePreset(user.uid, id);
      await fetchPresets();
    },
    [user, fetchPresets]
  );

  const activePreset = presets.find((p) => p.isActive) ?? null;

  return {
    presets,
    activePreset,
    isLoading,
    error,
    create,
    update,
    remove,
    setActive,
    clearActive,
    refresh: fetchPresets,
  };
};
