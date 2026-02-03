import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PomodoroPhase = 'idle' | 'focus' | 'break';

type PomodoroState = {
  phase: PomodoroPhase;
  remainingMs: number;
  presetId: string | null;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  isEnabled: boolean;
};

type PomodoroActions = {
  setPreset: (preset: {
    id: string;
    focusDurationMinutes: number;
    breakDurationMinutes: number;
  } | null) => void;
  startFocus: () => void;
  startBreak: () => void;
  skipBreak: () => void;
  tick: (deltaMs: number) => void;
  stop: () => void;
  reset: () => void;
};

const initialState: PomodoroState = {
  phase: 'idle',
  remainingMs: 0,
  presetId: null,
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
  isEnabled: false,
};

export const usePomodoroStore = create<PomodoroState & PomodoroActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPreset: (preset) => {
        if (preset) {
          set({
            presetId: preset.id,
            focusDurationMinutes: preset.focusDurationMinutes,
            breakDurationMinutes: preset.breakDurationMinutes,
            isEnabled: true,
          });
        } else {
          set({
            presetId: null,
            isEnabled: false,
            phase: 'idle',
            remainingMs: 0,
          });
        }
      },

      startFocus: () => {
        const { focusDurationMinutes, isEnabled } = get();
        if (!isEnabled) return;

        set({
          phase: 'focus',
          remainingMs: focusDurationMinutes * 60 * 1000,
        });
      },

      startBreak: () => {
        const { breakDurationMinutes, isEnabled } = get();
        if (!isEnabled) return;

        set({
          phase: 'break',
          remainingMs: breakDurationMinutes * 60 * 1000,
        });
      },

      skipBreak: () => {
        const { focusDurationMinutes, isEnabled } = get();
        if (!isEnabled) {
          set({
            phase: 'idle',
            remainingMs: 0,
          });
          return;
        }
        // 次の集中フェーズを開始
        set({
          phase: 'focus',
          remainingMs: focusDurationMinutes * 60 * 1000,
        });
      },

      tick: (deltaMs) => {
        const { remainingMs, phase } = get();
        if (phase === 'idle') return;

        const newRemaining = Math.max(0, remainingMs - deltaMs);
        set({ remainingMs: newRemaining });
      },

      stop: () => {
        set({
          phase: 'idle',
          remainingMs: 0,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: 'harunoa-pomodoro',
    }
  )
);
