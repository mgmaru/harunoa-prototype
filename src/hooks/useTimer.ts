'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import { createSession } from '@/services/sessions';
import { useAuth } from './useAuth';
import { useOfflineStore } from '@/stores/offlineStore';
import { isOnline } from '@/services/sync';
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

    // オフラインの場合はキューに追加
    if (!isOnline()) {
      const { addCreateSession } = useOfflineStore.getState();
      addCreateSession(sessionInput);
      setElapsedMs(0);
      // オフライン時はセッションオブジェクトを仮生成して返す
      return {
        id: `offline-${Date.now()}`,
        userId: user.uid,
        ...sessionInput,
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    try {
      const session = await createSession(user.uid, sessionInput);
      setElapsedMs(0);
      return session;
    } catch (error) {
      // オンラインだが通信エラーの場合もキューに追加
      console.error('Failed to create session, queuing for later:', error);
      const { addCreateSession } = useOfflineStore.getState();
      addCreateSession(sessionInput);
      setElapsedMs(0);
      return {
        id: `offline-${Date.now()}`,
        userId: user.uid,
        ...sessionInput,
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
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
