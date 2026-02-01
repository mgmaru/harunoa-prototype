'use client';

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useOffline } from './useOffline';
import { useOfflineStore } from '@/stores/offlineStore';
import { syncOfflineQueue } from '@/services/sync';

type SyncState = {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncError: string | null;
  lastSyncAt: Date | null;
  manualSync: () => Promise<void>;
};

/**
 * オフラインキューの同期を管理するフック
 *
 * - オンライン復帰時に自動同期
 * - 手動同期機能の提供
 * - 同期状態の監視
 */
export function useSync(): SyncState {
  const { user } = useAuth();
  const { isOffline, wasOffline } = useOffline();
  const { queue, isSyncing, lastSyncError, lastSyncAt } = useOfflineStore();

  // 手動同期
  const manualSync = useCallback(async () => {
    if (!user || isOffline || isSyncing) return;
    await syncOfflineQueue(user.uid);
  }, [user, isOffline, isSyncing]);

  // オンライン復帰時に自動同期
  useEffect(() => {
    if (wasOffline && !isOffline && user && queue.length > 0 && !isSyncing) {
      syncOfflineQueue(user.uid);
    }
  }, [wasOffline, isOffline, user, queue.length, isSyncing]);

  return {
    pendingCount: queue.length,
    isSyncing,
    lastSyncError,
    lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null,
    manualSync,
  };
}
