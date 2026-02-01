'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getSessionsByDate,
  updateSession,
  deleteSession,
  getSession,
} from '@/services/sessions';
import { Session, UpdateSessionInput } from '@/types/session';

type UseSessionsOptions = {
  /** 取得する最大件数 */
  limit?: number;
};

type UseSessionsReturn = {
  /** セッション一覧 */
  sessions: Session[];
  /** 読み込み中フラグ */
  isLoading: boolean;
  /** エラー */
  error: Error | null;
  /** セッションを更新 */
  update: (id: string, input: UpdateSessionInput) => Promise<void>;
  /** セッションを削除 */
  remove: (id: string) => Promise<void>;
  /** データを再取得 */
  refresh: () => Promise<void>;
};

/**
 * 指定日付のセッション一覧を取得・操作するフック
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

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getSessionsByDate(user.uid, date, {
        limit: options?.limit,
      });
      setSessions(data);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
      setError(e instanceof Error ? e : new Error('セッションの取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [user, date, options?.limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sessions,
    isLoading,
    error,
    update,
    remove,
    refresh: fetchSessions,
  };
};
