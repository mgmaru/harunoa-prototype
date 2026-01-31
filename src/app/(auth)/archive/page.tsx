'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useArchivedProjects } from '@/hooks/useArchivedProjects';
import { Header, TabBar } from '@/components/layout/Header';
import { ArchivedProjectList } from '@/components/features/project/ProjectList';
import { ConfirmModal } from '@/components/ui/Modal';

export default function ArchivePage() {
  const { projects, isLoading, error, restore } = useArchivedProjects();

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const projectToRestore = projects.find((p) => p.id === confirmRestoreId);

  const handleRestoreConfirm = async (): Promise<void> => {
    if (!confirmRestoreId) return;

    setIsRestoring(true);
    setRestoringId(confirmRestoreId);
    try {
      await restore(confirmRestoreId);
      setConfirmRestoreId(null);
    } catch (e) {
      console.error('Failed to restore project:', e);
    } finally {
      setIsRestoring(false);
      setRestoringId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← 戻る
          </Link>
          <h1 className="text-2xl font-bold">アーカイブ一覧</h1>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error.message}
          </div>
        )}

        {/* アーカイブ一覧 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ArchivedProjectList
            projects={projects}
            onRestore={(id) => setConfirmRestoreId(id)}
            restoringId={restoringId}
          />
        )}
      </main>

      <TabBar />

      {/* 復帰確認モーダル */}
      <ConfirmModal
        isOpen={confirmRestoreId !== null}
        onClose={() => setConfirmRestoreId(null)}
        onConfirm={handleRestoreConfirm}
        title="プロジェクトを復帰"
        message={`「${projectToRestore?.name}」を復帰しますか？`}
        confirmLabel="復帰"
        isLoading={isRestoring}
      />
    </div>
  );
}
