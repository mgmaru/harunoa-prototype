import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type TimerStatus = 'stopped' | 'running' | 'paused';

type TimerState = {
  status: TimerStatus;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  startAt: number | null; // Unix timestamp (ms)
  pausedAt: number | null; // Unix timestamp (ms)
  totalPausedMs: number;
  memo: string;
};

type TimerActions = {
  start: (project: { id: string; name: string; color: string }) => void;
  pause: () => void;
  resume: () => void;
  stop: () => {
    projectId: string;
    startAt: Date;
    endAt: Date;
    durationMs: number;
    memo: string;
  } | null;
  setMemo: (memo: string) => void;
  reset: () => void;
};

const initialState: TimerState = {
  status: 'stopped',
  projectId: null,
  projectName: null,
  projectColor: null,
  startAt: null,
  pausedAt: null,
  totalPausedMs: 0,
  memo: '',
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: (project) => {
        set({
          status: 'running',
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          startAt: Date.now(),
          pausedAt: null,
          totalPausedMs: 0,
          memo: '',
        });
      },

      pause: () => {
        set({ status: 'paused', pausedAt: Date.now() });
      },

      resume: () => {
        const { pausedAt, totalPausedMs } = get();
        if (pausedAt) {
          set({
            status: 'running',
            pausedAt: null,
            totalPausedMs: totalPausedMs + (Date.now() - pausedAt),
          });
        }
      },

      stop: () => {
        const { projectId, startAt, memo, pausedAt, totalPausedMs, status } = get();
        if (!projectId || !startAt) return null;

        const now = Date.now();
        let finalPausedMs = totalPausedMs;

        // 一時停止中に停止した場合、その分も加算
        if (status === 'paused' && pausedAt) {
          finalPausedMs += now - pausedAt;
        }

        const result = {
          projectId,
          startAt: new Date(startAt),
          endAt: new Date(now),
          durationMs: now - startAt - finalPausedMs,
          memo,
        };

        set(initialState);
        return result;
      },

      setMemo: (memo) => set({ memo }),
      reset: () => set(initialState),
    }),
    {
      name: 'harunoa-timer',
    }
  )
);
