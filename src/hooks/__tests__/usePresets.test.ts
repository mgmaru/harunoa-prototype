import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from 'firebase/auth';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase presetsサービスをモック
vi.mock('@/services/presets', () => ({
  getPresets: vi.fn(),
  createPreset: vi.fn(),
  updatePreset: vi.fn(),
  deletePreset: vi.fn(),
  deleteActivePresetAndSetDefault: vi.fn(),
  setActivePreset: vi.fn(),
  clearActivePreset: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { usePresets } from '../usePresets';
import * as presetsService from '@/services/presets';
import { useAuth } from '../useAuth';
import type { PomodoroPreset, CreatePresetInput } from '@/types/preset';

describe('usePresets', () => {
  const mockUser = { uid: 'test-uid' } as User;

  const mockPresets: PomodoroPreset[] = [
    {
      id: 'preset-1',
      userId: 'test-uid',
      name: 'デフォルト',
      focusDurationMinutes: 25,
      breakDurationMinutes: 5,
      focusEndSound: 'bell',
      breakEndSound: 'chime',
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'preset-2',
      userId: 'test-uid',
      name: '長時間集中',
      focusDurationMinutes: 50,
      breakDurationMinutes: 10,
      focusEndSound: 'none',
      breakEndSound: 'none',
      isActive: false,
      createdAt: new Date('2026-01-02'),
      updatedAt: new Date('2026-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(presetsService.getPresets).mockResolvedValue(mockPresets);
  });

  describe('初期状態', () => {
    it('マウント時にプリセットを取得する', async () => {
      const { result } = renderHook(() => usePresets());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(presetsService.getPresets).toHaveBeenCalledWith('test-uid');
      expect(result.current.presets).toEqual(mockPresets);
    });

    it('アクティブなプリセットを正しく識別する', async () => {
      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activePreset).toEqual(mockPresets[0]);
    });

    it('ユーザーが未認証の場合、プリセットを取得しない', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(presetsService.getPresets).not.toHaveBeenCalled();
      expect(result.current.presets).toEqual([]);
    });
  });

  describe('create', () => {
    it('新しいプリセットを作成する', async () => {
      const newPresetInput: CreatePresetInput = {
        name: '新規プリセット',
        focusDurationMinutes: 30,
        breakDurationMinutes: 7,
        focusEndSound: 'bell',
        breakEndSound: 'bell',
      };

      const createdPreset: PomodoroPreset = {
        id: 'preset-3',
        userId: 'test-uid',
        ...newPresetInput,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(presetsService.createPreset).mockResolvedValue(createdPreset);

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let created: PomodoroPreset | undefined;
      await act(async () => {
        created = await result.current.create(newPresetInput);
      });

      expect(presetsService.createPreset).toHaveBeenCalledWith('test-uid', newPresetInput);
      expect(created).toEqual(createdPreset);
      expect(result.current.presets).toContainEqual(createdPreset);
    });

    it('ユーザーが未認証の場合、エラーをスローする', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.create({
            name: 'テスト',
            focusDurationMinutes: 25,
            breakDurationMinutes: 5,
            focusEndSound: 'none',
            breakEndSound: 'none',
          });
        })
      ).rejects.toThrow('認証が必要です');
    });
  });

  describe('update', () => {
    it('プリセットを更新する', async () => {
      vi.mocked(presetsService.updatePreset).mockResolvedValue();

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.update('preset-1', { name: '更新後の名前' });
      });

      expect(presetsService.updatePreset).toHaveBeenCalledWith('preset-1', { name: '更新後の名前' });
      // 更新後に再取得が呼ばれる
      expect(presetsService.getPresets).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('非アクティブなプリセットを削除する', async () => {
      vi.mocked(presetsService.deletePreset).mockResolvedValue();

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.remove('preset-2');
      });

      expect(presetsService.deletePreset).toHaveBeenCalledWith('preset-2');
      expect(result.current.presets.find((p) => p.id === 'preset-2')).toBeUndefined();
    });

    it('アクティブなプリセットの削除はデフォルトを自動で利用中にする', async () => {
      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.remove('preset-1');
      });

      expect(presetsService.deleteActivePresetAndSetDefault).toHaveBeenCalledWith(
        'test-uid',
        'preset-1'
      );
      expect(presetsService.deletePreset).not.toHaveBeenCalled();
    });
  });

  describe('setActive', () => {
    it('プリセットをアクティブに設定する', async () => {
      vi.mocked(presetsService.setActivePreset).mockResolvedValue();

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setActive('preset-2');
      });

      expect(presetsService.setActivePreset).toHaveBeenCalledWith('test-uid', 'preset-2');
      // 設定後に再取得が呼ばれる
      expect(presetsService.getPresets).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearActive', () => {
    it('プリセットのアクティブを解除する', async () => {
      vi.mocked(presetsService.clearActivePreset).mockResolvedValue();

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearActive('preset-1');
      });

      expect(presetsService.clearActivePreset).toHaveBeenCalledWith('test-uid', 'preset-1');
    });
  });

  describe('エラーハンドリング', () => {
    it('取得エラー時にエラー状態を設定する', async () => {
      const error = new Error('取得エラー');
      vi.mocked(presetsService.getPresets).mockRejectedValue(error);

      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.presets).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('プリセットを再取得する', async () => {
      const { result } = renderHook(() => usePresets());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(presetsService.getPresets).toHaveBeenCalledTimes(2);
    });
  });
});
