'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorDot } from '@/components/ui/ColorPicker';
import { formatDurationMs } from '@/lib/date/format';
import { Session, UpdateSessionInput } from '@/types/session';
import { Project } from '@/types/project';

type SessionEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: UpdateSessionInput) => Promise<void>;
  session: Session | null;
  project: Project | undefined;
};

export const SessionEditModal = ({
  isOpen,
  onClose,
  onSave,
  session,
  project,
}: SessionEditModalProps) => {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setStartAt(format(session.startAt, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(session.endAt, "yyyy-MM-dd'T'HH:mm"));
      setMemo(session.memo);
      setError(null);
    }
  }, [session]);

  const calculatedDuration = useMemo(() => {
    if (!startAt || !endAt) return null;

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    const durationMs = end.getTime() - start.getTime();
    if (durationMs <= 0) {
      return null;
    }

    return formatDurationMs(durationMs);
  }, [startAt, endAt]);

  const validate = (): string | null => {
    if (!startAt || !endAt) {
      return '開始時刻と終了時刻を入力してください';
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    const now = new Date();

    if (start >= end) {
      return '開始時刻は終了時刻より前にしてください';
    }

    if (end > now) {
      return '終了時刻は現在時刻より後にできません';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const start = new Date(startAt);
      const end = new Date(endAt);
      const durationMs = end.getTime() - start.getTime();

      await onSave({
        startAt: start,
        endAt: end,
        durationMs,
        memo,
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

  const projectColor = project?.color ?? '#6B7280';
  const projectName = project?.name ?? '不明なプロジェクト';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="セッション編集">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            プロジェクト
          </label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
            <ColorDot color={projectColor} size="md" />
            <span className="text-gray-700">{projectName}</span>
            <span className="text-xs text-gray-400 ml-auto">変更不可</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="edit-session-start"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            開始時刻 <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-session-start"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="edit-session-end"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            終了時刻 <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-session-end"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {calculatedDuration && (
          <div className="text-sm text-gray-600">
            計測時間: {calculatedDuration}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label
            htmlFor="edit-session-memo"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            メモ
          </label>
          <textarea
            id="edit-session-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="作業内容など..."
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
            保存
          </Button>
        </div>
      </form>
    </Modal>
  );
};
