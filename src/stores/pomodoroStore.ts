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
  /**
   * 経過時間を反映してフェーズを進める
   *
   * @param deltaMs 前回tickからの経過時間（ミリ秒）
   * @returns このtickで終了したフェーズ（古い順）
   */
  tick: (deltaMs: number) => PomodoroPhase[];
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
        const { phase, remainingMs, breakDurationMinutes } = get();
        if (phase === 'idle' || deltaMs <= 0) return [];

        // バックグラウンドタブでは`setInterval`が間引かれ、1回のtickに
        // フェーズ残り時間を超える経過時間が渡されることがある。
        // 超過分を次のフェーズへ繰り越し、実時間どおりにフェーズを進める。
        const completed: PomodoroPhase[] = [];
        let currentPhase: PomodoroPhase = phase;
        let remaining = remainingMs;
        let rest = deltaMs;

        while (currentPhase !== 'idle') {
          if (rest < remaining) {
            remaining -= rest;
            break;
          }

          rest -= remaining;
          completed.push(currentPhase);

          if (currentPhase === 'focus') {
            // 集中終了 → 休憩へ
            currentPhase = 'break';
            remaining = breakDurationMinutes * 60 * 1000;
          } else {
            // 休憩終了 → 待機へ（v2では自動繰り返しなし）
            currentPhase = 'idle';
            remaining = 0;
          }
        }

        set({ phase: currentPhase, remainingMs: remaining });
        return completed;
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
