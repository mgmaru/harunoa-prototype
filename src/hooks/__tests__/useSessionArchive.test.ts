import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase sessionsサービスのモック
vi.mock('@/services/sessions', () => ({
  archiveOldSessions: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { useSessionArchive } from '../useSessionArchive';
import * as sessionService from '@/services/sessions';
import { useAuth } from '../useAuth';

describe('useSessionArchive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態ではisArchivingがfalse、lastArchiveResultがnull', () => {
    const { result } = renderHook(() => useSessionArchive());

    expect(result.current.isArchiving).toBe(false);
    expect(result.current.lastArchiveResult).toBeNull();
  });

  it('runArchiveを呼び出すとアーカイブ処理が実行される', async () => {
    vi.mocked(sessionService.archiveOldSessions).mockResolvedValue({
      archivedCount: 5,
    });

    const { result } = renderHook(() => useSessionArchive());

    await act(async () => {
      await result.current.runArchive();
    });

    expect(sessionService.archiveOldSessions).toHaveBeenCalledWith('test-uid');
    expect(result.current.lastArchiveResult?.archivedCount).toBe(5);
    expect(result.current.lastArchiveResult?.archivedAt).toBeInstanceOf(Date);
  });

  it('アーカイブ処理中はisArchivingがtrueになる', async () => {
    let resolvePromise: (value: { archivedCount: number }) => void;
    const archivePromise = new Promise<{ archivedCount: number }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(sessionService.archiveOldSessions).mockReturnValue(archivePromise);

    const { result } = renderHook(() => useSessionArchive());

    // アーカイブ処理を開始（awaitしない）
    let archiveResultPromise: Promise<{ archivedCount: number } | undefined>;
    act(() => {
      archiveResultPromise = result.current.runArchive();
    });

    // 処理中はisArchivingがtrue
    expect(result.current.isArchiving).toBe(true);

    // 処理を完了させる
    await act(async () => {
      resolvePromise!({ archivedCount: 3 });
      await archiveResultPromise;
    });

    // 処理完了後はisArchivingがfalse
    expect(result.current.isArchiving).toBe(false);
  });

  it('ユーザーが未認証の場合はアーカイブを実行しない', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSessionArchive());

    await act(async () => {
      await result.current.runArchive();
    });

    expect(sessionService.archiveOldSessions).not.toHaveBeenCalled();
    expect(result.current.lastArchiveResult).toBeNull();
  });

  it('アーカイブ処理中に再度runArchiveを呼び出しても重複実行されない', async () => {
    let resolvePromise: (value: { archivedCount: number }) => void;
    const archivePromise = new Promise<{ archivedCount: number }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(sessionService.archiveOldSessions).mockReturnValue(archivePromise);

    const { result } = renderHook(() => useSessionArchive());

    // 1回目のアーカイブ処理を開始
    let firstPromise: Promise<{ archivedCount: number } | undefined>;
    act(() => {
      firstPromise = result.current.runArchive();
    });

    // 処理中に2回目を呼び出し
    let secondPromise: Promise<{ archivedCount: number } | undefined>;
    act(() => {
      secondPromise = result.current.runArchive();
    });

    // 1回目の処理を完了
    await act(async () => {
      resolvePromise!({ archivedCount: 2 });
      await firstPromise;
      await secondPromise;
    });

    // archiveOldSessionsは1回しか呼ばれない
    expect(sessionService.archiveOldSessions).toHaveBeenCalledTimes(1);
  });

  it('アーカイブ対象が0件でも正常に完了する', async () => {
    vi.mocked(sessionService.archiveOldSessions).mockResolvedValue({
      archivedCount: 0,
    });

    const { result } = renderHook(() => useSessionArchive());

    await act(async () => {
      await result.current.runArchive();
    });

    expect(result.current.lastArchiveResult?.archivedCount).toBe(0);
    expect(result.current.isArchiving).toBe(false);
  });

  it('アーカイブ処理がエラーになってもisArchivingはfalseに戻る', async () => {
    vi.mocked(sessionService.archiveOldSessions).mockRejectedValue(
      new Error('ネットワークエラー')
    );

    const { result } = renderHook(() => useSessionArchive());

    // エラーが発生しても処理は完了する
    await act(async () => {
      try {
        await result.current.runArchive();
      } catch {
        // エラーは無視
      }
    });

    expect(result.current.isArchiving).toBe(false);
  });

  it('runArchiveは結果を返す', async () => {
    vi.mocked(sessionService.archiveOldSessions).mockResolvedValue({
      archivedCount: 10,
    });

    const { result } = renderHook(() => useSessionArchive());

    let archiveResult: { archivedCount: number } | undefined;
    await act(async () => {
      archiveResult = await result.current.runArchive();
    });

    expect(archiveResult).toEqual({ archivedCount: 10 });
  });
});
