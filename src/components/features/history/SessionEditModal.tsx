'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ColorDot } from '@/components/ui/ColorPicker';
import {
  formatDurationMs,
  getPausedMs,
  PAUSED_DISPLAY_THRESHOLD_MS,
} from '@/lib/date/format';
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
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 一時停止時間。durationMs は一時停止を除いた計測時間のため、経過時間との差分が該当する
  const pausedMs = useMemo(() => {
    if (!session) return 0;
    return getPausedMs(session.startAt, session.endAt, session.durationMs);
  }, [session]);

  useEffect(() => {
    if (session) {
      setStartAt(format(session.startAt, "yyyy-MM-dd'T'HH:mm"));
      setEndAt(format(session.endAt, "yyyy-MM-dd'T'HH:mm"));
      const hours = Math.floor(session.durationMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (session.durationMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      setDurationHours(hours);
      setDurationMinutes(minutes);
      setMemo(session.memo);
      setError(null);
    }
  }, [session]);

  // 計測時間が変更されたときに終了時刻を更新
  const handleDurationChange = useCallback(
    (hours: number, minutes: number) => {
      if (!startAt) return;

      const start = new Date(startAt);
      if (isNaN(start.getTime())) return;

      const durationMs = (hours * 60 + minutes) * 60 * 1000;
      const newEnd = new Date(start.getTime() + durationMs + pausedMs);
      setEndAt(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
    },
    [startAt, pausedMs]
  );

  const handleStartAtChange = (value: string) => {
    setStartAt(value);
    // 開始時刻変更時は、計測時間を維持して終了時刻を再計算
    if (value) {
      const start = new Date(value);
      if (!isNaN(start.getTime())) {
        const durationMs = (durationHours * 60 + durationMinutes) * 60 * 1000;
        const newEnd = new Date(start.getTime() + durationMs + pausedMs);
        setEndAt(format(newEnd, "yyyy-MM-dd'T'HH:mm"));
      }
    }
  };

  const handleEndAtChange = (value: string) => {
    setEndAt(value);
    // 終了時刻変更時は計測時間を再計算
    if (value && startAt) {
      const start = new Date(startAt);
      const end = new Date(value);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const durationMs = end.getTime() - start.getTime() - pausedMs;
        if (durationMs > 0) {
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          setDurationHours(hours);
          setDurationMinutes(minutes);
        } else {
          setDurationHours(0);
          setDurationMinutes(0);
        }
      }
    }
  };

  const handleHoursChange = (value: string) => {
    const hours = Math.max(0, parseInt(value, 10) || 0);
    setDurationHours(hours);
    handleDurationChange(hours, durationMinutes);
  };

  const handleMinutesChange = (value: string) => {
    const minutes = Math.min(59, Math.max(0, parseInt(value, 10) || 0));
    setDurationMinutes(minutes);
    handleDurationChange(durationHours, minutes);
  };

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

    // 一時停止時間を除いた計測時間が1分未満の場合はエラー
    if (end.getTime() - start.getTime() - pausedMs < 60 * 1000) {
      return '計測時間は1分以上を入力してください';
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
      // durationMs は一時停止を除いた計測時間のため、一時停止時間を除外する
      const durationMs = end.getTime() - start.getTime() - pausedMs;

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
            onChange={(e) => handleStartAtChange(e.target.value)}
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
            onChange={(e) => handleEndAtChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            計測時間 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="edit-session-duration-hours"
              type="number"
              min="0"
              value={durationHours}
              onChange={(e) => handleHoursChange(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
            />
            <span className="text-gray-600">時間</span>
            <input
              id="edit-session-duration-minutes"
              type="number"
              min="0"
              max="59"
              value={durationMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center"
            />
            <span className="text-gray-600">分</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            計測時間を変更すると終了時刻が自動計算されます
          </p>
          {pausedMs >= PAUSED_DISPLAY_THRESHOLD_MS && (
            <p className="text-xs text-gray-500 mt-1">
              一時停止（{formatDurationMs(pausedMs)}）は計測時間に含まれません
            </p>
          )}
        </div>

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
