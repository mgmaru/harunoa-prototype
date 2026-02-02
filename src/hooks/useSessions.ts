'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getSessionsByDatePaginated,
  updateSession,
  deleteSession,
  getSession,
} from '@/services/sessions';
import { Session, UpdateSessionInput } from '@/types/session';

type UseSessionsOptions = {
  /** 特定のプロジェクトでフィルタ（未指定の場合は全プロジェクト） */
  projectId?: string;
};

type PaginationInfo = {
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総件数 */
  totalCount: number;
  /** 次のページがあるか */
  hasNextPage: boolean;
  /** 前のページがあるか */
  hasPrevPage: boolean;
};

type UseSessionsReturn = {
  /** セッション一覧 */
  sessions: Session[];
  /** 読み込み中フラグ */
  isLoading: boolean;
  /** エラー */
  error: Error | null;
  /** ページネーション情報 */
  pagination: PaginationInfo;
  /** セッションを更新 */
  update: (id: string, input: UpdateSessionInput) => Promise<void>;
  /** セッションを削除 */
  remove: (id: string) => Promise<void>;
  /** データを再取得 */
  refresh: () => Promise<void>;
  /** 次のページへ */
  goToNextPage: () => void;
  /** 前のページへ */
  goToPrevPage: () => void;
  /** 指定ページへ */
  goToPage: (page: number) => void;
};

/**
 * 指定日付のセッション一覧を取得・操作するフック（ページネーション対応）
 *
 * @param date 取得する日付
 * @param options オプション
 * @returns セッション一覧と操作関数
 */
export const useSessions = (
  date: Date,
  options?: UseSessionsOptions
): UseSessionsReturn => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchSessions = useCallback(async (page: number = 1) => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getSessionsByDatePaginated(user.uid, date, page, {
        projectId: options?.projectId,
      });
      setSessions(result.sessions);
      setPagination({
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      });
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
      setError(e instanceof Error ? e : new Error('セッションの取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [user, date, options?.projectId]);

  // 日付やフィルタが変更されたらページをリセットしてデータを再取得
  useEffect(() => {
    setCurrentPage(1);
  }, [date, options?.projectId]);

  // ページが変更されたらデータを再取得
  useEffect(() => {
    fetchSessions(currentPage);
  }, [currentPage, fetchSessions]);

  const update = useCallback(
    async (id: string, input: UpdateSessionInput): Promise<void> => {
      await updateSession(id, input);

      // 更新後のセッションを取得してステートを更新
      const updated = await getSession(id);
      if (updated) {
        setSessions((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await deleteSession(id);
    // 削除後はデータを再取得（ページネーションの整合性のため）
    fetchSessions(currentPage);
  }, [currentPage, fetchSessions]);

  const goToNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [pagination.hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [pagination.hasPrevPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [pagination.totalPages]);

  return {
    sessions,
    isLoading,
    error,
    pagination,
    update,
    remove,
    refresh: () => fetchSessions(currentPage),
    goToNextPage,
    goToPrevPage,
    goToPage,
  };
};
