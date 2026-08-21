import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recoverTimerSession, STALE_THRESHOLD_MS } from '../recovery';
import { useTimerStore } from '@/stores/timerStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock('../saveSession', () => ({
  saveSession: vi.fn(async () => null),
}));

import { saveSession } from '../saveSession';

const USER_ID = 'user-1';
const PROJECT = { id: 'project-1', name: 'テストプロジェクト', color: '#3B82F6' };
const START_AT = new Date('2026-08-22T10:00:00.000Z').getTime();

/**
 * 計測中の状態を直接組み立てる
 * （ブラウザを閉じた後、localStorageから復元された状態を再現する）
 */
const setRunningState = (overrides: Partial<{
  status: 'running' | 'paused';
  startAt: number;
  pausedAt: number | null;
  totalPausedMs: number;
  lastActiveAt: number | null;
  memo: string;
}> = {}) => {
  useTimerStore.setState({
    status: 'running',
    projectId: PROJECT.id,
    projectName: PROJECT.name,
    projectColor: PROJECT.color,
    startAt: START_AT,
    pausedAt: null,
    totalPausedMs: 0,
    memo: '',
    lastActiveAt: START_AT + 60_000,
    ...overrides,
  });
};

describe('recoverTimerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTimerStore.getState().reset();
    usePomodoroStore.getState().reset();
  });

  it('計測中でない場合は何もしない', async () => {
    const result = await recoverTimerSession(USER_ID);

    expect(result).toBe('none');
    expect(saveSession).not.toHaveBeenCalled();
  });

  it('最終アクティブ時刻が閾値以内の場合は計測を継続する', async () => {
    setRunningState();

    const result = await recoverTimerSession(USER_ID, {
      now: START_AT + 60_000 + STALE_THRESHOLD_MS,
    });

    expect(result).toBe('continued');
    expect(saveSession).not.toHaveBeenCalled();
    expect(useTimerStore.getState().status).toBe('running');
  });

  it('最終アクティブ時刻が未記録の場合は計測を継続する', async () => {
    setRunningState({ lastActiveAt: null });

    const result = await recoverTimerSession(USER_ID, {
      now: START_AT + 3_600_000,
    });

    expect(result).toBe('continued');
    expect(saveSession).not.toHaveBeenCalled();
    expect(useTimerStore.getState().status).toBe('running');
    expect(useTimerStore.getState().lastActiveAt).not.toBeNull();
  });

  it('閾値を超えている場合、最終アクティブ時刻でセッションを確定する', async () => {
    setRunningState();

    const result = await recoverTimerSession(USER_ID, {
      now: START_AT + 3_600_000,
    });

    expect(result).toBe('saved');
    expect(saveSession).toHaveBeenCalledWith(USER_ID, {
      projectId: PROJECT.id,
      startAt: new Date(START_AT),
      endAt: new Date(START_AT + 60_000),
      durationMs: 60_000,
      memo: '',
    });
    // タイマーはリセットされる
    expect(useTimerStore.getState().status).toBe('stopped');
    expect(useTimerStore.getState().projectId).toBeNull();
  });

  it('引数で渡された最終アクティブ時刻を優先する', async () => {
    // ハートビートでストアの値が上書きされた状態を再現
    setRunningState({ lastActiveAt: START_AT + 3_600_000 });

    const result = await recoverTimerSession(USER_ID, {
      lastActiveAt: START_AT + 60_000,
      now: START_AT + 3_600_000,
    });

    expect(result).toBe('saved');
    expect(saveSession).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ endAt: new Date(START_AT + 60_000) })
    );
  });

  it('セッション確定時にポモドーロも停止する', async () => {
    setRunningState();
    usePomodoroStore.setState({
      phase: 'focus',
      remainingMs: 1_000,
      isEnabled: true,
    });

    await recoverTimerSession(USER_ID, { now: START_AT + 3_600_000 });

    expect(usePomodoroStore.getState().phase).toBe('idle');
    expect(usePomodoroStore.getState().remainingMs).toBe(0);
  });

  it('作業時間が0の場合はセッションを保存せず破棄する', async () => {
    // 開始直後に一時停止し、そのままブラウザを閉じた想定
    setRunningState({
      status: 'paused',
      pausedAt: START_AT,
      lastActiveAt: START_AT + 60_000,
    });

    const result = await recoverTimerSession(USER_ID, {
      now: START_AT + 3_600_000,
    });

    expect(result).toBe('discarded');
    expect(saveSession).not.toHaveBeenCalled();
    expect(useTimerStore.getState().status).toBe('stopped');
  });
});
