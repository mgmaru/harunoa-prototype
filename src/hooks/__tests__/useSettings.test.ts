import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { UserSettings } from '@/types/settings';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// settingsサービスのモック
vi.mock('@/services/settings', () => ({
  getUserSettings: vi.fn(),
  updateUserSettings: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { useSettings } from '../useSettings';
import * as settingsService from '@/services/settings';
import { useAuth } from '../useAuth';

const mockSettings: UserSettings = {
  userId: 'test-uid',
  soundEnabled: false,
  browserNotificationEnabled: true,
  activePomodoroPresetId: null,
  updatedAt: new Date('2026-01-20'),
};

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(settingsService.getUserSettings).mockResolvedValue(mockSettings);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時に設定を取得する', async () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.error).toBeNull();
    expect(settingsService.getUserSettings).toHaveBeenCalledWith('test-uid');
  });

  it('ユーザーが未認証の場合は設定を取得しない', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toBeNull();
    expect(settingsService.getUserSettings).not.toHaveBeenCalled();
  });

  it('設定取得に失敗した場合はエラー状態になる', async () => {
    const errorMessage = 'ネットワークエラー';
    vi.mocked(settingsService.getUserSettings).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.settings).toBeNull();
  });

  it('updateを呼び出すと設定が更新される', async () => {
    vi.mocked(settingsService.updateUserSettings).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.update({ soundEnabled: true });
    });

    expect(settingsService.updateUserSettings).toHaveBeenCalledWith('test-uid', {
      soundEnabled: true,
    });

    expect(result.current.settings?.soundEnabled).toBe(true);
  });

  it('未認証状態でupdateを呼び出すとエラーがスローされる', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.update({ soundEnabled: true });
      })
    ).rejects.toThrow('認証が必要です');
  });

  it('refreshを呼び出すと設定が再取得される', async () => {
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(settingsService.getUserSettings).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(settingsService.getUserSettings).toHaveBeenCalledTimes(2);
  });

  it('browserNotificationEnabledを更新できる', async () => {
    vi.mocked(settingsService.updateUserSettings).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.update({ browserNotificationEnabled: false });
    });

    expect(settingsService.updateUserSettings).toHaveBeenCalledWith('test-uid', {
      browserNotificationEnabled: false,
    });

    expect(result.current.settings?.browserNotificationEnabled).toBe(false);
  });

  it('activePomodoroPresetIdを更新できる', async () => {
    vi.mocked(settingsService.updateUserSettings).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.update({ activePomodoroPresetId: 'preset-1' });
    });

    expect(settingsService.updateUserSettings).toHaveBeenCalledWith('test-uid', {
      activePomodoroPresetId: 'preset-1',
    });

    expect(result.current.settings?.activePomodoroPresetId).toBe('preset-1');
  });
});
