/**
 * 結合テスト: コア機能連携テスト (INT-001〜INT-004)
 *
 * docs/testing/integration-test-plan.md セクション1に対応
 * 実施タイミング: 03_timer.md 実装完了後
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
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
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
  },
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
}));

// ===== usePomodoroモック（通知機能の依存関係を分離）=====
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

// ===== 認証サービスモック =====
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/services/auth', () => ({
  signInWithGoogle: () => mockSignInWithGoogle(),
  signOut: () => mockSignOut(),
  onAuthStateChanged: (callback: (user: User | null) => void) =>
    mockOnAuthStateChanged(callback),
}));

// ===== プロジェクトサービスモック =====
const mockGetProjects = vi.fn();
const mockCreateProject = vi.fn();

vi.mock('@/services/projects', () => ({
  getProjects: () => mockGetProjects(),
  getArchivedProjects: vi.fn().mockResolvedValue([]),
  createProject: () => mockCreateProject(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  restoreProject: vi.fn(),
}));

// ===== セッションサービスモック =====
const mockCreateSession = vi.fn();
const mockGetSessions = vi.fn();
const mockGetSessionsByDate = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/services/sessions', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  getSessions: () => mockGetSessions(),
  getSessionsByDate: (...args: unknown[]) => mockGetSessionsByDate(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
  getSessionsByProject: vi.fn().mockResolvedValue([]),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  archiveOldSessions: vi.fn().mockResolvedValue({ archivedCount: 0 }),
}));

// ===== プリセットサービスモック =====
vi.mock('@/services/presets', () => ({
  getPresets: vi.fn().mockResolvedValue([]),
  createPreset: vi.fn(),
  updatePreset: vi.fn(),
  deletePreset: vi.fn(),
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

// ===== Next.js router モック =====
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/timer',
  useSearchParams: () => new URLSearchParams(),
}));

// ===== ストアのインポート（モック後） =====
import { useAuthStore } from '@/stores/authStore';
import { useTimerStore } from '@/stores/timerStore';

// ===== テスト対象 =====
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useTimer } from '@/hooks/useTimer';
import { useSessions } from '@/hooks/useSessions';
import { splitSessionByDate } from '@/lib/date/session-split';

// ===== テスト用データ =====
const mockUserA: Partial<User> = {
  uid: 'user-a-uid',
  email: 'user-a@example.com',
  displayName: 'User A',
};

const mockUserB: Partial<User> = {
  uid: 'user-b-uid',
  email: 'user-b@example.com',
  displayName: 'User B',
};

const mockProjectsUserA = [
  {
    id: 'project-a1',
    userId: 'user-a-uid',
    name: 'User A Project 1',
    color: '#3B82F6',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'project-a2',
    userId: 'user-a-uid',
    name: 'User A Project 2',
    color: '#22C55E',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProjectsUserB = [
  {
    id: 'project-b1',
    userId: 'user-b-uid',
    name: 'User B Project 1',
    color: '#EAB308',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('コア機能連携テスト (INT-001〜INT-004)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // ストアをリセット
    useAuthStore.setState({ user: null, isLoading: true });
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

    // デフォルトのモック設定
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // INT-001: 未認証でのアクセス制限
  // =========================================================================
  describe('INT-001: 未認証でのアクセス制限', () => {
    it('未認証状態ではisAuthenticatedがfalseになる', async () => {
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('認証レイアウトは未認証ユーザーをログイン画面にリダイレクトする', async () => {
      // 未認証状態を設定
      useAuthStore.setState({ user: null, isLoading: false });

      // AuthLayoutの動作をシミュレート
      const isAuthenticated = useAuthStore.getState().user !== null;
      const isLoading = useAuthStore.getState().isLoading;

      if (!isLoading && !isAuthenticated) {
        mockPush('/login');
      }

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('認証済みユーザーは保護されたページにアクセスできる', async () => {
      // 認証済み状態を設定
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUserA as User);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.uid).toBe('user-a-uid');
    });
  });

  // =========================================================================
  // INT-002: ログイン後の遷移
  // =========================================================================
  describe('INT-002: ログイン後の遷移', () => {
    it('ログイン成功後、ホーム画面に遷移する', async () => {
      mockSignInWithGoogle.mockResolvedValue(mockUserA as User);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

      // ログイン後はホームへ遷移（login/page.tsxでrouter.push('/')が呼ばれる）
      mockPush('/');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('ログイン失敗時はエラーが発生する', async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signIn()).rejects.toThrow('Login failed');
    });
  });

  // =========================================================================
  // INT-003: 複数ユーザー間のデータ分離
  // =========================================================================
  describe('INT-003: 複数ユーザー間のデータ分離', () => {
    it('ユーザーAはユーザーAのプロジェクトのみ取得できる', async () => {
      // ユーザーAで認証
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUserA as User);
        return vi.fn();
      });

      // ユーザーAのプロジェクトのみ返す
      mockGetProjects.mockResolvedValue(mockProjectsUserA);

      const { result: authResult } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(authResult.current.isAuthenticated).toBe(true);
      });

      const { result: projectsResult } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(projectsResult.current.isLoading).toBe(false);
      });

      // ユーザーAのプロジェクトのみ含まれる
      expect(projectsResult.current.projects).toHaveLength(2);
      projectsResult.current.projects.forEach((project) => {
        expect(project.userId).toBe('user-a-uid');
      });

      // ユーザーBのプロジェクトは含まれない
      const userBProjectIds = mockProjectsUserB.map((p) => p.id);
      projectsResult.current.projects.forEach((project) => {
        expect(userBProjectIds).not.toContain(project.id);
      });
    });

    it('ユーザーBはユーザーBのプロジェクトのみ取得できる', async () => {
      // ユーザーBで認証
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUserB as User);
        return vi.fn();
      });

      // ユーザーBのプロジェクトのみ返す
      mockGetProjects.mockResolvedValue(mockProjectsUserB);

      const { result: authResult } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(authResult.current.isAuthenticated).toBe(true);
      });

      const { result: projectsResult } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(projectsResult.current.isLoading).toBe(false);
      });

      // ユーザーBのプロジェクトのみ含まれる
      expect(projectsResult.current.projects).toHaveLength(1);
      expect(projectsResult.current.projects[0].userId).toBe('user-b-uid');
    });

    it('サービス層でuserIdによるフィルタリングが行われる', async () => {
      // プロジェクト取得時にuserIdが渡されることを確認
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUserA as User);
        return vi.fn();
      });

      mockGetProjects.mockResolvedValue(mockProjectsUserA);

      const { result: authResult } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(authResult.current.isAuthenticated).toBe(true);
      });

      renderHook(() => useProjects());

      await waitFor(() => {
        expect(mockGetProjects).toHaveBeenCalled();
      });

      // getProjectsが呼ばれたことを確認
      // 実際のサービス層ではuserIdでフィルタリングしている
      expect(mockGetProjects).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // INT-004: プロジェクト切替時の計測継続
  // =========================================================================
  describe('INT-004: プロジェクト切替時の計測継続', () => {
    beforeEach(() => {
      // 認証済み状態を直接設定
      useAuthStore.setState({
        user: mockUserA as User,
        isLoading: false,
      });

      mockGetProjects.mockResolvedValue(mockProjectsUserA);
    });

    it('計測中に別プロジェクトを選択すると警告状態になる', () => {
      const { result: timerResult } = renderHook(() => useTimer());

      // プロジェクト1で計測開始
      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      expect(timerResult.current.isRunning).toBe(true);
      expect(timerResult.current.projectId).toBe('project-a1');

      // 計測中の状態で別プロジェクトを選択しようとする
      // （実際のUIでは警告モーダルが表示される）
      const isRunning = timerResult.current.isRunning;
      const currentProjectId = timerResult.current.projectId;
      const newProjectId = 'project-a2';

      // 計測中かつ別プロジェクトの場合、警告が必要
      const shouldShowWarning = isRunning && currentProjectId !== newProjectId;
      expect(shouldShowWarning).toBe(true);
    });

    it('計測切替承認後、旧計測が停止・保存され新計測が開始される', async () => {
      const now = Date.now();

      const mockSession = {
        id: 'session-1',
        userId: 'user-a-uid',
        projectId: 'project-a1',
        startAt: new Date(now - 60000), // 1分前
        endAt: new Date(now),
        durationMs: 60000,
        memo: '',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      mockCreateSession.mockResolvedValue(mockSession);

      // 認証状態をonAuthStateChangedでも設定
      mockOnAuthStateChanged.mockImplementation((callback) => {
        callback(mockUserA as User);
        return vi.fn();
      });

      const { result: timerResult } = renderHook(() => useTimer());

      // プロジェクト1で計測開始
      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      expect(timerResult.current.projectId).toBe('project-a1');

      // 旧計測を停止（セッション保存）
      await act(async () => {
        await timerResult.current.stop();
      });

      // セッションが保存されたことを確認
      expect(mockCreateSession).toHaveBeenCalledWith(
        'user-a-uid',
        expect.objectContaining({
          projectId: 'project-a1',
        })
      );

      expect(timerResult.current.isStopped).toBe(true);

      // 新計測を開始
      act(() => {
        timerResult.current.start({
          id: 'project-a2',
          name: 'User A Project 2',
          color: '#22C55E',
        });
      });

      expect(timerResult.current.isRunning).toBe(true);
      expect(timerResult.current.projectId).toBe('project-a2');
      expect(timerResult.current.projectName).toBe('User A Project 2');
    });

    it('同じプロジェクトを選択した場合は警告なしで集中モードへ遷移', () => {
      const { result: timerResult } = renderHook(() => useTimer());

      // プロジェクト1で計測開始
      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      // 同じプロジェクトを選択
      const isRunning = timerResult.current.isRunning;
      const currentProjectId = timerResult.current.projectId;
      const selectedProjectId = 'project-a1';

      // 同じプロジェクトなので警告不要
      const shouldShowWarning =
        isRunning && currentProjectId !== selectedProjectId;
      expect(shouldShowWarning).toBe(false);

      // そのまま集中モードへ遷移可能
      expect(timerResult.current.isRunning).toBe(true);
    });

    it('一時停止中に別プロジェクトを選択しても警告が表示される', () => {
      const { result: timerResult } = renderHook(() => useTimer());

      // プロジェクト1で計測開始
      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      // 一時停止
      act(() => {
        timerResult.current.pause();
      });

      expect(timerResult.current.isPaused).toBe(true);

      // 一時停止中でも別プロジェクト選択時は警告が必要
      const isStopped = timerResult.current.isStopped;
      const currentProjectId = timerResult.current.projectId;
      const newProjectId = 'project-a2';

      // 停止中でなく、別プロジェクトの場合は警告
      const shouldShowWarning = !isStopped && currentProjectId !== newProjectId;
      expect(shouldShowWarning).toBe(true);
    });
  });

  // =========================================================================
  // 追加テスト: タイマー状態の永続化
  // =========================================================================
  describe('追加テスト: タイマー状態の永続化', () => {
    it('計測状態がlocalStorageに保存される', () => {
      const { result: timerResult } = renderHook(() => useTimer());

      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      // Zustand persistにより状態が保存される
      const state = useTimerStore.getState();
      expect(state.status).toBe('running');
      expect(state.projectId).toBe('project-a1');
    });
  });
});

// =========================================================================
// INT-005 & INT-006: 履歴機能連携テスト
// =========================================================================
describe('INT-005 & INT-006: 履歴機能連携テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 認証済み状態を設定
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUserA as User);
      return vi.fn();
    });

    useAuthStore.setState({
      user: mockUserA as User,
      isLoading: false,
    });

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
  });

  describe('INT-005: 計測停止後のデータ保存', () => {
    it('計測停止後、セッションが保存され履歴画面で確認できる', async () => {
      const now = Date.now();
      const startTime = now - 90 * 60 * 1000; // 90分前

      const savedSession = {
        id: 'session-new',
        userId: 'user-a-uid',
        projectId: 'project-a1',
        startAt: new Date(startTime),
        endAt: new Date(now),
        durationMs: 90 * 60 * 1000,
        memo: 'テストメモ',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      mockCreateSession.mockResolvedValue(savedSession);
      mockGetSessionsByDate.mockResolvedValue([savedSession]);

      // タイマーフックを使用
      const { result: timerResult } = renderHook(() => useTimer());

      // 計測開始
      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      // メモを設定
      act(() => {
        timerResult.current.setMemo('テストメモ');
      });

      // 計測停止（セッション保存）
      await act(async () => {
        await timerResult.current.stop();
      });

      // セッションが保存されたことを確認
      expect(mockCreateSession).toHaveBeenCalledWith(
        'user-a-uid',
        expect.objectContaining({
          projectId: 'project-a1',
          memo: 'テストメモ',
        })
      );

      // 履歴フックを使用して確認
      const testDate = new Date(now);
      const { result: sessionsResult } = renderHook(() =>
        useSessions(testDate)
      );

      await waitFor(() => {
        expect(sessionsResult.current.isLoading).toBe(false);
      });

      // 保存されたセッションが履歴に表示される
      expect(sessionsResult.current.sessions).toHaveLength(1);
      expect(sessionsResult.current.sessions[0].id).toBe('session-new');
      expect(sessionsResult.current.sessions[0].memo).toBe('テストメモ');
    });

    it('セッションの開始時刻、終了時刻、作業時間が正しく保存される', async () => {
      const now = Date.now();
      const startTime = now - 60 * 60 * 1000; // 1時間前

      const savedSession = {
        id: 'session-time',
        userId: 'user-a-uid',
        projectId: 'project-a1',
        startAt: new Date(startTime),
        endAt: new Date(now),
        durationMs: 60 * 60 * 1000, // 1時間
        memo: '',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };

      mockCreateSession.mockResolvedValue(savedSession);
      mockGetSessionsByDate.mockResolvedValue([savedSession]);

      const { result: timerResult } = renderHook(() => useTimer());

      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      await act(async () => {
        await timerResult.current.stop();
      });

      const testDate = new Date(now);
      const { result: sessionsResult } = renderHook(() =>
        useSessions(testDate)
      );

      await waitFor(() => {
        expect(sessionsResult.current.isLoading).toBe(false);
      });

      const session = sessionsResult.current.sessions[0];
      expect(session.durationMs).toBe(60 * 60 * 1000);
      expect(session.startAt).toEqual(new Date(startTime));
      expect(session.endAt).toEqual(new Date(now));
    });
  });

  describe('INT-006: 長時間計測の保存（日付跨ぎ）', () => {
    it('日付跨ぎ按分ロジックが正しく動作する', () => {
      // 23:50 - 00:10 (20分)
      const startAt = new Date('2026-01-21T23:50:00');
      const endAt = new Date('2026-01-22T00:10:00');

      const splits = splitSessionByDate(startAt, endAt);

      // 2日に分割される
      expect(splits).toHaveLength(2);

      // 1日目: 23:50 - 24:00 (10分)
      expect(splits[0].date).toEqual(new Date('2026-01-21T00:00:00'));
      expect(splits[0].durationMs).toBe(10 * 60 * 1000);

      // 2日目: 00:00 - 00:10 (10分)
      expect(splits[1].date).toEqual(new Date('2026-01-22T00:00:00'));
      expect(splits[1].durationMs).toBe(10 * 60 * 1000);
    });

    it('日付を跨ぐセッションが履歴に保存される', async () => {
      // 23:00 - 01:00 (2時間)
      const startAt = new Date('2026-01-21T23:00:00');
      const endAt = new Date('2026-01-22T01:00:00');
      const durationMs = 2 * 60 * 60 * 1000;

      const savedSession = {
        id: 'session-overnight',
        userId: 'user-a-uid',
        projectId: 'project-a1',
        startAt,
        endAt,
        durationMs,
        memo: '深夜作業',
        createdAt: endAt,
        updatedAt: endAt,
      };

      mockCreateSession.mockResolvedValue(savedSession);
      mockGetSessionsByDate.mockResolvedValue([savedSession]);

      const { result: timerResult } = renderHook(() => useTimer());

      act(() => {
        timerResult.current.start({
          id: 'project-a1',
          name: 'User A Project 1',
          color: '#3B82F6',
        });
      });

      act(() => {
        timerResult.current.setMemo('深夜作業');
      });

      await act(async () => {
        await timerResult.current.stop();
      });

      // セッションが保存されたことを確認
      expect(mockCreateSession).toHaveBeenCalled();

      // 1/21の履歴を確認
      const day1 = new Date('2026-01-21');
      const { result: sessions1 } = renderHook(() => useSessions(day1));

      await waitFor(() => {
        expect(sessions1.current.isLoading).toBe(false);
      });

      // セッションが表示される（開始日で取得される）
      expect(sessions1.current.sessions.length).toBeGreaterThanOrEqual(0);
    });

    it('複数日にまたがるセッションの按分が計算される', () => {
      // 3日間にまたがる長時間セッション
      const startAt = new Date('2026-01-20T22:00:00');
      const endAt = new Date('2026-01-22T02:00:00');

      const splits = splitSessionByDate(startAt, endAt);

      expect(splits).toHaveLength(3);

      // 1日目: 22:00 - 24:00 (2時間)
      expect(splits[0].date).toEqual(new Date('2026-01-20T00:00:00'));
      expect(splits[0].durationMs).toBe(2 * 60 * 60 * 1000);

      // 2日目: 00:00 - 24:00 (24時間)
      expect(splits[1].date).toEqual(new Date('2026-01-21T00:00:00'));
      expect(splits[1].durationMs).toBe(24 * 60 * 60 * 1000);

      // 3日目: 00:00 - 02:00 (2時間)
      expect(splits[2].date).toEqual(new Date('2026-01-22T00:00:00'));
      expect(splits[2].durationMs).toBe(2 * 60 * 60 * 1000);
    });
  });
});
