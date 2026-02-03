'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresets } from '@/hooks/usePresets';
import { Header, TabBar } from '@/components/layout/Header';
import { PresetCard } from '@/components/features/presets/PresetCard';
import { PresetFormModal } from '@/components/features/presets/PresetFormModal';
import { PresetDeleteModal } from '@/components/features/presets/PresetDeleteModal';
import { PomodoroPreset, CreatePresetInput } from '@/types/preset';

export default function PresetsPage() {
  const router = useRouter();
  const { presets, isLoading, error, create, update, remove, setActive } = usePresets();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PomodoroPreset | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<PomodoroPreset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreate = () => {
    setEditingPreset(null);
    setShowFormModal(true);
  };

  const handleEdit = (preset: PomodoroPreset) => {
    setEditingPreset(preset);
    setShowFormModal(true);
  };

  const handleSubmit = async (data: CreatePresetInput) => {
    if (editingPreset) {
      await update(editingPreset.id, data);
    } else {
      await create(data);
    }
  };

  const handleDelete = async () => {
    if (!deletingPreset) return;

    try {
      await remove(deletingPreset.id);
    } catch (e) {
      if (e instanceof Error) {
        showToast(e.message);
      }
      throw e;
    }
  };

  const handleSetActive = async (preset: PomodoroPreset) => {
    await setActive(preset.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← 戻る
            </button>
            <h1 className="text-xl font-bold">ポモドーロプリセット管理</h1>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
          >
            <span>+</span>
            <span>新規作成</span>
          </button>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        )}

        {/* エラー */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
            {error.message}
          </div>
        )}

        {/* プリセット一覧 */}
        {!isLoading && presets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            プリセットがありません。「新規作成」ボタンからプリセットを作成してください。
          </div>
        )}

        <div className="space-y-4">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onEdit={() => handleEdit(preset)}
              onDelete={() => setDeletingPreset(preset)}
              onSetActive={() => handleSetActive(preset)}
            />
          ))}
        </div>
      </main>

      <TabBar />

      {/* 作成/編集モーダル */}
      <PresetFormModal
        isOpen={showFormModal}
        preset={editingPreset}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
      />

      {/* 削除確認モーダル */}
      <PresetDeleteModal
        isOpen={!!deletingPreset}
        presetName={deletingPreset?.name || ''}
        isActive={deletingPreset?.isActive || false}
        onClose={() => setDeletingPreset(null)}
        onConfirm={handleDelete}
      />

      {/* トースト */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
