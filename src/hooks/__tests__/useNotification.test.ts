import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UserSettings } from '@/types/settings';
import type { PomodoroPreset } from '@/types/preset';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// useSettingsをモック
vi.mock('../useSettings');

// usePresetsをモック
vi.mock('../usePresets');

// toastStoreをモック
vi.mock('@/stores/toastStore', () => ({
  useToastStore: vi.fn(() => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
    clearToasts: vi.fn(),
    toasts: [],
  })),
}));

import { useNotification } from '../useNotification';
import { useSettings } from '../useSettings';
import { usePresets } from '../usePresets';
import { useToastStore } from '@/stores/toastStore';

const mockSettings: UserSettings = {
  userId: 'test-uid',
  soundEnabled: false,
  browserNotificationEnabled: true,
  activePomodoroPresetId: 'preset-1',
  updatedAt: new Date('2026-01-20'),
};

const mockPreset: PomodoroPreset = {
  id: 'preset-1',
  userId: 'test-uid',
  name: 'デフォルト',
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  focusEndSound: 'bell',
  breakEndSound: 'chime',
  isActive: true,
  createdAt: new Date('2026-01-20'),
  updatedAt: new Date('2026-01-20'),
};

// グローバルNotification APIのモック
type MockNotificationConstructor = {
  (title: string, options?: NotificationOptions): unknown;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
};

const mockRequestPermission = vi.fn<() => Promise<NotificationPermission>>();
const mockNotification = vi.fn() as unknown as MockNotificationConstructor;

