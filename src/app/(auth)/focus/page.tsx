'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTimer } from '@/hooks/useTimer';
import { formatTimeMs } from '@/lib/date/format';
import { MemoOverlay } from '@/components/features/timer/MemoOverlay';
import { ExitConfirmModal } from '@/components/features/timer/ExitConfirmModal';
import { PomodoroProgress } from '@/components/features/focus/PomodoroProgress';

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
      router.push('/');
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
      router.push('/');
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
          className="text-white hover:text-gray-300 transition-colors px-2 py-1"
        >
          ← 戻る
        </button>
        <button
          onClick={() => setShowMemoOverlay(true)}
          className="text-white hover:text-gray-300 transition-colors px-2 py-1"
        >
          📝 メモ
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
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-2xl transition-colors"
              aria-label="一時停止"
            >
              ⏸
            </button>
          )}

          {/* 一時停止中：再開ボタン */}
          {timer.isPaused && !isBreak && (
            <button
              onClick={timer.resume}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-2xl transition-colors"
              aria-label="再開"
            >
              ▶
            </button>
          )}

          {/* 休憩中：スキップボタン */}
          {isBreak && (
            <button
              onClick={timer.pomodoro.skipBreak}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center text-2xl transition-colors"
              aria-label="スキップ"
            >
              ⏭
            </button>
          )}

          {/* 停止ボタン（常に表示） */}
          <button
            onClick={handleStop}
            disabled={isStopping}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-2xl transition-colors disabled:opacity-50"
            aria-label="停止"
          >
            ⏹
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
