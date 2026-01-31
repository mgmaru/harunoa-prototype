'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Project, UpdateProjectInput } from '@/types/project';

type ProjectEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateProjectInput) => Promise<void>;
  project: Project | null;
};

export const ProjectEditModal = ({
  isOpen,
  onClose,
  onSave,
  project,
}: ProjectEditModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('プロジェクト名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(project.id, {
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
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="プロジェクト編集">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="edit-project-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            プロジェクト名 <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            色
          </label>
          <ColorPicker value={color} onChange={setColor} />
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
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
};