describe('useNotification', () => {
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // useSettingsのモック
    vi.mocked(useSettings).mockReturnValue({
      settings: mockSettings,
      isLoading: false,
      error: null,
      update: vi.fn(),
      refresh: vi.fn(),
    });

    // usePresetsのモック
    vi.mocked(usePresets).mockReturnValue({
      presets: [mockPreset],
      activePreset: mockPreset,
      isLoading: false,
      error: null,
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      setActive: vi.fn(),
      clearActive: vi.fn(),
      refresh: vi.fn(),
    });

    // toastStoreのモック
    vi.mocked(useToastStore).mockReturnValue({
      addToast: mockAddToast,
      removeToast: vi.fn(),
      clearToasts: vi.fn(),
      toasts: [],
    });

    // Notification APIのモック
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true,
    });
    mockNotification.permission = 'default';
    mockNotification.requestPermission = mockRequestPermission;
    mockRequestPermission.mockResolvedValue('granted');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('requestPermission', () => {
    it('Notification APIがサポートされていない場合はfalseを返す', async () => {
      // windowオブジェクトからNotificationを削除
      const originalNotification = global.Notification;
      // @ts-expect-error Notificationをundefinedに設定
      delete global.Notification;

      const { result } = renderHook(() => useNotification());

      let permission: boolean = false;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe(false);

      // 元に戻す
      global.Notification = originalNotification;
    });

    it('既に許可されている場合はtrueを返す', async () => {
      mockNotification.permission = 'granted';

      const { result } = renderHook(() => useNotification());

      let permission: boolean = false;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe(true);
      expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('既に拒否されている場合はfalseを返す', async () => {
      mockNotification.permission = 'denied';

      const { result } = renderHook(() => useNotification());

      let permission: boolean = false;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe(false);
      expect(mockRequestPermission).not.toHaveBeenCalled();
    });

    it('許可をリクエストして許可された場合はtrueを返す', async () => {
      mockNotification.permission = 'default';
      mockRequestPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotification());

      let permission: boolean = false;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe(true);
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('許可をリクエストして拒否された場合はfalseを返す', async () => {
      mockNotification.permission = 'default';
      mockRequestPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => useNotification());

      let permission: boolean = false;
      await act(async () => {
        permission = await result.current.requestPermission();
      });

      expect(permission).toBe(false);
    });
  });

  describe('playSound', () => {
    it('soundEnabledがfalseの場合は音を再生しない', () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, soundEnabled: false },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockPause = vi.fn();
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: mockPause,
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.playSound('focus');
      });

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('soundEnabledがtrueでプリセットの音がnoneの場合は再生しない', () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, soundEnabled: true },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });

      vi.mocked(usePresets).mockReturnValue({
        presets: [{ ...mockPreset, focusEndSound: 'none' }],
        activePreset: { ...mockPreset, focusEndSound: 'none' },
        isLoading: false,
        error: null,
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        setActive: vi.fn(),
        clearActive: vi.fn(),
        refresh: vi.fn(),
      });

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: vi.fn(),
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.playSound('focus');
      });

      expect(mockAudio).not.toHaveBeenCalled();
    });

    it('soundEnabledがtrueで有効な音が設定されている場合は再生する', () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, soundEnabled: true },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: vi.fn(),
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.playSound('focus');
      });

      expect(mockAudio).toHaveBeenCalledWith('/sounds/bell.mp3');
      expect(mockPlay).toHaveBeenCalled();
    });

    it('breakの場合はbreakEndSoundの音を再生する', () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, soundEnabled: true },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: vi.fn(),
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.playSound('break');
      });

      expect(mockAudio).toHaveBeenCalledWith('/sounds/chime.mp3');
    });
  });

  describe('showInAppNotification', () => {
    it('トーストに通知を追加する', () => {
      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.showInAppNotification('テストタイトル', 'テストメッセージ');
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'info',
        title: 'テストタイトル',
        message: 'テストメッセージ',
        duration: 5000,
      });
    });
  });

  describe('notify', () => {
    it('ブラウザ通知が有効で許可されている場合はブラウザ通知を送信', async () => {
      mockNotification.permission = 'granted';

      const { result } = renderHook(() => useNotification());

      await act(async () => {
        await result.current.notify({
          title: 'テスト',
          message: 'テストメッセージ',
        });
      });

      expect(mockNotification).toHaveBeenCalledWith('テスト', {
        body: 'テストメッセージ',
        icon: '/icon-192x192.png',
        tag: 'harunoa-pomodoro',
      });
    });

    it('ブラウザ通知が無効の場合はアプリ内通知を表示', async () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, browserNotificationEnabled: false },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });

      const { result } = renderHook(() => useNotification());

      await act(async () => {
        await result.current.notify({
          title: 'テスト',
          message: 'テストメッセージ',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'info',
        title: 'テスト',
        message: 'テストメッセージ',
        duration: 5000,
      });
    });

    it('soundが指定されている場合は通知音を再生する', async () => {
      vi.mocked(useSettings).mockReturnValue({
        settings: { ...mockSettings, soundEnabled: true },
        isLoading: false,
        error: null,
        update: vi.fn(),
        refresh: vi.fn(),
      });
      mockNotification.permission = 'granted';

      const mockPlay = vi.fn().mockResolvedValue(undefined);
      const mockAudio = vi.fn().mockImplementation(() => ({
        play: mockPlay,
        pause: vi.fn(),
      }));
      global.Audio = mockAudio as unknown as typeof Audio;

      const { result } = renderHook(() => useNotification());

      await act(async () => {
        await result.current.notify({
          title: 'テスト',
          message: 'テストメッセージ',
          sound: 'focus',
        });
      });

      expect(mockAudio).toHaveBeenCalledWith('/sounds/bell.mp3');
    });

    it('ブラウザ通知の許可が得られない場合はアプリ内通知にフォールバック', async () => {
      mockNotification.permission = 'denied';

      const { result } = renderHook(() => useNotification());

      await act(async () => {
        await result.current.notify({
          title: 'テスト',
          message: 'テストメッセージ',
        });
      });

      expect(mockAddToast).toHaveBeenCalledWith({
        type: 'info',
        title: 'テスト',
        message: 'テストメッセージ',
        duration: 5000,
      });
    });
  });
});
