import { describe, it, expect, beforeEach } from 'vitest';
import { usePomodoroStore } from '../pomodoroStore';

const PRESET = {
  id: 'preset-1',
  focusDurationMinutes: 25,
  breakDurationMinutes: 5,
};

const FOCUS_MS = PRESET.focusDurationMinutes * 60 * 1000;
const BREAK_MS = PRESET.breakDurationMinutes * 60 * 1000;

/** プリセットを設定して集中フェーズを開始する */
const startFocus = () => {
  usePomodoroStore.getState().setPreset(PRESET);
  usePomodoroStore.getState().startFocus();
};

/** プリセットを設定して休憩フェーズを開始する */
const startBreak = () => {
  usePomodoroStore.getState().setPreset(PRESET);
  usePomodoroStore.getState().startBreak();
};

describe('pomodoroStore', () => {
  beforeEach(() => {
    usePomodoroStore.getState().reset();
  });

  describe('tick', () => {
    it('残り時間より短い経過時間では残り時間だけが減る', () => {
      startFocus();

      const completed = usePomodoroStore.getState().tick(60_000);

      expect(completed).toEqual([]);
      expect(usePomodoroStore.getState().phase).toBe('focus');
      expect(usePomodoroStore.getState().remainingMs).toBe(FOCUS_MS - 60_000);
    });

    it('集中の残り時間ちょうどの経過時間で休憩へ移行する', () => {
      startFocus();

      const completed = usePomodoroStore.getState().tick(FOCUS_MS);

      expect(completed).toEqual(['focus']);
      expect(usePomodoroStore.getState().phase).toBe('break');
      expect(usePomodoroStore.getState().remainingMs).toBe(BREAK_MS);
    });

    it('集中の残り時間を超えた分は休憩に繰り越される', () => {
      startFocus();

      // バックグラウンドタブでintervalが間引かれ、まとめて経過したケース
      const completed = usePomodoroStore.getState().tick(FOCUS_MS + 60_000);

      expect(completed).toEqual(['focus']);
      expect(usePomodoroStore.getState().phase).toBe('break');
      expect(usePomodoroStore.getState().remainingMs).toBe(BREAK_MS - 60_000);
    });

    it('集中と休憩の両方を超える経過時間では待機状態になる', () => {
      startFocus();

      const completed = usePomodoroStore
        .getState()
        .tick(FOCUS_MS + BREAK_MS + 600_000);

      expect(completed).toEqual(['focus', 'break']);
      expect(usePomodoroStore.getState().phase).toBe('idle');
      expect(usePomodoroStore.getState().remainingMs).toBe(0);
    });

    it('休憩中に残り時間を超えると待機状態になる', () => {
      startBreak();

      const completed = usePomodoroStore.getState().tick(BREAK_MS + 1_000);

      expect(completed).toEqual(['break']);
      expect(usePomodoroStore.getState().phase).toBe('idle');
      expect(usePomodoroStore.getState().remainingMs).toBe(0);
    });

    it('待機中は経過時間を無視する', () => {
      const completed = usePomodoroStore.getState().tick(60_000);

      expect(completed).toEqual([]);
      expect(usePomodoroStore.getState().phase).toBe('idle');
      expect(usePomodoroStore.getState().remainingMs).toBe(0);
    });

    it('経過時間が0以下の場合は何も起きない', () => {
      startFocus();

      const completed = usePomodoroStore.getState().tick(0);

      expect(completed).toEqual([]);
      expect(usePomodoroStore.getState().phase).toBe('focus');
      expect(usePomodoroStore.getState().remainingMs).toBe(FOCUS_MS);
    });
  });
});
