import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// useNotificationをモック
vi.mock('../useNotification', () => ({
  useNotification: () => ({
    notify: vi.fn(),
    playSound: vi.fn(),
    requestPermission: vi.fn(),
    sendBrowserNotification: vi.fn(),
    showInAppNotification: vi.fn(),
  }),
}));

// vi.hoistedでモック変数をvi.mockより先に初期化
const { mockPomodoroStore, mockTimerStore } = vi.hoisted(() => {
  const mockPomodoroStore = {
    phase: 'idle' as 'idle' | 'focus' | 'break',
    remainingMs: 0,
    presetId: null as string | null,
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    isEnabled: false,
    setPreset: vi.fn(),
    startFocus: vi.fn(),
    startBreak: vi.fn(),
    skipBreak: vi.fn(),
    tick: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  };
  const mockTimerStore = {
    status: 'stopped' as 'stopped' | 'running' | 'paused',
  };
  return { mockPomodoroStore, mockTimerStore };
});

vi.mock('@/stores/pomodoroStore', () => ({
  usePomodoroStore: Object.assign(
    () => mockPomodoroStore,
    { getState: () => mockPomodoroStore },
  ),
}));

vi.mock('@/stores/timerStore', () => ({
  useTimerStore: {
    getState: () => mockTimerStore,
  },
}));

import { usePomodoro } from '../usePomodoro';

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // デフォルトのモック状態をリセット
    mockPomodoroStore.phase = 'idle';
    mockPomodoroStore.remainingMs = 0;
    mockPomodoroStore.presetId = null;
    mockPomodoroStore.focusDurationMinutes = 25;
    mockPomodoroStore.breakDurationMinutes = 5;
    mockPomodoroStore.isEnabled = false;
    mockTimerStore.status = 'stopped';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('アイドル状態で初期化される', () => {
      const { result } = renderHook(() => usePomodoro());

      expect(result.current.phase).toBe('idle');
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isFocus).toBe(false);
      expect(result.current.isBreak).toBe(false);
      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('setPreset', () => {
    it('プリセット設定時にストアのsetPresetを呼び出す', () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.setPreset({
          id: 'preset-1',
          focusDurationMinutes: 30,
          breakDurationMinutes: 7,
        });
      });

      expect(mockPomodoroStore.setPreset).toHaveBeenCalledWith({
        id: 'preset-1',
        focusDurationMinutes: 30,
        breakDurationMinutes: 7,
      });
    });

    it('nullを渡すとポモドーロが無効化される', () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.setPreset(null);
      });

      expect(mockPomodoroStore.setPreset).toHaveBeenCalledWith(null);
    });
  });

  describe('startWithTimer', () => {
    it('ポモドーロが有効でアイドル状態のとき、集中を開始する', () => {
      mockPomodoroStore.isEnabled = true;
      mockPomodoroStore.phase = 'idle';

      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.startWithTimer();
      });

      expect(mockPomodoroStore.startFocus).toHaveBeenCalled();
    });

    it('ポモドーロが無効のとき、集中を開始しない', () => {
      mockPomodoroStore.isEnabled = false;
      mockPomodoroStore.phase = 'idle';

      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.startWithTimer();
      });

      expect(mockPomodoroStore.startFocus).not.toHaveBeenCalled();
    });

    it('集中中のとき、再度開始しない', () => {
      mockPomodoroStore.isEnabled = true;
      mockPomodoroStore.phase = 'focus';

      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.startWithTimer();
      });

      expect(mockPomodoroStore.startFocus).not.toHaveBeenCalled();
    });
  });

  describe('stopWithTimer', () => {
    it('ストアのstopを呼び出す', () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.stopWithTimer();
      });

      expect(mockPomodoroStore.stop).toHaveBeenCalled();
    });
  });

  describe('skipBreak', () => {
    it('ストアのskipBreakを呼び出す', () => {
      const { result } = renderHook(() => usePomodoro());

      act(() => {
        result.current.skipBreak();
      });

      expect(mockPomodoroStore.skipBreak).toHaveBeenCalled();
    });
  });

  describe('computed properties', () => {
    it('phase が focus の場合、isFocus が true', () => {
      mockPomodoroStore.phase = 'focus';

      const { result } = renderHook(() => usePomodoro());

      expect(result.current.isFocus).toBe(true);
      expect(result.current.isBreak).toBe(false);
      expect(result.current.isIdle).toBe(false);
    });

    it('phase が break の場合、isBreak が true', () => {
      mockPomodoroStore.phase = 'break';

      const { result } = renderHook(() => usePomodoro());

      expect(result.current.isFocus).toBe(false);
      expect(result.current.isBreak).toBe(true);
      expect(result.current.isIdle).toBe(false);
    });

    it('phase が idle の場合、isIdle が true', () => {
      mockPomodoroStore.phase = 'idle';

      const { result } = renderHook(() => usePomodoro());

      expect(result.current.isFocus).toBe(false);
      expect(result.current.isBreak).toBe(false);
      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('状態の公開', () => {
    it('ストアの値を正しく公開する', () => {
      mockPomodoroStore.phase = 'focus';
      mockPomodoroStore.remainingMs = 1500000; // 25分
      mockPomodoroStore.presetId = 'preset-1';
      mockPomodoroStore.focusDurationMinutes = 30;
      mockPomodoroStore.breakDurationMinutes = 7;
      mockPomodoroStore.isEnabled = true;

      const { result } = renderHook(() => usePomodoro());

      expect(result.current.phase).toBe('focus');
      expect(result.current.remainingMs).toBe(1500000);
      expect(result.current.presetId).toBe('preset-1');
      expect(result.current.focusDurationMinutes).toBe(30);
      expect(result.current.breakDurationMinutes).toBe(7);
      expect(result.current.isEnabled).toBe(true);
    });
  });
});
