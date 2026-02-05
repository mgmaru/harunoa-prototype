'use client';

import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import { Header, TabBar } from '@/components/layout/Header';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import {
  SessionList,
  SessionEditModal,
  DeleteConfirmModal,
} from '@/components/features/history';
import { Session, UpdateSessionInput } from '@/types/session';

type QuickDate = {
  label: string;
  date: Date;
};

export default function HistoryPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { projects } = useProjects();
  const {
    sessions,
    isLoading,
    update,
    remove,
    error,
    pagination,
    goToNextPage,
    goToPrevPage,
  } = useSessions(selectedDate, {
    projectId: selectedProjectId || undefined,
  });

  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);

  const quickDates: QuickDate[] = useMemo(
    () => [
      { label: '今日', date: today },
      { label: '昨日', date: subDays(today, 1) },
    ],
    [today]
  );

  const isSelectedDate = (date: Date): boolean => {
    return format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };

  const handleEditSave = async (input: UpdateSessionInput) => {
    if (!editingSession) return;
    await update(editingSession.id, input);
    setEditingSession(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSession) return;
    await remove(deletingSession.id);
    setDeletingSession(null);
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">履歴</h1>

        {/* 日付フィルタ */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickDates.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setSelectedDate(q.date)}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]',
                isSelectedDate(q.date)
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              {q.label}
            </button>
          ))}
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="border border-gray-300 rounded-lg px-4 py-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="日付を選択"
          />
        </div>

        {/* プロジェクトフィルタ */}
        <div className="mb-6">
          <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
            プロジェクト
          </label>
          <select
            id="project-filter"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 min-h-[44px] w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">すべてのプロジェクト</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* 選択日表示 */}
        <p className="text-gray-600 mb-4">
          {format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
        </p>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error.message}
          </div>
        )}

        {/* セッション一覧 */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : (
          <SessionList
            sessions={sessions}
            projects={projects}
            onEdit={setEditingSession}
            onDelete={setDeletingSession}
          />
        )}

        {/* ページネーション */}
        {!isLoading && pagination.totalCount > 0 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={!pagination.hasPrevPage}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]',
                pagination.hasPrevPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              aria-label="前のページへ"
            >
              &lt; 前へ
            </button>
            <span className="text-gray-700">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={goToNextPage}
              disabled={!pagination.hasNextPage}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px]',
                pagination.hasNextPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              aria-label="次のページへ"
            >
              次へ &gt;
            </button>
          </div>
        )}

        {/* 件数表示 */}
        {!isLoading && pagination.totalCount > 0 && (
          <p className="mt-2 text-center text-sm text-gray-500">
            全{pagination.totalCount}件
          </p>
        )}
      </main>

      <TabBar />

      {/* 編集モーダル */}
      <SessionEditModal
        isOpen={editingSession !== null}
        onClose={() => setEditingSession(null)}
        onSave={handleEditSave}
        session={editingSession}
        project={editingSession ? getProject(editingSession.projectId) : undefined}
      />

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={deletingSession !== null}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleDeleteConfirm}
        session={deletingSession}
        project={deletingSession ? getProject(deletingSession.projectId) : undefined}
      />
    </div>
  );
}
