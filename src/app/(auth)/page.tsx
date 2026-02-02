'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStats, PeriodType } from '@/hooks/useProjectStats';
import { Header, TabBar } from '@/components/layout/Header';
import { ProjectList } from '@/components/features/project/ProjectList';
import { ProjectCreateModal } from '@/components/features/project/ProjectCreateModal';
import { ProjectEditModal } from '@/components/features/project/ProjectEditModal';
import { ConfirmModal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import Link from 'next/link';
import clsx from 'clsx';

type Period = PeriodType;

const PERIOD_LABELS: Record<Period, string> = {
  day: '当日',
  week: '当週',
  month: '当月',
};

export default function HomePage() {
  const { projects, isLoading, error, create, update, archive } = useProjects();
  const [period, setPeriod] = useState<Period>('week');
  const { stats: projectStats } = useProjectStats(projects, period);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [archivingProject, setArchivingProject] = useState<Project | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleCreate = async (input: CreateProjectInput): Promise<void> => {
    await create(input);
  };

  const handleUpdate = async (
    id: string,
    input: UpdateProjectInput
  ): Promise<void> => {
    await update(id, input);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (!archivingProject) return;

    setIsArchiving(true);
    try {
      await archive(archivingProject.id);
      setArchivingProject(null);
    } catch (e) {
      console.error('Failed to archive project:', e);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsCreateModalOpen(true)}>
              + 新規作成
            </Button>
            <Link
              href="/archive"
              className="px-4 py-2 text-gray-600 hover:underline text-sm"
            >
              アーカイブ
            </Link>
          </div>
        </div>

        {/* 期間切替 */}
        <div className="flex gap-2 mb-6">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error.message}
          </div>
        )}

        {/* プロジェクト一覧 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ProjectList
            projects={projects}
            projectStats={projectStats}
            onEdit={setEditingProject}
            onArchive={setArchivingProject}
          />
        )}
      </main>

      <TabBar />

      {/* モーダル */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
        existingNames={projects.map((p) => p.name)}
      />

      <ProjectEditModal
        isOpen={editingProject !== null}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdate}
        project={editingProject}
      />

      <ConfirmModal
        isOpen={archivingProject !== null}
        onClose={() => setArchivingProject(null)}
        onConfirm={handleArchiveConfirm}
        title="プロジェクトをアーカイブ"
        message={`「${archivingProject?.name}」をアーカイブしますか？アーカイブしたプロジェクトは後から復帰できます。`}
        confirmLabel="アーカイブ"
        isLoading={isArchiving}
      />
    </div>
  );
}
