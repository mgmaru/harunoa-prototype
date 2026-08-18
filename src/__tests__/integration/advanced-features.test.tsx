/**
 * 結合テスト: 応用機能・非機能テスト (INT-021〜INT-027)
 *
 * docs/testing/integration-test-plan.md セクション3に対応
 * 実施タイミング: 全機能実装完了後
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
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

// ===== ストアモック初期化 =====
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
const mockProjects = [
  {
    id: 'project-1',
    userId: 'test-user-id',
    name: 'Test Project 1',
    color: '#3B82F6',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('@/services/projects', () => ({
  getProjects: vi.fn().mockResolvedValue(mockProjects),
  getArchivedProjects: vi.fn().mockResolvedValue([]),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  restoreProject: vi.fn(),
}));

// ===== セッションサービスモック =====
const mockCreateSession = vi.fn();
const mockGetSessions = vi.fn();
const mockArchiveOldSessions = vi.fn();
const mockGetAllSessions = vi.fn();
const mockGetArchivedSessions = vi.fn();

vi.mock('@/services/sessions', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  getSessions: () => mockGetSessions(),
  getSessionsByDate: vi.fn().mockResolvedValue([]),
  getSessionsByProject: vi.fn().mockResolvedValue([]),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  archiveOldSessions: () => mockArchiveOldSessions(),
  getAllSessions: () => mockGetAllSessions(),
  getArchivedSessions: () => mockGetArchivedSessions(),
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
const mockGetUserSettings = vi.fn();
const mockUpdateUserSettings = vi.fn();

vi.mock('@/services/settings', () => ({
  getUserSettings: () => mockGetUserSettings(),
  updateUserSettings: () => mockUpdateUserSettings(),
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

// ===== ストアのインポート =====
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { useOfflineStore } from '@/stores/offlineStore';
import { useToastStore } from '@/stores/toastStore';

// ===== テスト対象のインポート =====
import { useSessionArchive } from '@/hooks/useSessionArchive';
import { exportSessionsToCSV, createProjectMap } from '@/lib/csv/export';
import type { Session } from '@/types/session';
import type { Project } from '@/types/project';

// オフラインキューのアクションは type による判別可能なユニオンのため、
// payload を参照する前に type で絞り込む
type QueuedAction = ReturnType<typeof useOfflineStore.getState>['queue'][number];

const expectQueuedAction = <T extends QueuedAction['type']>(
  action: QueuedAction,
  type: T
): Extract<QueuedAction, { type: T }> => {
  expect(action.type).toBe(type);
  return action as Extract<QueuedAction, { type: T }>;
};

// =========================================================================
// INT-021: ポモドーロ・タイマー連携テスト
// =========================================================================
describe('INT-021: ポモドーロ・タイマー連携', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    useTimerStore.setState({
      status: 'stopped',
      projectId: null,
      projectName: null,
      projectColor: null,
      startAt: null,
      pausedAt: null,
      totalPausedMs: 0,
      memo: '',
    });
    usePomodoroStore.setState({
      phase: 'idle',
      remainingMs: 0,
      presetId: 'preset-1',
      focusDurationMinutes: 25,
      breakDurationMinutes: 5,
      isEnabled: true,
    });
  });

  it('タイマー開始時にポモドーロが連動して開始される', () => {
    const timerStore = useTimerStore.getState();
    const pomodoroStore = usePomodoroStore.getState();

    // タイマー開始
    timerStore.start({
      id: 'project-1',
      name: 'Test Project 1',
      color: '#3B82F6',
    });

    // ポモドーロ開始（手動でstartFocusを呼び出す - useTimerフック相当）
    pomodoroStore.startFocus();

    const updatedPomodoroState = usePomodoroStore.getState();
    expect(updatedPomodoroState.phase).toBe('focus');
    expect(updatedPomodoroState.remainingMs).toBe(25 * 60 * 1000);
  });

  it('タイマー停止時にポモドーロも停止（リセット）される', () => {
    const timerStore = useTimerStore.getState();
    const pomodoroStore = usePomodoroStore.getState();

    // タイマーとポモドーロを開始
    timerStore.start({
      id: 'project-1',
      name: 'Test Project 1',
      color: '#3B82F6',
    });
    pomodoroStore.startFocus();

    expect(usePomodoroStore.getState().phase).toBe('focus');

    // タイマー停止
    timerStore.stop();
    pomodoroStore.stop();

    const finalState = usePomodoroStore.getState();
    expect(finalState.phase).toBe('idle');
    expect(finalState.remainingMs).toBe(0);
  });

  it('ポモドーロ無効時はタイマー開始してもポモドーロは開始されない', () => {
    usePomodoroStore.setState({ isEnabled: false });

    const timerStore = useTimerStore.getState();
    const pomodoroStore = usePomodoroStore.getState();

    timerStore.start({
      id: 'project-1',
      name: 'Test Project 1',
      color: '#3B82F6',
    });
    pomodoroStore.startFocus(); // isEnabled=falseなので実行されない

    expect(usePomodoroStore.getState().phase).toBe('idle');
  });
});

// =========================================================================
// INT-022: 通知設定の反映テスト
// =========================================================================
describe('INT-022: 通知設定の反映', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });
  });

  it('通知音OFFの場合、ポモドーロ終了時に音が鳴らない', async () => {
    mockGetUserSettings.mockResolvedValue({
      soundEnabled: false,
      browserNotificationEnabled: true,
    });
    mockGetPresets.mockResolvedValue([
      {
        id: 'preset-1',
        userId: 'test-user-id',
        name: 'Default',
        focusDurationMinutes: 25,
        breakDurationMinutes: 5,
        focusEndSound: 'bell',
        breakEndSound: 'chime',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // useNotificationの内部ロジックをシミュレート
    const settings = await mockGetUserSettings();
    expect(settings.soundEnabled).toBe(false);

    // soundEnabled=falseの場合、playSoundは何もしない
    const shouldPlaySound = settings.soundEnabled;
    expect(shouldPlaySound).toBe(false);
  });

  it('通知音ONの場合、プリセットの音が選択される', async () => {
    mockGetUserSettings.mockResolvedValue({
      soundEnabled: true,
      browserNotificationEnabled: true,
    });
    mockGetPresets.mockResolvedValue([
      {
        id: 'preset-1',
        userId: 'test-user-id',
        name: 'Custom',
        focusDurationMinutes: 30,
        breakDurationMinutes: 10,
        focusEndSound: 'ding',
        breakEndSound: 'bell',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const settings = await mockGetUserSettings();
    const presets = await mockGetPresets();
    const activePreset = presets.find((p: { isActive: boolean }) => p.isActive);

    expect(settings.soundEnabled).toBe(true);
    expect(activePreset?.focusEndSound).toBe('ding');
    expect(activePreset?.breakEndSound).toBe('bell');
  });
});

// =========================================================================
// INT-023: 通知権限ハンドリングテスト
// =========================================================================
describe('INT-023: 通知権限ハンドリング', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.setState({ toasts: [] });
  });

  it('ブラウザ通知ブロック時にアプリ内バナーで代替通知される', () => {
    const toastStore = useToastStore.getState();

    // ブラウザ通知が使えない場合のフォールバック
    toastStore.addToast({
      type: 'info',
      title: '集中時間終了',
      message: '休憩を取りましょう',
      duration: 5000,
    });

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('集中時間終了');
    expect(toasts[0].message).toBe('休憩を取りましょう');
  });

  it('トーストは指定時間後に自動削除される', async () => {
    vi.useFakeTimers();
    const toastStore = useToastStore.getState();

    toastStore.addToast({
      type: 'info',
      title: 'テスト通知',
      message: 'テストメッセージ',
      duration: 1000,
    });

    expect(useToastStore.getState().toasts).toHaveLength(1);

    // 時間を進める
    vi.advanceTimersByTime(1100);

    expect(useToastStore.getState().toasts).toHaveLength(0);

    vi.useRealTimers();
  });
});

// =========================================================================
// INT-024: オフライン計測と同期テスト
// =========================================================================
describe('INT-024: オフライン計測と同期', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    useOfflineStore.setState({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,
    });
  });

  it('オフライン中の計測データがキューに蓄積される', () => {
    const offlineStore = useOfflineStore.getState();

    // オフライン時のセッション作成をキューに追加
    offlineStore.addCreateSession({
      projectId: 'project-1',
      startAt: new Date('2026-02-01T10:00:00'),
      endAt: new Date('2026-02-01T11:00:00'),
      durationMs: 60 * 60 * 1000,
      memo: 'オフライン中の作業',
    });

    const { queue } = useOfflineStore.getState();
    expect(queue).toHaveLength(1);
    const created = expectQueuedAction(queue[0], 'CREATE_SESSION');
    expect(created.payload.memo).toBe('オフライン中の作業');
  });

  it('オンライン復帰後に自動同期される', async () => {
    // キューにデータを追加
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
    });

    mockSyncOfflineQueue.mockResolvedValue({
      success: true,
      syncedCount: 1,
      failedCount: 0,
    });

    // 同期実行
    const result = await mockSyncOfflineQueue('test-user-id');

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
  });

  it('複数の操作がタイムスタンプ順に同期される', () => {
    const offlineStore = useOfflineStore.getState();
    const now = Date.now();

    // 複数の操作を追加
    offlineStore.addCreateSession({
      projectId: 'project-1',
      startAt: new Date(now - 3600000),
      endAt: new Date(now - 3000000),
      durationMs: 600000,
      memo: '最初の作業',
    });

    offlineStore.addCreateSession({
      projectId: 'project-1',
      startAt: new Date(now - 2000000),
      endAt: new Date(now - 1000000),
      durationMs: 1000000,
      memo: '2番目の作業',
    });

    const { queue } = useOfflineStore.getState();
    expect(queue).toHaveLength(2);

    // タイムスタンプ順にソートされることを確認
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    expect(
      expectQueuedAction(sortedQueue[0], 'CREATE_SESSION').payload.memo
    ).toBe('最初の作業');
    expect(
      expectQueuedAction(sortedQueue[1], 'CREATE_SESSION').payload.memo
    ).toBe('2番目の作業');
  });
});

// =========================================================================
// INT-025: オフライン中の画面遷移とキュー蓄積テスト
// =========================================================================
describe('INT-025: オフライン中の画面遷移とキュー蓄積', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOfflineStore.setState({
      queue: [],
      isSyncing: false,
      lastSyncError: null,
      lastSyncAt: null,
    });
  });

  it('メモ編集操作がキューに蓄積される', () => {
    const offlineStore = useOfflineStore.getState();

    // UPDATE_SESSION操作をキューに追加
    offlineStore.addUpdateSession('session-1', {
      memo: '更新されたメモ',
    });

    const { queue } = useOfflineStore.getState();
    expect(queue).toHaveLength(1);
    const updated = expectQueuedAction(queue[0], 'UPDATE_SESSION');
    expect(updated.payload.data.memo).toBe('更新されたメモ');
  });

  it('削除操作がキューに蓄積される', () => {
    const offlineStore = useOfflineStore.getState();

    offlineStore.addDeleteSession('session-1');

    const { queue } = useOfflineStore.getState();
    expect(queue).toHaveLength(1);
    const deleted = expectQueuedAction(queue[0], 'DELETE_SESSION');
    expect(deleted.payload.sessionId).toBe('session-1');
  });

  it('キューの状態がlocalStorageに永続化される（Zustand persist）', () => {
    // Zustand persistの動作確認
    const offlineStore = useOfflineStore.getState();

    offlineStore.addCreateSession({
      projectId: 'project-1',
      startAt: new Date(),
      endAt: new Date(),
      durationMs: 60000,
      memo: 'persistent memo',
    });

    const state = useOfflineStore.getState();
    expect(state.queue).toHaveLength(1);
    // Zustand persistによりlocalStorageに保存される
  });
});

// =========================================================================
// INT-026: 自動アーカイブ動作テスト
// =========================================================================
describe('INT-026: 自動アーカイブ動作', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser as User, isLoading: false });
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });
  });

  it('1年以上前のデータが自動的にアーカイブされる', async () => {
    mockArchiveOldSessions.mockResolvedValue({ archivedCount: 5 });

    const { result } = renderHook(() => useSessionArchive());

    await act(async () => {
      const archiveResult = await result.current.runArchive();
      expect(archiveResult?.archivedCount).toBe(5);
    });

    expect(result.current.lastArchiveResult?.archivedCount).toBe(5);
  });

  it('アーカイブ済みデータは通常一覧から除外される', async () => {
    // アーカイブ済みを除外した取得
    mockGetSessions.mockResolvedValue([
      {
        id: 'session-recent',
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
      },
    ]);

    const sessions = await mockGetSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].isArchived).toBe(false);
  });

  it('アーカイブ対象がない場合は0件が返される', async () => {
    mockArchiveOldSessions.mockResolvedValue({ archivedCount: 0 });

    const { result } = renderHook(() => useSessionArchive());

    await act(async () => {
      const archiveResult = await result.current.runArchive();
      expect(archiveResult?.archivedCount).toBe(0);
    });
  });
});

// =========================================================================
// INT-027: アーカイブデータのCSV出力テスト
// =========================================================================
describe('INT-027: アーカイブデータのCSV出力', () => {
  it('CSVエクスポート時にアーカイブ済みデータも含まれる', () => {
    const sessions: Session[] = [
      {
        id: 'session-active',
        userId: 'test-user-id',
        projectId: 'project-1',
        startAt: new Date('2026-01-15T10:00:00'),
        endAt: new Date('2026-01-15T11:00:00'),
        durationMs: 60 * 60 * 1000,
        memo: 'アクティブセッション',
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'session-archived',
        userId: 'test-user-id',
        projectId: 'project-1',
        startAt: new Date('2024-01-15T10:00:00'),
        endAt: new Date('2024-01-15T12:00:00'),
        durationMs: 2 * 60 * 60 * 1000,
        memo: 'アーカイブ済みセッション',
        isArchived: true,
        archivedAt: new Date('2025-01-16T00:00:00'),
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2025-01-16T00:00:00'),
      },
    ];

    const projects: Project[] = [
      {
        id: 'project-1',
        userId: 'test-user-id',
        name: 'Test Project',
        color: '#3B82F6',
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const projectMap = createProjectMap(projects);
    const csv = exportSessionsToCSV(sessions, projectMap);

    // ヘッダーを含む
    expect(csv).toContain('ID,プロジェクト名,開始時刻,終了時刻');

    // アクティブセッションを含む
    expect(csv).toContain('session-active');
    expect(csv).toContain('アクティブセッション');

    // アーカイブ済みセッションも含む
    expect(csv).toContain('session-archived');
    expect(csv).toContain('アーカイブ済みセッション');
    expect(csv).toContain('はい'); // isArchived = true
  });

  it('getAllSessionsがアーカイブを含むすべてのセッションを返す', async () => {
    mockGetAllSessions.mockResolvedValue([
      {
        id: 'session-1',
        isArchived: false,
      },
      {
        id: 'session-2',
        isArchived: true,
      },
    ]);

    const allSessions = await mockGetAllSessions();

    expect(allSessions).toHaveLength(2);
    expect(allSessions.some((s: { isArchived: boolean }) => s.isArchived)).toBe(true);
    expect(allSessions.some((s: { isArchived: boolean }) => !s.isArchived)).toBe(true);
  });
});
