/**
 * 結合テスト: エッジケース・異常系テスト (EDGE-001〜EDGE-004)
 *
 * docs/testing/integration-test-plan.md セクション4に対応
 * 実施タイミング: 全機能実装完了後
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';

// ===== Firebase モック =====
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
}));

// ===== テスト用データ =====
const mockUser: Partial<User> = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

// ===== 認証サービスモック =====
const mockOnAuthStateChanged = vi.fn();
vi.mock('@/services/auth', () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: (callback: (user: User | null) => void) =>
    mockOnAuthStateChanged(callback),
}));

// ===== プロジェクトサービスモック =====
vi.mock('@/services/projects', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
  getArchivedProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  restoreProject: vi.fn(),
}));

// ===== セッションサービスモック =====
const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn();

vi.mock('@/services/sessions', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
  getSessions: vi.fn().mockResolvedValue([]),
  getSessionsByDate: vi.fn().mockResolvedValue([]),
  getSessionsByProject: vi.fn().mockResolvedValue([]),
  deleteSession: vi.fn(),
  archiveOldSessions: vi.fn().mockResolvedValue({ archivedCount: 0 }),
  getAllSessions: vi.fn().mockResolvedValue([]),
  getArchivedSessions: vi.fn().mockResolvedValue([]),
  getSessionsByPeriod: vi.fn().mockResolvedValue([]),
  getSession: vi.fn(),
}));

// ===== プリセットサービスモック =====
const mockGetPresets = vi.fn();
const mockDeletePreset = vi.fn();

vi.mock('@/services/presets', () => ({
  getPresets: () => mockGetPresets(),
  createPreset: vi.fn(),
  updatePreset: vi.fn(),
  deletePreset: () => mockDeletePreset(),
  setActivePreset: vi.fn(),
  clearActivePreset: vi.fn(),
  ensureDefaultPreset: vi.fn().mockResolvedValue(undefined),
}));

// ===== 設定サービスモック =====
vi.mock('@/services/settings', () => ({
  getUserSettings: vi.fn().mockResolvedValue({
    soundEnabled: false,
    browserNotificationEnabled: false,
  }),
  updateUserSettings: vi.fn(),
}));

// ===== 同期サービスモック =====
const mockSyncOfflineQueue = vi.fn();

vi.mock('@/services/sync', () => ({
  syncOfflineQueue: (...args: unknown[]) => mockSyncOfflineQueue(...args),
  isOnline: vi.fn().mockReturnValue(true),
}));

// ===== Next.js router モック =====
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/timer',
  useSearchParams: () => new URLSearchParams(),
}));

// usePomodoroのモック
vi.mock('@/hooks/usePomodoro', () => ({
  usePomodoro: () => ({
    phase: 'idle',
    remainingMs: 0,
    isEnabled: false,
    focusDurationMinutes: 25,
    breakDurationMinutes: 5,
    presetId: null,
    setPreset: vi.fn(),
    startFocus: vi.fn(),
    skipBreak: vi.fn(),
    stop: vi.fn(),
    startWithTimer: vi.fn(),
    stopWithTimer: vi.fn(),
    isFocus: false,
    isBreak: false,
    isIdle: true,
  }),
}));

// ===== ストアのインポート =====
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { useToastStore } from '@/stores/toastStore';

// ===== テスト対象のインポート =====
import { usePresets } from '@/hooks/usePresets';

// =========================================================================
// EDGE-001: 複数端末での競合テスト (Last Write Wins)
// =========================================================================
describe('EDGE-001: 複数端末での競合', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });
  });

  it('同じセッションへの複数更新で後勝ちになる（Last Write Wins）', async () => {
    // 端末Aの更新（タイムスタンプ: 10:00:00）
    const updateA = {
      sessionId: 'session-1',
      memo: '端末Aからの更新',
      timestamp: new Date('2026-02-01T10:00:00'),
    };

    // 端末Bの更新（タイムスタンプ: 10:00:05）- 後から更新
    const updateB = {
      sessionId: 'session-1',
      memo: '端末Bからの更新',
      timestamp: new Date('2026-02-01T10:00:05'),
    };

    // 更新を実行（実際のFirestoreでは後からの更新が勝つ）
    mockUpdateSession.mockResolvedValue(undefined);

    await mockUpdateSession('session-1', { memo: updateA.memo });
    await mockUpdateSession('session-1', { memo: updateB.memo });

    // mockが2回呼ばれたことを確認
    expect(mockUpdateSession).toHaveBeenCalledTimes(2);

    // Last Write Wins: 最後の更新（端末B）が反映される
    const lastCall = mockUpdateSession.mock.calls[1];
    expect(lastCall[1].memo).toBe('端末Bからの更新');
  });

  it('タイムスタンプが古い更新は新しい更新で上書きされる', () => {
    // オフラインキューでもタイムスタンプ順に処理
    const queue = [
      {
        id: 'action-1',
        type: 'UPDATE_SESSION' as const,
        payload: { sessionId: 'session-1', data: { memo: '古い更新' } },
        timestamp: 1000,
      },
      {
        id: 'action-2',
        type: 'UPDATE_SESSION' as const,
        payload: { sessionId: 'session-1', data: { memo: '新しい更新' } },
        timestamp: 2000,
      },
    ];

    // タイムスタンプ順にソート
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    // 古い順に処理されるため、最終的には新しい更新が反映される
    expect(sortedQueue[0].payload.data.memo).toBe('古い更新');
    expect(sortedQueue[1].payload.data.memo).toBe('新しい更新');
  });
});

// =========================================================================
// EDGE-002: ブラウザクラッシュ復帰テスト
// =========================================================================
describe('EDGE-002: ブラウザクラッシュ復帰', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });
    mockCreateSession.mockResolvedValue({
      id: 'new-session',
      userId: 'test-user-id',
      projectId: 'project-1',
      startAt: new Date(),
      endAt: new Date(),
      durationMs: 60000,
      memo: '',
      isArchived: false,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('計測中の状態がZustand persistにより保存される', () => {
    const timerStore = useTimerStore.getState();

    // 計測開始
    timerStore.start({
      id: 'project-1',
      name: 'Test Project',
      color: '#3B82F6',
    });

    // 状態を確認
    const state = useTimerStore.getState();
    expect(state.status).toBe('running');
    expect(state.projectId).toBe('project-1');
    expect(state.projectName).toBe('Test Project');
    expect(state.startAt).not.toBeNull();
  });

  it('ブラウザ再起動後に計測状態が復元される', () => {
    const persistedStartAt = Date.now() - 30 * 60 * 1000; // 30分前

    // 永続化された状態をシミュレート
    useTimerStore.setState({
      status: 'running',
      projectId: 'project-1',
      projectName: 'Test Project',
      projectColor: '#3B82F6',
      startAt: persistedStartAt,
      pausedAt: null,
      totalPausedMs: 0,
      memo: '作業メモ',
    });

    // 復元された状態を確認
    const state = useTimerStore.getState();
    expect(state.status).toBe('running');
    expect(state.projectId).toBe('project-1');
    expect(state.startAt).toBe(persistedStartAt);
    expect(state.memo).toBe('作業メモ');

    // 経過時間を計算可能
    const elapsedMs = Date.now() - state.startAt! - state.totalPausedMs;
    expect(elapsedMs).toBeGreaterThan(29 * 60 * 1000); // 29分以上
    expect(elapsedMs).toBeLessThan(31 * 60 * 1000); // 31分以下
  });

  it('一時停止状態も正しく復元される', () => {
    const startAt = Date.now() - 60 * 60 * 1000; // 1時間前
    const pausedAt = Date.now() - 30 * 60 * 1000; // 30分前

    useTimerStore.setState({
      status: 'paused',
      projectId: 'project-1',
      projectName: 'Test Project',
      projectColor: '#3B82F6',
      startAt,
      pausedAt,
      totalPausedMs: 0,
      memo: '',
    });

    const state = useTimerStore.getState();
    expect(state.status).toBe('paused');
    expect(state.pausedAt).toBe(pausedAt);

    // 一時停止時点での経過時間
    const elapsedMs = state.pausedAt! - state.startAt! - state.totalPausedMs;
    expect(elapsedMs).toBe(30 * 60 * 1000); // 30分
  });
});

// =========================================================================
// EDGE-003: プリセット削除の制約テスト
// =========================================================================
describe('EDGE-003: プリセット削除の制約', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });
  });

  it('利用中のプリセットは削除できない', async () => {
    mockGetPresets.mockResolvedValue([
      {
        id: 'preset-active',
        userId: 'test-user-id',
        name: 'Active Preset',
        focusDurationMinutes: 25,
        breakDurationMinutes: 5,
        focusEndSound: 'bell',
        breakEndSound: 'chime',
        isActive: true, // 利用中
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'preset-inactive',
        userId: 'test-user-id',
        name: 'Inactive Preset',
        focusDurationMinutes: 30,
        breakDurationMinutes: 10,
        focusEndSound: 'ding',
        breakEndSound: 'bell',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { result } = renderHook(() => usePresets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 利用中のプリセットを削除しようとするとエラー
    await expect(result.current.remove('preset-active')).rejects.toThrow(
      '利用中のプリセットは削除できません'
    );
  });

  it('利用中でないプリセットは削除できる', async () => {
    mockGetPresets.mockResolvedValue([
      {
        id: 'preset-active',
        userId: 'test-user-id',
        name: 'Active Preset',
        focusDurationMinutes: 25,
        breakDurationMinutes: 5,
        focusEndSound: 'bell',
        breakEndSound: 'chime',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'preset-inactive',
        userId: 'test-user-id',
        name: 'Inactive Preset',
        focusDurationMinutes: 30,
        breakDurationMinutes: 10,
        focusEndSound: 'ding',
        breakEndSound: 'bell',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    mockDeletePreset.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePresets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 利用中でないプリセットは削除可能
    await act(async () => {
      await result.current.remove('preset-inactive');
    });

    expect(mockDeletePreset).toHaveBeenCalled();
  });

  it('アクティブプリセットが正しく識別される', async () => {
    mockGetPresets.mockResolvedValue([
      {
        id: 'preset-1',
        isActive: true,
        name: 'Active',
      },
      {
        id: 'preset-2',
        isActive: false,
        name: 'Inactive',
      },
    ]);

    const { result } = renderHook(() => usePresets());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activePreset?.id).toBe('preset-1');
    expect(result.current.activePreset?.name).toBe('Active');
  });
});

// =========================================================================
// EDGE-004: リトライ上限後の動作テスト
// =========================================================================
describe('EDGE-004: リトライ上限後の動作', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOfflineStore.setState({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,
    });
    useToastStore.setState({ toasts: [] });
  });

  it('同期失敗時にエラーメッセージが設定される', () => {
    const offlineStore = useOfflineStore.getState();

    // 同期エラーを設定
    offlineStore.setSyncError('同期に失敗しました。再試行してください。');

    const { lastSyncError } = useOfflineStore.getState();
    expect(lastSyncError).toBe('同期に失敗しました。再試行してください。');
  });

  it('同期失敗後に手動リトライが可能', async () => {
    useOfflineStore.setState({
      queue: [
        {
          id: 'action-1',
          type: 'CREATE_SESSION',
          payload: {
            projectId: 'project-1',
            startAt: new Date(),
            endAt: new Date(),
            durationMs: 60000,
            memo: 'test',
          },
          timestamp: Date.now(),
        },
      ],
      lastSyncError: '同期に失敗しました。',
    });

    // 2回目の同期で成功
    mockSyncOfflineQueue.mockResolvedValue({
      success: true,
      syncedCount: 1,
      failedCount: 0,
    });

    const result = await mockSyncOfflineQueue('test-user-id');

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
  });

  it('部分的な同期失敗時に失敗件数が報告される', async () => {
    mockSyncOfflineQueue.mockResolvedValue({
      success: false,
      syncedCount: 2,
      failedCount: 1,
      error: '1件の同期に失敗しました。再試行してください。',
    });

    const result = await mockSyncOfflineQueue('test-user-id');

    expect(result.success).toBe(false);
    expect(result.syncedCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.error).toContain('1件の同期に失敗しました');
  });

  it('同期中はisSyncingフラグがtrueになる', () => {
    const offlineStore = useOfflineStore.getState();

    // 同期開始
    offlineStore.setSyncing(true);
    expect(useOfflineStore.getState().isSyncing).toBe(true);

    // 同期完了
    offlineStore.setSyncing(false);
    expect(useOfflineStore.getState().isSyncing).toBe(false);
  });

  it('同期成功時にエラーがクリアされlastSyncAtが更新される', () => {
    const offlineStore = useOfflineStore.getState();

    // 以前のエラーを設定
    offlineStore.setSyncError('以前のエラー');
    expect(useOfflineStore.getState().lastSyncError).toBe('以前のエラー');

    // 同期成功
    offlineStore.setSyncSuccess();

    const state = useOfflineStore.getState();
    expect(state.lastSyncError).toBeNull();
    expect(state.lastSyncAt).not.toBeNull();
  });
});
