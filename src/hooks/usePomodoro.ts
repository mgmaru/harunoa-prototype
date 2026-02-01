'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useNotification } from './useNotification';

export const usePomodoro = () => {
  const pomodoro = usePomodoroStore();
  const { notify } = useNotification();
  const lastTickRef = useRef<number>(Date.now());
  const prevRemainingRef = useRef(pomodoro.remainingMs);

  // タイマーのtick処理
  useEffect(() => {
    if (pomodoro.phase === 'idle' || !pomodoro.isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      pomodoro.tick(delta);
    }, 100);

    return () => clearInterval(interval);
    // Zustandストアの関数参照は安定しているため、個別のプロパティのみ依存
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.phase, pomodoro.isEnabled]);

  // 時間切れの検知と通知
  useEffect(() => {
    const wasRunning = prevRemainingRef.current > 0;
    const isFinished = pomodoro.remainingMs === 0;

    if (wasRunning && isFinished && pomodoro.phase !== 'idle') {
      if (pomodoro.phase === 'focus') {
        notify({
          title: '集中時間終了',
          message: '休憩を取りましょう',
          sound: 'focus',
        });
        pomodoro.startBreak();
      } else if (pomodoro.phase === 'break') {
        notify({
          title: '休憩終了',
          message: '次の集中を開始できます',
          sound: 'break',
        });
        pomodoro.stop();
      }
    }

    prevRemainingRef.current = pomodoro.remainingMs;
    // Zustandストアの関数参照は安定している
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.remainingMs, pomodoro.phase, notify]);

  // タイマー計測開始時にポモドーロも開始
  const startWithTimer = useCallback(() => {
    if (pomodoro.isEnabled && pomodoro.phase === 'idle') {
      lastTickRef.current = Date.now();
      pomodoro.startFocus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.isEnabled, pomodoro.phase]);

  // タイマー停止時にポモドーロも停止
  const stopWithTimer = useCallback(() => {
    pomodoro.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase: pomodoro.phase,
    remainingMs: pomodoro.remainingMs,
    isEnabled: pomodoro.isEnabled,
    focusDurationMinutes: pomodoro.focusDurationMinutes,
    breakDurationMinutes: pomodoro.breakDurationMinutes,
    presetId: pomodoro.presetId,
    setPreset: pomodoro.setPreset,
    startFocus: pomodoro.startFocus,
    skipBreak: pomodoro.skipBreak,
    stop: pomodoro.stop,
    startWithTimer,
    stopWithTimer,
    isFocus: pomodoro.phase === 'focus',
    isBreak: pomodoro.phase === 'break',
    isIdle: pomodoro.phase === 'idle',
  };
};
