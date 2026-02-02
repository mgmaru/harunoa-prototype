import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';

// Firebase configをモック（@/services/authより先にモックする）
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase authサービスのモック
vi.mock('@/services/auth', () => ({
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((callback) => {
    // 初期状態ではnull（未認証）を返す
    callback(null);
    return vi.fn(); // unsubscribe関数
  }),
}));

// presetsサービスをモック
vi.mock('@/services/presets', () => ({
  ensureDefaultPreset: vi.fn().mockResolvedValue(undefined),
}));

// モックの後にインポート
import { useAuth } from '../useAuth';
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/auth';

const mockUser: Partial<User> = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
};

describe('useAuth', () => {
  beforeEach(() => {
    // ストアをリセット
    useAuthStore.setState({ user: null, isLoading: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態ではisLoadingがtrueになる', () => {
    // onAuthStateChangedがコールバックを呼ぶ前の状態をテスト
    vi.mocked(authService.onAuthStateChanged).mockImplementation(() => {
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('認証状態変更時にユーザー情報が更新される', async () => {
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('signInを呼び出すとsignInWithGoogleが実行される', async () => {
    vi.mocked(authService.signInWithGoogle).mockResolvedValue(mockUser as User);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn();
    });

    expect(authService.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('signOutを呼び出すとsignOutが実行される', async () => {
    vi.mocked(authService.signOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(authService.signOut).toHaveBeenCalledTimes(1);
  });

  it('ユーザーがログアウトするとisAuthenticatedがfalseになる', async () => {
    // 最初は認証済み
    vi.mocked(authService.onAuthStateChanged).mockImplementation((callback) => {
      callback(mockUser as User);
      return vi.fn();
    });

    const { result, rerender } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // ログアウト後の状態をシミュレート
    act(() => {
      useAuthStore.setState({ user: null, isLoading: false });
    });

    rerender();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('アンマウント時にonAuthStateChangedの購読が解除される', () => {
    const unsubscribe = vi.fn();
    vi.mocked(authService.onAuthStateChanged).mockImplementation(() => {
      return unsubscribe;
    });

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
