'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorDot } from '@/components/ui/ColorPicker';
import { formatSessionDuration } from '@/lib/date/format';
import { Session } from '@/types/session';
import { Project } from '@/types/project';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  session: Session | null;
  project: Project | undefined;
};

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  session,
  project,
}: DeleteConfirmModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch {
      setError('削除に失敗しました。もう一度お試しください。');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!session) return null;

  const projectColor = project?.color ?? '#6B7280';
  const projectName = project?.name ?? '不明なプロジェクト';
  const startTime = format(session.startAt, 'HH:mm');
  const endTime = format(session.endAt, 'HH:mm');
  const duration = formatSessionDuration(
    session.startAt,
    session.endAt,
    session.durationMs
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="セッション削除">
      <div className="space-y-4">
        <p className="text-gray-600">このセッションを削除しますか？</p>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <ColorDot color={projectColor} size="lg" />
          <div>
            <p className="font-medium text-gray-900">{projectName}</p>
            <p className="text-sm text-gray-600">
              {startTime} - {endTime}（{duration}）
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          ※ この操作は取り消せません
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            削除
          </Button>
        </div>
      </div>
    </Modal>
  );
};
