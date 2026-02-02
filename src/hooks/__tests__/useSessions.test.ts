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
  getSessionsByDatePaginated: vi.fn(),
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
    isArchived: false,
    archivedAt: null,
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
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2026-01-21T15:00:00'),
    updatedAt: new Date('2026-01-21T15:00:00'),
  },
];

const mockPaginatedResult = {
  sessions: mockSessions,
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

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
    vi.mocked(sessionService.getSessionsByDatePaginated).mockResolvedValue(mockPaginatedResult);
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
    expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledWith(
      'test-uid',
      testDate,
      1,
      { projectId: undefined }
    );
  });

  it('ページネーション情報が正しく返される', async () => {
    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pagination).toEqual({
      currentPage: 1,
      totalPages: 1,
      totalCount: 2,
      hasNextPage: false,
      hasPrevPage: false,
    });
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
    expect(sessionService.getSessionsByDatePaginated).not.toHaveBeenCalled();
  });

  it('セッション取得に失敗した場合はエラー状態になる', async () => {
    const errorMessage = 'ネットワークエラー';
    vi.mocked(sessionService.getSessionsByDatePaginated).mockRejectedValue(
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

    expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledTimes(1);

    const newDate = new Date('2026-01-22');
    rerender({ date: newDate });

    await waitFor(() => {
      expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledTimes(2);
    });

    expect(sessionService.getSessionsByDatePaginated).toHaveBeenLastCalledWith(
      'test-uid',
      newDate,
      1,
      { projectId: undefined }
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
    // 削除後は再取得が走るので、空の結果を返すようにモック
    vi.mocked(sessionService.getSessionsByDatePaginated)
      .mockResolvedValueOnce(mockPaginatedResult)
      .mockResolvedValueOnce({
        sessions: mockSessions.filter((s) => s.id !== 'session-1'),
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });

    const { result } = renderHook(() => useSessions(testDate));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.remove('session-1');
    });

    expect(sessionService.deleteSession).toHaveBeenCalledWith('session-1');
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
    expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    // refreshで再度fetch
    expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledTimes(2);
  });

  it('projectIdオプションを渡すとサービスに渡される', async () => {
    renderHook(() => useSessions(testDate, { projectId: 'project-1' }));

    await waitFor(() => {
      expect(sessionService.getSessionsByDatePaginated).toHaveBeenCalledWith(
        'test-uid',
        testDate,
        1,
        { projectId: 'project-1' }
      );
    });
  });

  describe('ページネーション操作', () => {
    const multiPageResult = {
      sessions: mockSessions,
      totalCount: 100,
      currentPage: 1,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    };

    const secondPageResult = {
      sessions: [mockSessions[0]],
      totalCount: 100,
      currentPage: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPrevPage: true,
    };

    it('goToNextPageを呼び出すと次のページのデータを取得する', async () => {
      vi.mocked(sessionService.getSessionsByDatePaginated)
        .mockResolvedValueOnce(multiPageResult)
        .mockResolvedValueOnce(secondPageResult);

      const { result } = renderHook(() => useSessions(testDate));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.pagination.hasNextPage).toBe(true);

      await act(async () => {
        result.current.goToNextPage();
      });

      await waitFor(() => {
        expect(result.current.pagination.currentPage).toBe(2);
      });

      expect(sessionService.getSessionsByDatePaginated).toHaveBeenLastCalledWith(
        'test-uid',
        testDate,
        2,
        { projectId: undefined }
      );
    });

    it('goToPrevPageを呼び出すと前のページのデータを取得する', async () => {
      vi.mocked(sessionService.getSessionsByDatePaginated)
        .mockResolvedValueOnce(secondPageResult)
        .mockResolvedValueOnce(multiPageResult);

      const { result } = renderHook(() => useSessions(testDate));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.pagination.hasPrevPage).toBe(true);
      });

      await act(async () => {
        result.current.goToPrevPage();
      });

      await waitFor(() => {
        expect(result.current.pagination.currentPage).toBe(1);
      });
    });

    it('goToPageを呼び出すと指定したページのデータを取得する', async () => {
      vi.mocked(sessionService.getSessionsByDatePaginated)
        .mockResolvedValueOnce(multiPageResult)
        .mockResolvedValueOnce(secondPageResult);

      const { result } = renderHook(() => useSessions(testDate));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(result.current.pagination.currentPage).toBe(2);
      });

      expect(sessionService.getSessionsByDatePaginated).toHaveBeenLastCalledWith(
        'test-uid',
        testDate,
        2,
        { projectId: undefined }
      );
    });
  });
});
