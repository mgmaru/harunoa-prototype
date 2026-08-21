'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { saveSession } from '@/lib/timer/saveSession';
import { useAuth } from './useAuth';
import { Session } from '@/types/session';
import { usePomodoro } from './usePomodoro';

export const useTimer = () => {
  const timer = useTimerStore();
  const { user } = useAuth();
  const [elapsedMs, setElapsedMs] = useState(0);
  const pomodoro = usePomodoro();

  // 経過時間の更新（100ms間隔）
  useEffect(() => {
    if (timer.status !== 'running' || !timer.startAt) {
      return;
    }

    const updateElapsed = () => {
      setElapsedMs(Date.now() - timer.startAt! - timer.totalPausedMs);
    };

    // 初回更新
    updateElapsed();

    const interval = setInterval(updateElapsed, 100);
    return () => clearInterval(interval);
  }, [timer.status, timer.startAt, timer.totalPausedMs]);

  // 一時停止中の経過時間を固定
  useEffect(() => {
    if (timer.status === 'paused' && timer.startAt && timer.pausedAt) {
      setElapsedMs(timer.pausedAt - timer.startAt - timer.totalPausedMs);
    }
  }, [timer.status, timer.startAt, timer.pausedAt, timer.totalPausedMs]);

  // 停止時の経過時間リセット
  useEffect(() => {
    if (timer.status === 'stopped') {
      setElapsedMs(0);
    }
  }, [timer.status]);

  // タイマー開始時にポモドーロも開始
  const handleStart = useCallback(
    (project: { id: string; name: string; color: string }) => {
      timer.start(project);
      pomodoro.startWithTimer();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleStop = useCallback(async (): Promise<Session | null> => {
    const sessionData = timer.stop();
    pomodoro.stopWithTimer();

    if (!sessionData || !user) {
      return null;
    }

    const sessionInput = {
      projectId: sessionData.projectId,
      startAt: sessionData.startAt,
      endAt: sessionData.endAt,
      durationMs: sessionData.durationMs,
      memo: sessionData.memo,
    };

    const session = await saveSession(user.uid, sessionInput);
    setElapsedMs(0);
    return session;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    // State
    status: timer.status,
    projectId: timer.projectId,
    projectName: timer.projectName,
    projectColor: timer.projectColor,
    memo: timer.memo,
    elapsedMs,

    // Actions
    start: handleStart,
    pause: timer.pause,
    resume: timer.resume,
    stop: handleStop,
    setMemo: timer.setMemo,
    reset: timer.reset,

    // Computed
    isRunning: timer.status === 'running',
    isPaused: timer.status === 'paused',
    isStopped: timer.status === 'stopped',

    // Pomodoro
    pomodoro,
  };
};
