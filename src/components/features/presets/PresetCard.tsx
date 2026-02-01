'use client';

import { PomodoroPreset, NotificationSound } from '@/types/preset';

type Props = {
  preset: PomodoroPreset;
  onEdit: () => void;
  onDelete: () => void;
  onSetActive: () => void;
};

const SOUND_LABELS: Record<NotificationSound, string> = {
  none: '無音',
  bell: 'ベル',
  chime: 'チャイム',
};

export const PresetCard = ({ preset, onEdit, onDelete, onSetActive }: Props) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              preset.isActive ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          />
          <span className="font-medium">{preset.name}</span>
          {preset.isActive && (
            <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
              利用中
            </span>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 space-y-1 mb-3">
        <p>
          集中: {preset.focusDurationMinutes}分 / 休憩: {preset.breakDurationMinutes}分
        </p>
        <p className="text-xs text-gray-500">
          通知音: 集中終了 {SOUND_LABELS[preset.focusEndSound]} / 休憩終了{' '}
          {SOUND_LABELS[preset.breakEndSound]}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
        <button
          onClick={onDelete}
          disabled={preset.isActive}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={preset.isActive ? '利用中のプリセットは削除できません' : ''}
        >
          削除
        </button>
        {!preset.isActive && (
          <button
            onClick={onSetActive}
            className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 border border-primary-300 rounded hover:bg-primary-50 transition-colors"
          >
            利用する
          </button>
        )}
      </div>
    </div>
  );
};
