'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useTimerStore } from '@/stores/timerStore';
import { useNotification } from './useNotification';

export const usePomodoro = () => {
  const pomodoro = usePomodoroStore();
  const { notify } = useNotification();
  const lastTickRef = useRef<number>(Date.now());

  // tick処理から常に最新のnotifyを参照するためのref
  // （notifyを依存配列に入れるとintervalが張り直されてしまう）
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // タイマーのtick処理
  useEffect(() => {
    if (pomodoro.phase === 'idle' || !pomodoro.isEnabled) return;

    const interval = setInterval(() => {
      const timerStatus = useTimerStore.getState().status;
      if (timerStatus !== 'running') {
        lastTickRef.current = Date.now();
        return;
      }
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      const completed = usePomodoroStore.getState().tick(delta);

      // バックグラウンドから復帰した場合は複数のフェーズがまとめて終了しうるため、
      // 最後に終了したフェーズのみ通知する
      const lastCompleted = completed[completed.length - 1];

      if (lastCompleted === 'focus') {
        notifyRef.current({
          title: '集中時間終了',
          message: '休憩を取りましょう',
          sound: 'focus',
        });
      } else if (lastCompleted === 'break') {
        notifyRef.current({
          title: '休憩終了',
          message: '次の集中を開始できます',
          sound: 'break',
        });
      }
    }, 100);

    return () => clearInterval(interval);
    // Zustandストアの関数参照は安定しているため、個別のプロパティのみ依存
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoro.phase, pomodoro.isEnabled]);

  // 待機中はtickが停止しており前回tick時刻が古いままのため、
  // 手動でフェーズを開始する際は基準時刻を更新してから開始する
  const startFocus = useCallback(() => {
    lastTickRef.current = Date.now();
    usePomodoroStore.getState().startFocus();
  }, []);

  const skipBreak = useCallback(() => {
    lastTickRef.current = Date.now();
    usePomodoroStore.getState().skipBreak();
  }, []);

  // タイマー計測開始時にポモドーロも開始
  // Zustandストアから直接最新の状態を取得することで、
  // useCallbackの依存配列の問題を回避
  const startWithTimer = useCallback(() => {
    const state = usePomodoroStore.getState();
    if (state.isEnabled && state.phase === 'idle') {
      lastTickRef.current = Date.now();
      state.startFocus();
    }
  }, []);

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
    startFocus,
    skipBreak,
    stop: pomodoro.stop,
    startWithTimer,
    stopWithTimer,
    isFocus: pomodoro.phase === 'focus',
    isBreak: pomodoro.phase === 'break',
    isIdle: pomodoro.phase === 'idle',
  };
};
