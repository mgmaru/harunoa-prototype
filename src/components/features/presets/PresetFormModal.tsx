'use client';

import { useState, useEffect } from 'react';
import { CreatePresetInput, NotificationSound, PomodoroPreset } from '@/types/preset';

type Props = {
  isOpen: boolean;
  preset: PomodoroPreset | null;
  onClose: () => void;
  onSubmit: (data: CreatePresetInput) => Promise<void>;
};

const SOUND_OPTIONS: { value: NotificationSound; label: string }[] = [
  { value: 'none', label: '無音' },
  { value: 'bell', label: 'ベル' },
  { value: 'chime', label: 'チャイム' },
];

/** デフォルトプリセット名 */
const DEFAULT_PRESET_NAME = 'デフォルト';

/** テストモード判定（環境変数で切り替え） */
const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

/** バリデーション値（テストモードでは緩和） */
const MIN_FOCUS_TIME = isTestMode ? 1 : 25;
const MIN_BREAK_TIME = isTestMode ? 1 : 5;

export const PresetFormModal = ({ isOpen, preset, onClose, onSubmit }: Props) => {
  const [name, setName] = useState('');
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);
  const [focusEndSound, setFocusEndSound] = useState<NotificationSound>('bell');
  const [breakEndSound, setBreakEndSound] = useState<NotificationSound>('chime');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!preset;
  const isDefaultPreset = preset?.name === DEFAULT_PRESET_NAME;

  // プリセット編集時は初期値を設定
  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setFocusDurationMinutes(preset.focusDurationMinutes);
      setBreakDurationMinutes(preset.breakDurationMinutes);
      setFocusEndSound(preset.focusEndSound);
      setBreakEndSound(preset.breakEndSound);
    } else {
      setName('');
      setFocusDurationMinutes(25);
      setBreakDurationMinutes(5);
      setFocusEndSound('bell');
      setBreakEndSound('chime');
    }
    setErrors({});
  }, [preset, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'プリセット名を入力してください';
    }

    if (focusDurationMinutes < MIN_FOCUS_TIME) {
      newErrors.focusDurationMinutes = `集中時間は${MIN_FOCUS_TIME}分以上で設定してください`;
    }

    if (breakDurationMinutes < MIN_BREAK_TIME) {
      newErrors.breakDurationMinutes = `休憩時間は${MIN_BREAK_TIME}分以上で設定してください`;
    } else if (breakDurationMinutes > 10) {
      newErrors.breakDurationMinutes =
        '休憩時間は10分以内で設定してください。長い休憩はタイマーの停止・一時停止をご利用ください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        focusDurationMinutes,
        breakDurationMinutes,
        focusEndSound,
        breakEndSound,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">
            {isEditing ? 'プリセット編集' : 'プリセット作成'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* プリセット名 */}
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium mb-1">
              プリセット名 <span className="text-red-500">*</span>
            </label>
            <input
              id="preset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isDefaultPreset}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              placeholder="例: デフォルト"
            />
            {isDefaultPreset && (
              <p className="mt-1 text-sm text-gray-500">デフォルトプリセットの名前は変更できません</p>
            )}
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* 集中時間 */}
          <div>
            <label htmlFor="focus-duration" className="block text-sm font-medium mb-1">
              集中時間 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="focus-duration"
                type="number"
                min={MIN_FOCUS_TIME}
                max={120}
                value={focusDurationMinutes}
                onChange={(e) => setFocusDurationMinutes(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-gray-600">分</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">※ {MIN_FOCUS_TIME}分以上で設定してください</p>
            {errors.focusDurationMinutes && (
              <p className="mt-1 text-sm text-red-500">{errors.focusDurationMinutes}</p>
            )}
          </div>

          {/* 休憩時間 */}
          <div>
            <label htmlFor="break-duration" className="block text-sm font-medium mb-1">
              休憩時間 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="break-duration"
                type="number"
                min={MIN_BREAK_TIME}
                max={10}
                value={breakDurationMinutes}
                onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <span className="text-gray-600">分</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">※ {MIN_BREAK_TIME}〜10分で設定してください</p>
            {errors.breakDurationMinutes && (
              <p className="mt-1 text-sm text-red-500">{errors.breakDurationMinutes}</p>
            )}
          </div>

          {/* 通知音（集中終了） */}
          <div>
            <label htmlFor="focus-sound" className="block text-sm font-medium mb-1">
              通知音（集中終了）
            </label>
            <select
              id="focus-sound"
              value={focusEndSound}
              onChange={(e) => setFocusEndSound(e.target.value as NotificationSound)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SOUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 通知音（休憩終了） */}
          <div>
            <label htmlFor="break-sound" className="block text-sm font-medium mb-1">
              通知音（休憩終了）
            </label>
            <select
              id="break-sound"
              value={breakEndSound}
              onChange={(e) => setBreakEndSound(e.target.value as NotificationSound)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SOUND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : isEditing ? '保存' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
