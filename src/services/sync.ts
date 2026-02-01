import { useOfflineStore } from '@/stores/offlineStore';
import {
  createSession,
  updateSession,
  deleteSession,
} from '@/services/sessions';

type SyncResult = {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  error?: string;
};

/**
 * オフラインキュー内のアクションをサーバーと同期
 *
 * @param userId - 同期対象のユーザーID
 * @returns 同期結果
 */
export const syncOfflineQueue = async (userId: string): Promise<SyncResult> => {
  const { queue, removeFromQueue, setSyncing, setSyncError, setSyncSuccess } =
    useOfflineStore.getState();

  if (queue.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  setSyncing(true);
  setSyncError(null);

  let syncedCount = 0;
  let failedCount = 0;

  try {
    // タイムスタンプ順にソートして処理（古いものから）
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sortedQueue) {
      try {
        switch (action.type) {
          case 'CREATE_SESSION':
            await createSession(userId, action.payload);
            break;
          case 'UPDATE_SESSION':
            await updateSession(
              action.payload.sessionId,
              action.payload.data
            );
            break;
          case 'DELETE_SESSION':
            await deleteSession(action.payload.sessionId);
            break;
        }
        removeFromQueue(action.id);
        syncedCount++;
      } catch (error) {
        console.error('Sync failed for action:', action, error);
        failedCount++;
        // 個別のエラーはログに記録するが、次のアクションの処理を継続
      }
    }

    if (failedCount === 0) {
      setSyncSuccess();
      return { success: true, syncedCount, failedCount };
    }

    const errorMessage = `${failedCount}件の同期に失敗しました。再試行してください。`;
    setSyncError(errorMessage);
    return { success: false, syncedCount, failedCount, error: errorMessage };
  } catch (error) {
    const errorMessage = '同期に失敗しました。再試行してください。';
    setSyncError(errorMessage);
    console.error('Sync failed:', error);
    return { success: false, syncedCount, failedCount, error: errorMessage };
  } finally {
    setSyncing(false);
  }
};

/**
 * オンライン状態かどうかを確認
 * （SSR対応: サーバーサイドでは常にtrueを返す）
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};
