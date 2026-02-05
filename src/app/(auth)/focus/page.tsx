'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTimer } from '@/hooks/useTimer';
import { formatTimeMs } from '@/lib/date/format';
import { MemoOverlay } from '@/components/features/timer/MemoOverlay';
import { ExitConfirmModal } from '@/components/features/timer/ExitConfirmModal';
import { PomodoroProgress } from '@/components/features/focus/PomodoroProgress';

// SVG Icons
const PauseIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const SkipIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM14.5 12L6 18V6l8.5 6zm0 0L23 12l-8.5-6v12z" />
  </svg>
);

const StopIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const MemoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

export default function FocusPage() {
  const router = useRouter();
  const timer = useTimer();
  const [showMemoOverlay, setShowMemoOverlay] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // 計測していない場合は計測画面にリダイレクト
  useEffect(() => {
    if (timer.isStopped) {
      router.push('/timer');
    }
  }, [timer.isStopped, router]);

  const handleBack = () => {
    if (!timer.isStopped) {
      setShowExitConfirm(true);
    } else {
      router.push('/');
    }
  };

  const handleExitWithContinue = () => {
    setShowExitConfirm(false);
    router.push('/');
  };

  const handleExitWithStop = async () => {
    setIsStopping(true);
    try {
      await timer.stop();
      setShowExitConfirm(false);
      if (navigator.onLine) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await timer.stop();
      if (navigator.onLine) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to stop timer:', error);
    } finally {
      setIsStopping(false);
    }
  };

  // 計測していない場合は何も表示しない（リダイレクト中）
  if (timer.isStopped) {
    return null;
  }

  // ポモドーロ休憩中かどうか
  const isBreak = timer.pomodoro.isBreak;

  // 状態表示テキスト
  const getStatusText = () => {
    if (isBreak) return '休憩中';
    if (timer.isRunning) return '記録中';
    if (timer.isPaused) return '一時停止中';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-4">
        <button
          onClick={handleBack}
          className="text-white hover:text-gray-300 transition-colors px-2 py-1 flex items-center gap-1"
        >
          <BackIcon />
          <span>戻る</span>
        </button>
        <button
          onClick={() => setShowMemoOverlay(true)}
          className="text-white hover:text-gray-300 transition-colors px-2 py-1 flex items-center gap-1"
        >
          <MemoIcon />
          <span>メモ</span>
        </button>
      </div>

      {/* メイン */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* プロジェクト名 */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: timer.projectColor || '#3B82F6' }}
          />
          <span className="text-xl">{timer.projectName}</span>
        </div>

        {/* 状態 */}
        <div className="text-lg text-gray-400 mb-8">{getStatusText()}</div>

        {/* 経過時間（休憩中はポモドーロの残り時間を大きく表示） */}
        <div className="text-6xl md:text-7xl font-mono mb-12 tabular-nums">
          {isBreak
            ? formatTimeMs(timer.pomodoro.remainingMs)
            : formatTimeMs(timer.elapsedMs)}
        </div>

        {/* 操作ボタン */}
        <div className="flex gap-8">
          {/* 記録中：一時停止ボタン */}
          {timer.isRunning && !isBreak && (
            <button
              onClick={timer.pause}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors shadow-lg"
              aria-label="一時停止"
            >
              <PauseIcon />
            </button>
          )}

          {/* 一時停止中：再開ボタン */}
          {timer.isPaused && !isBreak && (
            <button
              onClick={timer.resume}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg"
              aria-label="再開"
            >
              <PlayIcon />
            </button>
          )}

          {/* 休憩中：スキップボタン */}
          {isBreak && (
            <button
              onClick={timer.pomodoro.skipBreak}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors shadow-lg"
              aria-label="スキップ"
            >
              <SkipIcon />
            </button>
          )}

          {/* 停止ボタン（常に表示） */}
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
            aria-label="停止"
          >
            <StopIcon />
          </button>
        </div>
      </div>

      {/* ポモドーロ進捗（有効時のみ表示） */}
      {timer.pomodoro.isEnabled && !timer.pomodoro.isIdle && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <PomodoroProgress
            phase={timer.pomodoro.phase}
            remainingMs={timer.pomodoro.remainingMs}
            focusDurationMinutes={timer.pomodoro.focusDurationMinutes}
            breakDurationMinutes={timer.pomodoro.breakDurationMinutes}
            onSkip={timer.pomodoro.skipBreak}
          />
        </div>
      )}

      {/* メモオーバーレイ */}
      <MemoOverlay
        isOpen={showMemoOverlay}
        value={timer.memo}
        onSave={timer.setMemo}
        onClose={() => setShowMemoOverlay(false)}
      />

      {/* 離脱確認モーダル */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onContinue={handleExitWithContinue}
        onStop={handleExitWithStop}
        isLoading={isStopping}
      />
    </div>
  );
}
