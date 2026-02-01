import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSync } from '../useSync';
import { useOfflineStore } from '@/stores/offlineStore';
import * as syncService from '@/services/sync';

// モック
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-id' },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock('../useOffline', () => ({
  useOffline: vi.fn(() => ({
    isOffline: false,
    wasOffline: false,
  })),
}));

vi.mock('@/services/sync', () => ({
  syncOfflineQueue: vi.fn(),
}));

// モジュールをインポート
import * as useAuthModule from '../useAuth';
import * as useOfflineModule from '../useOffline';

describe('useSync', () => {
  beforeEach(() => {
    // ストアをリセット
    useOfflineStore.setState({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,
    });
    vi.clearAllMocks();

    // デフォルトのモック設定
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { uid: 'test-user-id' } as ReturnType<
        typeof useAuthModule.useAuth
      >['user'],
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useOfflineModule.useOffline).mockReturnValue({
      isOffline: false,
      wasOffline: false,
    });

    vi.mocked(syncService.syncOfflineQueue).mockResolvedValue({
      success: true,
      syncedCount: 0,
      failedCount: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pendingCountがキューの件数を返す', () => {
    useOfflineStore.setState({
      queue: [
        {
          id: '1',
          type: 'DELETE_SESSION',
          payload: { sessionId: 'session-1' },
          timestamp: Date.now(),
        },
        {
          id: '2',
          type: 'DELETE_SESSION',
          payload: { sessionId: 'session-2' },
          timestamp: Date.now(),
        },
      ],
    });

    const { result } = renderHook(() => useSync());

    expect(result.current.pendingCount).toBe(2);
  });

  it('isSyncingがストアの状態を反映する', () => {
    useOfflineStore.setState({ isSyncing: true });

    const { result } = renderHook(() => useSync());

    expect(result.current.isSyncing).toBe(true);
  });

  it('lastSyncErrorがストアの状態を反映する', () => {
    useOfflineStore.setState({ lastSyncError: 'エラーが発生しました' });

    const { result } = renderHook(() => useSync());

    expect(result.current.lastSyncError).toBe('エラーが発生しました');
  });

  it('lastSyncAtがDateオブジェクトに変換される', () => {
    const timestamp = Date.now();
    useOfflineStore.setState({ lastSyncAt: timestamp });

    const { result } = renderHook(() => useSync());

    expect(result.current.lastSyncAt).toEqual(new Date(timestamp));
  });

  it('lastSyncAtがnullの場合はnullを返す', () => {
    useOfflineStore.setState({ lastSyncAt: null });

    const { result } = renderHook(() => useSync());

    expect(result.current.lastSyncAt).toBeNull();
  });

  describe('manualSync', () => {
    it('manualSyncを呼ぶとsyncOfflineQueueが実行される', async () => {
      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.manualSync();
      });

      expect(syncService.syncOfflineQueue).toHaveBeenCalledWith('test-user-id');
    });

    it('ユーザーがいない場合はsyncOfflineQueueが実行されない', async () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.manualSync();
      });

      expect(syncService.syncOfflineQueue).not.toHaveBeenCalled();
    });

    it('オフライン時はsyncOfflineQueueが実行されない', async () => {
      vi.mocked(useOfflineModule.useOffline).mockReturnValue({
        isOffline: true,
        wasOffline: false,
      });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.manualSync();
      });

      expect(syncService.syncOfflineQueue).not.toHaveBeenCalled();
    });

    it('同期中はsyncOfflineQueueが実行されない', async () => {
      useOfflineStore.setState({ isSyncing: true });

      const { result } = renderHook(() => useSync());

      await act(async () => {
        await result.current.manualSync();
      });

      expect(syncService.syncOfflineQueue).not.toHaveBeenCalled();
    });
  });

  describe('自動同期', () => {
    it('オンライン復帰時にキューがあれば自動同期される', async () => {
      useOfflineStore.setState({
        queue: [
          {
            id: '1',
            type: 'DELETE_SESSION',
            payload: { sessionId: 'session-1' },
            timestamp: Date.now(),
          },
        ],
      });

      vi.mocked(useOfflineModule.useOffline).mockReturnValue({
        isOffline: false,
        wasOffline: true,
      });

      renderHook(() => useSync());

      await waitFor(() => {
        expect(syncService.syncOfflineQueue).toHaveBeenCalledWith(
          'test-user-id'
        );
      });
    });

    it('キューが空の場合は自動同期されない', () => {
      vi.mocked(useOfflineModule.useOffline).mockReturnValue({
        isOffline: false,
        wasOffline: true,
      });

      renderHook(() => useSync());

      expect(syncService.syncOfflineQueue).not.toHaveBeenCalled();
    });

    it('まだオフラインの場合は自動同期されない', () => {
      useOfflineStore.setState({
        queue: [
          {
            id: '1',
            type: 'DELETE_SESSION',
            payload: { sessionId: 'session-1' },
            timestamp: Date.now(),
          },
        ],
      });

      vi.mocked(useOfflineModule.useOffline).mockReturnValue({
        isOffline: true,
        wasOffline: false,
      });

      renderHook(() => useSync());

      expect(syncService.syncOfflineQueue).not.toHaveBeenCalled();
    });
  });
});
