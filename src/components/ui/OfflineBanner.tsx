'use client';

import { useOffline } from '@/hooks/useOffline';
import { useSync } from '@/hooks/useSync';
import { clsx } from 'clsx';

/**
 * オフライン状態や同期状況を表示するバナー
 *
 * 表示されるケース：
 * - オフライン時: 警告メッセージ
 * - 未同期データがある時: 同期ボタン付きメッセージ
 * - 同期エラー時: エラーメッセージと再試行ボタン
 */
export function OfflineBanner() {
  const { isOffline } = useOffline();
  const { pendingCount, isSyncing, lastSyncError, manualSync } = useSync();

  // 表示条件を満たさない場合は何も表示しない
  if (!isOffline && pendingCount === 0 && !lastSyncError) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* オフラインバナー */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium shadow-md">
          <span className="mr-2">&#9888;</span>
          オフライン（通信が切れています）
        </div>
      )}

      {/* 未同期データバナー */}
      {!isOffline && pendingCount > 0 && !lastSyncError && (
        <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium shadow-md">
          {isSyncing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              同期中...
            </span>
          ) : (
            <>
              未同期のデータが{pendingCount}件あります
              <button
                onClick={manualSync}
                className={clsx(
                  'ml-3 px-3 py-0.5 bg-white/20 hover:bg-white/30',
                  'rounded text-sm transition-colors'
                )}
              >
                同期する
              </button>
            </>
          )}
        </div>
      )}

      {/* 同期エラーバナー */}
      {lastSyncError && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-medium shadow-md">
          {lastSyncError}
          <button
            onClick={manualSync}
            disabled={isSyncing}
            className={clsx(
              'ml-3 px-3 py-0.5 bg-white/20 hover:bg-white/30',
              'rounded text-sm transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSyncing ? '再試行中...' : '再試行'}
          </button>
        </div>
      )}
    </div>
  );
}
