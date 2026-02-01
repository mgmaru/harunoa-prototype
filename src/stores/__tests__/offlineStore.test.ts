import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useOfflineStore } from '../offlineStore';

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('offlineStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // ストアをリセット
    useOfflineStore.setState({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,
    });
  });

  describe('addCreateSession', () => {
    it('CREATE_SESSIONをキューに追加できる', () => {
      const payload = {
        projectId: 'project-1',
        startAt: new Date('2024-01-01T10:00:00'),
        endAt: new Date('2024-01-01T11:00:00'),
        durationMs: 3600000,
        memo: 'テストメモ',
      };

      act(() => {
        useOfflineStore.getState().addCreateSession(payload);
      });

      const state = useOfflineStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].type).toBe('CREATE_SESSION');
      expect(state.queue[0].payload).toEqual(payload);
      expect(state.queue[0].id).toBeDefined();
      expect(state.queue[0].timestamp).toBeDefined();
    });
  });

  describe('addUpdateSession', () => {
    it('UPDATE_SESSIONをキューに追加できる', () => {
      const sessionId = 'session-1';
      const data = { memo: '更新メモ' };

      act(() => {
        useOfflineStore.getState().addUpdateSession(sessionId, data);
      });

      const state = useOfflineStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].type).toBe('UPDATE_SESSION');
      if (state.queue[0].type === 'UPDATE_SESSION') {
        expect(state.queue[0].payload.sessionId).toBe(sessionId);
        expect(state.queue[0].payload.data).toEqual(data);
      }
    });
  });

  describe('addDeleteSession', () => {
    it('DELETE_SESSIONをキューに追加できる', () => {
      const sessionId = 'session-1';

      act(() => {
        useOfflineStore.getState().addDeleteSession(sessionId);
      });

      const state = useOfflineStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].type).toBe('DELETE_SESSION');
      if (state.queue[0].type === 'DELETE_SESSION') {
        expect(state.queue[0].payload.sessionId).toBe(sessionId);
      }
    });
  });

  describe('removeFromQueue', () => {
    it('指定したIDのアクションを削除できる', () => {
      act(() => {
        useOfflineStore.getState().addDeleteSession('session-1');
        useOfflineStore.getState().addDeleteSession('session-2');
      });

      const beforeState = useOfflineStore.getState();
      const idToRemove = beforeState.queue[0].id;

      act(() => {
        useOfflineStore.getState().removeFromQueue(idToRemove);
      });

      const afterState = useOfflineStore.getState();
      expect(afterState.queue).toHaveLength(1);
      expect(afterState.queue.find((a) => a.id === idToRemove)).toBeUndefined();
    });
  });

  describe('clearQueue', () => {
    it('キューを全てクリアできる', () => {
      act(() => {
        useOfflineStore.getState().addDeleteSession('session-1');
        useOfflineStore.getState().addDeleteSession('session-2');
      });

      expect(useOfflineStore.getState().queue).toHaveLength(2);

      act(() => {
        useOfflineStore.getState().clearQueue();
      });

      expect(useOfflineStore.getState().queue).toHaveLength(0);
    });
  });

  describe('setSyncing', () => {
    it('同期中状態を設定できる', () => {
      act(() => {
        useOfflineStore.getState().setSyncing(true);
      });

      expect(useOfflineStore.getState().isSyncing).toBe(true);

      act(() => {
        useOfflineStore.getState().setSyncing(false);
      });

      expect(useOfflineStore.getState().isSyncing).toBe(false);
    });
  });

  describe('setSyncError', () => {
    it('同期エラーを設定できる', () => {
      const errorMessage = '同期に失敗しました';

      act(() => {
        useOfflineStore.getState().setSyncError(errorMessage);
      });

      expect(useOfflineStore.getState().lastSyncError).toBe(errorMessage);
    });

    it('nullを設定するとエラーがクリアされる', () => {
      act(() => {
        useOfflineStore.getState().setSyncError('エラー');
        useOfflineStore.getState().setSyncError(null);
      });

      expect(useOfflineStore.getState().lastSyncError).toBeNull();
    });
  });

  describe('setSyncSuccess', () => {
    it('同期成功時にエラーがクリアされ、タイムスタンプが設定される', () => {
      act(() => {
        useOfflineStore.getState().setSyncError('エラー');
        useOfflineStore.getState().setSyncSuccess();
      });

      const state = useOfflineStore.getState();
      expect(state.lastSyncError).toBeNull();
      expect(state.lastSyncAt).toBeDefined();
      expect(typeof state.lastSyncAt).toBe('number');
    });
  });

  describe('複数アクションの順序', () => {
    it('追加順序が維持される', () => {
      act(() => {
        useOfflineStore.getState().addDeleteSession('session-1');
        useOfflineStore.getState().addDeleteSession('session-2');
        useOfflineStore.getState().addDeleteSession('session-3');
      });

      const state = useOfflineStore.getState();
      expect(state.queue).toHaveLength(3);
      // タイムスタンプが昇順になっている
      expect(state.queue[0].timestamp).toBeLessThanOrEqual(
        state.queue[1].timestamp
      );
      expect(state.queue[1].timestamp).toBeLessThanOrEqual(
        state.queue[2].timestamp
      );
    });
  });
});
