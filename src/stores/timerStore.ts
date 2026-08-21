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
  /**
   * アプリが最後に動作していた時刻（Unix timestamp (ms)）
   *
   * 計測中は一定間隔で更新される。ブラウザを閉じた場合はこの時刻で
   * 計測が止まったとみなし、次回起動時にセッションを確定する。
   */
  lastActiveAt: number | null;
};

export type StoppedSession = {
  projectId: string;
  startAt: Date;
  endAt: Date;
  durationMs: number;
  memo: string;
};

type TimerActions = {
  start: (project: { id: string; name: string; color: string }) => void;
  pause: () => void;
  resume: () => void;
  /**
   * 計測を停止してセッション情報を返す
   *
   * @param endAtMs 終了時刻（Unix timestamp (ms)）。省略時は現在時刻。
   *                ブラウザクローズからの復旧時に、閉じた時刻を指定する用途で使う。
   */
  stop: (endAtMs?: number) => StoppedSession | null;
  setMemo: (memo: string) => void;
  /** 最終アクティブ時刻を現在時刻で更新する（計測中のみ） */
  heartbeat: () => void;
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
  lastActiveAt: null,
};

export const useTimerStore = create<TimerState & TimerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: (project) => {
        const now = Date.now();
        set({
          status: 'running',
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          startAt: now,
          pausedAt: null,
          totalPausedMs: 0,
          memo: '',
          lastActiveAt: now,
        });
      },

      pause: () => {
        const now = Date.now();
        set({ status: 'paused', pausedAt: now, lastActiveAt: now });
      },

      resume: () => {
        const { pausedAt, totalPausedMs } = get();
        if (pausedAt) {
          const now = Date.now();
          set({
            status: 'running',
            pausedAt: null,
            totalPausedMs: totalPausedMs + (now - pausedAt),
            lastActiveAt: now,
          });
        }
      },

      stop: (endAtMs) => {
        const { projectId, startAt, memo, pausedAt, totalPausedMs, status } = get();
        if (!projectId || !startAt) return null;

        // 終了時刻は開始時刻より前にならないようにする
        const endAt = Math.max(endAtMs ?? Date.now(), startAt);
        let finalPausedMs = totalPausedMs;

        // 一時停止中に停止した場合、その分も加算
        if (status === 'paused' && pausedAt) {
          finalPausedMs += Math.max(endAt - pausedAt, 0);
        }

        const result = {
          projectId,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          durationMs: Math.max(endAt - startAt - finalPausedMs, 0),
          memo,
        };

        set(initialState);
        return result;
      },

      setMemo: (memo) => set({ memo }),

      heartbeat: () => {
        if (get().status === 'stopped') return;
        set({ lastActiveAt: Date.now() });
      },
      reset: () => set(initialState),
    }),
    {
      name: 'harunoa-timer',
    }
  )
);
