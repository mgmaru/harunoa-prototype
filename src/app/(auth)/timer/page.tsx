'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProjects } from '@/hooks/useProjects';
import { useTimer } from '@/hooks/useTimer';
import { Header, TabBar } from '@/components/layout/Header';
import { SwitchWarningModal } from '@/components/features/timer/SwitchWarningModal';

export default function TimerPage() {
  const router = useRouter();
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const timer = useTimer();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleStart = () => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    // 計測中で別のプロジェクトの場合は警告を表示
    if (!timer.isStopped && timer.projectId !== selectedProjectId) {
      setShowSwitchWarning(true);
      return;
    }

    // 同じプロジェクトで計測中の場合はそのまま集中モードへ
    if (!timer.isStopped && timer.projectId === selectedProjectId) {
      router.push('/focus');
      return;
    }

    // 新規計測開始
    timer.start({ id: project.id, name: project.name, color: project.color });
    router.push('/focus');
  };

  const handleSwitchConfirm = async () => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project) return;

    setIsSwitching(true);
    try {
      // 現在の計測を停止
      await timer.stop();

      // 新しい計測を開始
      timer.start({ id: project.id, name: project.name, color: project.color });
      setShowSwitchWarning(false);
      router.push('/focus');
    } catch (error) {
      console.error('Failed to switch project:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">計測</h1>

        {/* 計測中の表示 */}
        {!timer.isStopped && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: timer.projectColor || '#3B82F6' }}
              />
              <span className="font-medium text-primary-700">計測中</span>
            </div>
            <p className="text-primary-600">{timer.projectName}</p>
            <button
              onClick={() => router.push('/focus')}
              className="mt-2 text-sm text-primary-600 hover:underline"
            >
              集中モードを開く →
            </button>
          </div>
        )}

        {/* プロジェクト選択 */}
        <div className="mb-6">
          <label htmlFor="project-select" className="block text-sm font-medium mb-2">
            プロジェクト選択 <span className="text-red-500">*</span>
          </label>
          {isProjectsLoading ? (
            <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
              読み込み中...
            </div>
          ) : (
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {!selectedProjectId && projects.length === 0 && !isProjectsLoading && (
            <p className="mt-2 text-sm text-gray-500">
              プロジェクトがありません。
              <Link href="/" className="text-primary-600 hover:underline">
                ホームでプロジェクトを作成
              </Link>
              してください。
            </p>
          )}
        </div>

        {/* プリセット選択（Phase 9で実装） */}
        <div className="mb-8">
          <label htmlFor="preset-select" className="block text-sm font-medium mb-2">
            ポモドーロプリセット（任意）
          </label>
          <select
            id="preset-select"
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed"
          >
            <option value="">使用しない</option>
          </select>
          <Link
            href="/presets"
            className="text-primary-600 text-sm mt-2 inline-block hover:underline"
          >
            プリセット管理 →
          </Link>
        </div>

        {/* 計測開始ボタン */}
        <button
          onClick={handleStart}
          disabled={!selectedProjectId}
          className="w-full bg-primary-600 text-white text-xl py-6 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ▶ 計測開始
        </button>
      </main>

      <TabBar />

      {/* 計測切替警告モーダル */}
      <SwitchWarningModal
        isOpen={showSwitchWarning}
        currentProjectName={timer.projectName || ''}
        onCancel={() => setShowSwitchWarning(false)}
        onConfirm={handleSwitchConfirm}
        isLoading={isSwitching}
      />
    </div>
  );
}
