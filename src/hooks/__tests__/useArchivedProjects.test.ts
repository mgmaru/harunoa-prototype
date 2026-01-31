import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Project } from '@/types/project';

// Firebase configをモック（services/projectsがインポートする前に）
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase projectsサービスのモック
vi.mock('@/services/projects', () => ({
  getArchivedProjects: vi.fn(),
  restoreProject: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { useArchivedProjects } from '../useArchivedProjects';
import * as projectService from '@/services/projects';
import { useAuth } from '../useAuth';

const mockArchivedProjects: Project[] = [
  {
    id: 'archived-1',
    userId: 'test-uid',
    name: 'アーカイブ済みプロジェクト1',
    color: '#3B82F6',
    isArchived: true,
    archivedAt: new Date('2026-01-10'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'archived-2',
    userId: 'test-uid',
    name: 'アーカイブ済みプロジェクト2',
    color: '#22C55E',
    isArchived: true,
    archivedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-15'),
  },
];

describe('useArchivedProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(projectService.getArchivedProjects).mockResolvedValue(
      mockArchivedProjects
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時にアーカイブ済みプロジェクト一覧を取得する', async () => {
    const { result } = renderHook(() => useArchivedProjects());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockArchivedProjects);
    expect(result.current.error).toBeNull();
    expect(projectService.getArchivedProjects).toHaveBeenCalledWith('test-uid');
  });

  it('ユーザーが未認証の場合はプロジェクトを取得しない', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useArchivedProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(projectService.getArchivedProjects).not.toHaveBeenCalled();
  });

  it('取得に失敗した場合はエラー状態になる', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const errorMessage = '取得エラー';
    vi.mocked(projectService.getArchivedProjects).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useArchivedProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('restoreを呼び出すとプロジェクトが一覧から削除される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(projectService.restoreProject).mockResolvedValue(undefined);

    const { result } = renderHook(() => useArchivedProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.projects.length;

    await act(async () => {
      await result.current.restore('archived-1');
    });

    expect(projectService.restoreProject).toHaveBeenCalledWith('archived-1');
    expect(result.current.projects.length).toBe(initialLength - 1);
    expect(
      result.current.projects.find((p) => p.id === 'archived-1')
    ).toBeUndefined();
  });

  it('refreshを呼び出すとアーカイブ一覧が再取得される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useArchivedProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(projectService.getArchivedProjects).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(projectService.getArchivedProjects).toHaveBeenCalledTimes(2);
  });
});
