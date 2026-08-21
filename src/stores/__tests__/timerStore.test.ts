import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimerStore } from '../timerStore';

const PROJECT = { id: 'project-1', name: 'テストプロジェクト', color: '#3B82F6' };

/** テスト内で固定する現在時刻 */
const NOW = new Date('2026-08-22T10:00:00.000Z').getTime();

describe('timerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    useTimerStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('lastActiveAt', () => {
    it('計測開始時に最終アクティブ時刻が記録される', () => {
      useTimerStore.getState().start(PROJECT);

      expect(useTimerStore.getState().lastActiveAt).toBe(NOW);
    });

    it('heartbeatで最終アクティブ時刻が更新される', () => {
      useTimerStore.getState().start(PROJECT);

      vi.setSystemTime(NOW + 30_000);
      useTimerStore.getState().heartbeat();

      expect(useTimerStore.getState().lastActiveAt).toBe(NOW + 30_000);
    });

    it('一時停止中もheartbeatで更新される', () => {
      useTimerStore.getState().start(PROJECT);
      useTimerStore.getState().pause();

      vi.setSystemTime(NOW + 30_000);
      useTimerStore.getState().heartbeat();

      expect(useTimerStore.getState().lastActiveAt).toBe(NOW + 30_000);
    });

    it('停止中はheartbeatで更新されない', () => {
      vi.setSystemTime(NOW + 30_000);
      useTimerStore.getState().heartbeat();

      expect(useTimerStore.getState().lastActiveAt).toBeNull();
    });

    it('停止時に最終アクティブ時刻がクリアされる', () => {
      useTimerStore.getState().start(PROJECT);
      vi.setSystemTime(NOW + 60_000);
      useTimerStore.getState().stop();

      expect(useTimerStore.getState().lastActiveAt).toBeNull();
    });
  });

  describe('stop', () => {
    it('終了時刻を省略した場合は現在時刻で確定する', () => {
      useTimerStore.getState().start(PROJECT);
      vi.setSystemTime(NOW + 60_000);

      const result = useTimerStore.getState().stop();

      expect(result).not.toBeNull();
      expect(result!.endAt.getTime()).toBe(NOW + 60_000);
      expect(result!.durationMs).toBe(60_000);
      expect(useTimerStore.getState().status).toBe('stopped');
    });

    it('終了時刻を指定した場合はその時刻で確定する', () => {
      useTimerStore.getState().start(PROJECT);

      // ブラウザを閉じてから1時間後にアプリを開いた想定
      vi.setSystemTime(NOW + 3_600_000);
      const result = useTimerStore.getState().stop(NOW + 60_000);

      expect(result).not.toBeNull();
      expect(result!.startAt.getTime()).toBe(NOW);
      expect(result!.endAt.getTime()).toBe(NOW + 60_000);
      // 閉じていた期間は作業時間に含まれない
      expect(result!.durationMs).toBe(60_000);
    });

    it('一時停止中に終了時刻を指定した場合、一時停止分が除外される', () => {
      useTimerStore.getState().start(PROJECT);

      // 60秒計測して一時停止
      vi.setSystemTime(NOW + 60_000);
      useTimerStore.getState().pause();

      // 一時停止から30秒後に閉じた想定
      vi.setSystemTime(NOW + 3_600_000);
      const result = useTimerStore.getState().stop(NOW + 90_000);

      expect(result).not.toBeNull();
      expect(result!.endAt.getTime()).toBe(NOW + 90_000);
      expect(result!.durationMs).toBe(60_000);
    });

    it('終了時刻が開始時刻より前の場合でも負の作業時間にならない', () => {
      useTimerStore.getState().start(PROJECT);

      const result = useTimerStore.getState().stop(NOW - 10_000);

      expect(result).not.toBeNull();
      expect(result!.endAt.getTime()).toBe(NOW);
      expect(result!.durationMs).toBe(0);
    });

    it('計測していない場合はnullを返す', () => {
      expect(useTimerStore.getState().stop()).toBeNull();
    });
  });
});
