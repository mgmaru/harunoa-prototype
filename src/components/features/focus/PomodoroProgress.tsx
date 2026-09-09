'use client';

import { PomodoroPhase } from '@/stores/pomodoroStore';
import { formatTimeMs } from '@/lib/date/format';

const SkipForwardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

type Props = {
  phase: PomodoroPhase;
  remainingMs: number;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  onSkip: () => void;
  onStartFocus: () => void;
};

export const PomodoroProgress = ({
  phase,
  remainingMs,
  focusDurationMinutes,
  breakDurationMinutes,
  onSkip,
  onStartFocus,
}: Props) => {
  const totalMs =
    phase === 'focus'
      ? focusDurationMinutes * 60 * 1000
      : breakDurationMinutes * 60 * 1000;

  const progress = totalMs > 0 ? ((totalMs - remainingMs) / totalMs) * 100 : 0;

  const phaseLabel = phase === 'focus' ? '集中' : phase === 'break' ? '休憩' : '待機';
  const phaseColor = phase === 'focus' ? 'bg-green-500' : 'bg-blue-500';

  const totalMinutes = phase === 'focus' ? focusDurationMinutes : breakDurationMinutes;
  const totalFormatted = formatTimeMs(totalMinutes * 60 * 1000);

  // 待機中（休憩終了後）は次の集中を手動で開始できるようにする
  if (phase === 'idle') {
    return (
      <div className="w-full">
        <div className="h-2 bg-gray-600 rounded-full mb-2" />

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">
            ポモドーロ: {phaseLabel}中（{formatTimeMs(focusDurationMinutes * 60 * 1000)}）
          </span>

          <button
            onClick={onStartFocus}
            className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
          >
            <PlayIcon />
            <span>集中を開始</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* プログレスバー */}
      <div className="h-2 bg-gray-600 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${phaseColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 状態と残り時間 */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300">
          {phaseLabel}: {formatTimeMs(remainingMs)} / {totalFormatted}
        </span>

        {/* 休憩中のみスキップボタン */}
        {phase === 'break' && (
          <button
            onClick={onSkip}
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <SkipForwardIcon />
            <span>スキップ</span>
          </button>
        )}
      </div>
    </div>
  );
};
