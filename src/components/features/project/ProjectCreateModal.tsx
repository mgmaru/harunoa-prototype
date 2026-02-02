'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { CreateProjectInput } from '@/types/project';

type ProjectCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
  existingNames?: string[];
};

export const ProjectCreateModal = ({
  isOpen,
  onClose,
  onCreate,
  existingNames = [],
}: ProjectCreateModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 重複警告の表示判定
  const isDuplicate = useMemo(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    return existingNames.some((n) => n === trimmedName);
  }, [name, existingNames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('プロジェクト名を入力してください');
      return;
    }

    // 重複があっても作成は許可（警告のみ）
    setIsSubmitting(true);
    try {
      await onCreate({
        name: trimmedName,
        color: color ?? undefined,
      });
      handleClose();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setColor(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="プロジェクト作成">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="project-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            プロジェクト名 <span className="text-red-500">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 英語学習"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          {isDuplicate && (
            <p className="mt-1 text-sm text-amber-600">
              同じ名前のプロジェクトが既に存在します
            </p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            色（任意）
          </label>
          <ColorPicker
            value={color}
            onChange={setColor}
            showAutoOption
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            作成
          </Button>
        </div>
      </form>
    </Modal>
  );
};
