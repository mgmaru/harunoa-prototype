import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Session } from '@/types/session';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase sessionsサービスのモック
vi.mock('@/services/sessions', () => ({
  getSessionsByDate: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { useSessions } from '../useSessions';
import * as sessionService from '@/services/sessions';
import { useAuth } from '../useAuth';

const mockSessions: Session[] = [
  {
    id: 'session-1',
    userId: 'test-uid',
    projectId: 'project-1',
    startAt: new Date('2026-01-21T10:00:00'),
    endAt: new Date('2026-01-21T11:30:00'),
    durationMs: 90 * 60 * 1000,
    memo: 'テスト作業1',
    createdAt: new Date('2026-01-21T11:30:00'),
    updatedAt: new Date('2026-01-21T11:30:00'),
  },
  {
    id: 'session-2',
    userId: 'test-uid',
    projectId: 'project-2',
    startAt: new Date('2026-01-21T14:00:00'),
    endAt: new Date('2026-01-21T15:00:00'),
    durationMs: 60 * 60 * 1000,
    memo: '',
    createdAt: new Date('2026-01-21T15:00:00'),
    updatedAt: new Date('2026-01-21T15:00:00'),
  },
];

describe('useSessions', () => {
  const testDate = new Date('2026-01-21');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(sessionService.getSessionsByDate).mockResolvedValue(mockSessions);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時に指定日のセッション一覧を取得する', async () => {
    const { result } = renderHook(() => useSessions(testDate));

    // 初期状態はローディング中
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.error).toBeNull();
    expect(sessionService.getSessionsByDate).toHaveBeenCalledWith(
      'test-uid',
      testDate,
      { limit: undefined }
    );
  });

  it('ユーザーが未認証の場合はセッションを取得しない', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual([]);
    expect(sessionService.getSessionsByDate).not.toHaveBeenCalled();
  });

  it('セッション取得に失敗した場合はエラー状態になる', async () => {
    const errorMessage = 'ネットワークエラー';
    vi.mocked(sessionService.getSessionsByDate).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.sessions).toEqual([]);
  });

  it('日付が変更されると新しいデータを取得する', async () => {
    const { result, rerender } = renderHook(
      ({ date }) => useSessions(date),
      { initialProps: { date: testDate } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(sessionService.getSessionsByDate).toHaveBeenCalledTimes(1);

    const newDate = new Date('2026-01-22');
    rerender({ date: newDate });

    await waitFor(() => {
      expect(sessionService.getSessionsByDate).toHaveBeenCalledTimes(2);
    });

    expect(sessionService.getSessionsByDate).toHaveBeenLastCalledWith(
      'test-uid',
      newDate,
      { limit: undefined }
    );
  });

  it('updateを呼び出すとセッションが更新される', async () => {
    const updatedSession: Session = {
      ...mockSessions[0],
      memo: '更新後のメモ',
      updatedAt: new Date(),
    };

    vi.mocked(sessionService.updateSession).mockResolvedValue(undefined);
    vi.mocked(sessionService.getSession).mockResolvedValue(updatedSession);

    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.update('session-1', { memo: '更新後のメモ' });
    });

    expect(sessionService.updateSession).toHaveBeenCalledWith('session-1', {
      memo: '更新後のメモ',
    });

    const updated = result.current.sessions.find((s) => s.id === 'session-1');
    expect(updated?.memo).toBe('更新後のメモ');
  });

  it('removeを呼び出すとセッションが一覧から削除される', async () => {
    vi.mocked(sessionService.deleteSession).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.sessions.length;

    await act(async () => {
      await result.current.remove('session-1');
    });

    expect(sessionService.deleteSession).toHaveBeenCalledWith('session-1');
    expect(result.current.sessions.length).toBe(initialLength - 1);
    expect(
      result.current.sessions.find((s) => s.id === 'session-1')
    ).toBeUndefined();
  });

  it('refreshを呼び出すとセッション一覧が再取得される', async () => {
    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 初回のfetch
    expect(sessionService.getSessionsByDate).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    // refreshで再度fetch
    expect(sessionService.getSessionsByDate).toHaveBeenCalledTimes(2);
  });

  it('limitオプションを渡すとサービスに渡される', async () => {
    renderHook(() => useSessions(testDate, { limit: 10 }));

    await waitFor(() => {
      expect(sessionService.getSessionsByDate).toHaveBeenCalledWith(
        'test-uid',
        testDate,
        { limit: 10 }
      );
    });
  });
});
