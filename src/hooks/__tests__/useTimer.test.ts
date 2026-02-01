import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase sessionsサービスをモック
vi.mock('@/services/sessions', () => ({
  createSession: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

// timerStoreのモック（Zustand store）
const mockTimerStore = {
  status: 'stopped' as const,
  projectId: null as string | null,
  projectName: null as string | null,
  projectColor: null as string | null,
  startAt: null as number | null,
  pausedAt: null as number | null,
  totalPausedMs: 0,
  memo: '',
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stop: vi.fn(),
  setMemo: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/stores/timerStore', () => ({
  useTimerStore: () => mockTimerStore,
}));

import { useTimer } from '../useTimer';
import * as sessionService from '@/services/sessions';
import { useAuth } from '../useAuth';
import type { Session } from '@/types/session';

describe('useTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // デフォルトのモック状態をリセット
    mockTimerStore.status = 'stopped';
    mockTimerStore.projectId = null;
    mockTimerStore.projectName = null;
    mockTimerStore.projectColor = null;
    mockTimerStore.startAt = null;
    mockTimerStore.pausedAt = null;
    mockTimerStore.totalPausedMs = 0;
    mockTimerStore.memo = '';

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('停止状態で初期化される', () => {
      const { result } = renderHook(() => useTimer());

      expect(result.current.status).toBe('stopped');
      expect(result.current.isStopped).toBe(true);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.elapsedMs).toBe(0);
    });
  });

  describe('start', () => {
    it('startメソッドがストアのstartを呼び出す', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start({
          id: 'project-1',
          name: 'テストプロジェクト',
          color: '#3B82F6',
        });
      });

      expect(mockTimerStore.start).toHaveBeenCalledWith({
        id: 'project-1',
        name: 'テストプロジェクト',
        color: '#3B82F6',
      });
    });
  });

  describe('pause / resume', () => {
    it('pauseメソッドがストアのpauseを呼び出す', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.pause();
      });

      expect(mockTimerStore.pause).toHaveBeenCalled();
    });

    it('resumeメソッドがストアのresumeを呼び出す', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.resume();
      });

      expect(mockTimerStore.resume).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('stopメソッドがセッションを作成する', async () => {
      const now = new Date('2026-01-15T10:30:00.000Z');
      const startTime = new Date('2026-01-15T10:00:00.000Z');

      const mockSession: Session = {
        id: 'session-1',
        userId: 'test-uid',
        projectId: 'project-1',
        startAt: startTime,
        endAt: now,
        durationMs: 1800000, // 30分
        memo: 'テストメモ',
        isArchived: false,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      mockTimerStore.stop.mockReturnValue({
        projectId: 'project-1',
        startAt: startTime,
        endAt: now,
        durationMs: 1800000,
        memo: 'テストメモ',
      });

      vi.mocked(sessionService.createSession).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useTimer());

      let session: Session | null = null;
      await act(async () => {
        session = await result.current.stop();
      });

      expect(mockTimerStore.stop).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith('test-uid', {
        projectId: 'project-1',
        startAt: startTime,
        endAt: now,
        durationMs: 1800000,
        memo: 'テストメモ',
      });
      expect(session).toEqual(mockSession);
    });

    it('ストアのstopがnullを返す場合、セッションを作成しない', async () => {
      mockTimerStore.stop.mockReturnValue(null);

      const { result } = renderHook(() => useTimer());

      let session: Session | null = null;
      await act(async () => {
        session = await result.current.stop();
      });

      expect(mockTimerStore.stop).toHaveBeenCalled();
      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(session).toBeNull();
    });

    it('ユーザーが未認証の場合、セッションを作成しない', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });

      mockTimerStore.stop.mockReturnValue({
        projectId: 'project-1',
        startAt: new Date(),
        endAt: new Date(),
        durationMs: 1800000,
        memo: '',
      });

      const { result } = renderHook(() => useTimer());

      let session: Session | null = null;
      await act(async () => {
        session = await result.current.stop();
      });

      expect(sessionService.createSession).not.toHaveBeenCalled();
      expect(session).toBeNull();
    });
  });

  describe('setMemo', () => {
    it('setMemoメソッドがストアのsetMemoを呼び出す', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.setMemo('テストメモ');
      });

      expect(mockTimerStore.setMemo).toHaveBeenCalledWith('テストメモ');
    });
  });

  describe('computed properties', () => {
    it('status が running の場合、isRunning が true', () => {
      mockTimerStore.status = 'running';

      const { result } = renderHook(() => useTimer());

      expect(result.current.isRunning).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isStopped).toBe(false);
    });

    it('status が paused の場合、isPaused が true', () => {
      mockTimerStore.status = 'paused';

      const { result } = renderHook(() => useTimer());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(true);
      expect(result.current.isStopped).toBe(false);
    });

    it('status が stopped の場合、isStopped が true', () => {
      mockTimerStore.status = 'stopped';

      const { result } = renderHook(() => useTimer());

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.isStopped).toBe(true);
    });
  });
});
