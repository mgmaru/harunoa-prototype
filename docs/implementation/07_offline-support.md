# オフライン対応 実装指示書

関連ドキュメント：requirements.md 6.1節

---

## 概要

通信遮断時でも計測を継続し、復帰後にデータを同期する機能を実装する。

---

## 前提条件

- `06_settings.md`が完了していること

---

## 基本方針

1. 計測（カウント）は通信状態に依存しない
2. 通信遮断を検知したら画面に表示
3. オフライン中の操作はローカルに記録
4. 復帰後にサーバーと同期

---

## 実装手順

### 1. オフライン検知フック

`src/hooks/useOffline.ts`:
```typescript
'use client';

import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // 初期状態
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOffline };
}
```

### 2. オフラインキューストア

`src/stores/offlineStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QueuedAction {
  id: string;
  type: 'CREATE_SESSION' | 'UPDATE_SESSION' | 'DELETE_SESSION';
  payload: unknown;
  timestamp: number;
}

interface OfflineState {
  queue: QueuedAction[];
  isSyncing: boolean;
  lastSyncError: string | null;
}

interface OfflineActions {
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
}

export const useOfflineStore = create<OfflineState & OfflineActions>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      lastSyncError: null,

      addToQueue: (action) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          queue: [...state.queue, { ...action, id, timestamp: Date.now() }],
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== id),
        }));
      },

      clearQueue: () => set({ queue: [] }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setSyncError: (lastSyncError) => set({ lastSyncError }),
    }),
    {
      name: 'harunoa-offline-queue',
    }
  )
);
```

### 3. 同期サービス

`src/services/sync.ts`:
```typescript
import { useOfflineStore } from '@/stores/offlineStore';
import { createSession, updateSession, deleteSession } from '@/services/sessions';

export async function syncOfflineQueue(userId: string): Promise<void> {
  const { queue, removeFromQueue, setSyncing, setSyncError, clearQueue } =
    useOfflineStore.getState();

  if (queue.length === 0) return;

  setSyncing(true);
  setSyncError(null);

  try {
    for (const action of queue) {
      try {
        switch (action.type) {
          case 'CREATE_SESSION':
            await createSession(userId, action.payload as any);
            break;
          case 'UPDATE_SESSION':
            const { id, ...data } = action.payload as any;
            await updateSession(id, data);
            break;
          case 'DELETE_SESSION':
            await deleteSession(action.payload as string);
            break;
        }
        removeFromQueue(action.id);
      } catch (e) {
        console.error('Sync failed for action:', action, e);
        throw e;
      }
    }
  } catch (e) {
    setSyncError('同期に失敗しました。再試行してください。');
  } finally {
    setSyncing(false);
  }
}
```

### 4. オフライン対応タイマーストア更新

`src/stores/timerStore.ts`に追加：
```typescript
// stop関数内でオフライン時の処理を追加
stop: () => {
  const state = get();
  if (!state.projectId || !state.startAt) return null;

  const sessionData = {
    projectId: state.projectId,
    startAt: new Date(state.startAt),
    endAt: new Date(),
    memo: state.memo,
  };

  // オフラインの場合はキューに追加
  if (!navigator.onLine) {
    const { addToQueue } = useOfflineStore.getState();
    addToQueue({
      type: 'CREATE_SESSION',
      payload: sessionData,
    });
  }

  set(initialState);
  return sessionData;
},
```

### 5. 同期トリガーフック

`src/hooks/useSync.ts`:
```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useOffline } from './useOffline';
import { useOfflineStore } from '@/stores/offlineStore';
import { syncOfflineQueue } from '@/services/sync';

export function useSync() {
  const { user } = useAuth();
  const { isOffline } = useOffline();
  const { queue, isSyncing, lastSyncError } = useOfflineStore();

  // オンライン復帰時に自動同期
  useEffect(() => {
    if (!isOffline && user && queue.length > 0 && !isSyncing) {
      syncOfflineQueue(user.uid);
    }
  }, [isOffline, user, queue.length, isSyncing]);

  return {
    pendingCount: queue.length,
    isSyncing,
    lastSyncError,
    manualSync: () => user && syncOfflineQueue(user.uid),
  };
}
```

### 6. オフラインバナーコンポーネント

`src/components/ui/OfflineBanner.tsx`:
```typescript
'use client';

import { useOffline } from '@/hooks/useOffline';
import { useSync } from '@/hooks/useSync';

export function OfflineBanner() {
  const { isOffline } = useOffline();
  const { pendingCount, isSyncing, lastSyncError, manualSync } = useSync();

  if (!isOffline && pendingCount === 0 && !lastSyncError) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {isOffline && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          ⚠️ オフライン（通信が切れています）
        </div>
      )}
      
      {!isOffline && pendingCount > 0 && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm">
          {isSyncing ? (
            '同期中...'
          ) : (
            <>
              未同期のデータが{pendingCount}件あります
              <button onClick={manualSync} className="ml-2 underline">
                同期する
              </button>
            </>
          )}
        </div>
      )}
      
      {lastSyncError && (
        <div className="bg-red-500 text-white text-center py-2 text-sm">
          {lastSyncError}
          <button onClick={manualSync} className="ml-2 underline">
            再試行
          </button>
        </div>
      )}
    </div>
  );
}
```

### 7. レイアウトへの組み込み

`src/app/(auth)/layout.tsx`に追加：
```typescript
import { OfflineBanner } from '@/components/ui/OfflineBanner';

export default function AuthLayout({ children }) {
  // ...
  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
```

---

## 競合解決

- **基本ルール：後勝ち（Last Write Wins）**
- タイムスタンプが新しい操作を採用
- 競合発生時はユーザーが履歴画面で手動修正

---

## テスト観点

- [ ] オフライン時にバナーが表示される
- [ ] オフライン中も計測が継続する
- [ ] オフライン中に停止してもエラーにならない
- [ ] オンライン復帰時に自動同期される
- [ ] 同期失敗時にエラーメッセージが表示される
- [ ] 手動再同期ができる
- [ ] ブラウザリロード後もキューが残っている

---

## 完了

これでHaruNoaの主要機能の実装指示書が完成しました。
