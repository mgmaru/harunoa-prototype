import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreateSessionInput, UpdateSessionInput } from '@/types/session';

/**
 * オフラインキュー内のアクション
 */
type QueuedAction =
  | {
      id: string;
      type: 'CREATE_SESSION';
      payload: CreateSessionInput;
      timestamp: number;
    }
  | {
      id: string;
      type: 'UPDATE_SESSION';
      payload: { sessionId: string; data: UpdateSessionInput };
      timestamp: number;
    }
  | {
      id: string;
      type: 'DELETE_SESSION';
      payload: { sessionId: string };
      timestamp: number;
    };

type OfflineState = {
  queue: QueuedAction[];
  isSyncing: boolean;
  lastSyncError: string | null;
  lastSyncAt: number | null;
};

type OfflineActions = {
  addCreateSession: (payload: CreateSessionInput) => void;
  addUpdateSession: (sessionId: string, data: UpdateSessionInput) => void;
  addDeleteSession: (sessionId: string) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  setSyncSuccess: () => void;
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const useOfflineStore = create<OfflineState & OfflineActions>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,

      addCreateSession: (payload) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              id: generateId(),
              type: 'CREATE_SESSION' as const,
              payload,
              timestamp: Date.now(),
            },
          ],
        }));
      },

      addUpdateSession: (sessionId, data) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              id: generateId(),
              type: 'UPDATE_SESSION' as const,
              payload: { sessionId, data },
              timestamp: Date.now(),
            },
          ],
        }));
      },

      addDeleteSession: (sessionId) => {
        set((state) => ({
          queue: [
            ...state.queue,
            {
              id: generateId(),
              type: 'DELETE_SESSION' as const,
              payload: { sessionId },
              timestamp: Date.now(),
            },
          ],
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((action) => action.id !== id),
        }));
      },

      clearQueue: () => set({ queue: [] }),

      setSyncing: (isSyncing) => set({ isSyncing }),

      setSyncError: (lastSyncError) => set({ lastSyncError }),

      setSyncSuccess: () =>
        set({
          lastSyncError: null,
          lastSyncAt: Date.now(),
        }),
    }),
    {
      name: 'harunoa-offline-queue',
      // Dateオブジェクトをシリアライズするためのカスタム処理
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // payloadのDateフィールドを復元
          if (parsed.state?.queue) {
            parsed.state.queue = parsed.state.queue.map(
              (action: QueuedAction) => {
                if (action.type === 'CREATE_SESSION') {
                  return {
                    ...action,
                    payload: {
                      ...action.payload,
                      startAt: new Date(action.payload.startAt),
                      endAt: new Date(action.payload.endAt),
                    },
                  };
                }
                if (action.type === 'UPDATE_SESSION') {
                  const data = action.payload.data;
                  return {
                    ...action,
                    payload: {
                      ...action.payload,
                      data: {
                        ...data,
                        ...(data.startAt && { startAt: new Date(data.startAt) }),
                        ...(data.endAt && { endAt: new Date(data.endAt) }),
                      },
                    },
                  };
                }
                return action;
              }
            );
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
