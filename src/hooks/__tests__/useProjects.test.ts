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
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

import { useProjects } from '../useProjects';
import * as projectService from '@/services/projects';
import { useAuth } from '../useAuth';

const mockProjects: Project[] = [
  {
    id: 'project-1',
    userId: 'test-uid',
    name: 'プロジェクト1',
    color: '#3B82F6',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'project-2',
    userId: 'test-uid',
    name: 'プロジェクト2',
    color: '#22C55E',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-20'),
  },
];

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(projectService.getProjects).mockResolvedValue(mockProjects);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時にプロジェクト一覧を取得する', async () => {
    const { result } = renderHook(() => useProjects());

    // 初期状態はローディング中
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.error).toBeNull();
    expect(projectService.getProjects).toHaveBeenCalledWith('test-uid');
  });

  it('ユーザーが未認証の場合はプロジェクトを取得しない', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projects).toEqual([]);
    expect(projectService.getProjects).not.toHaveBeenCalled();
  });

  it('プロジェクト取得に失敗した場合はエラー状態になる', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const errorMessage = 'ネットワークエラー';
    vi.mocked(projectService.getProjects).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(errorMessage);
    expect(result.current.projects).toEqual([]);
  });

  it('createを呼び出すとプロジェクトが作成され、一覧に追加される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const newProject: Project = {
      id: 'project-new',
      userId: 'test-uid',
      name: '新規プロジェクト',
      color: '#EAB308',
      isArchived: false,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(projectService.createProject).mockResolvedValue(newProject);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const created = await result.current.create({ name: '新規プロジェクト' });
      expect(created).toEqual(newProject);
    });

    expect(projectService.createProject).toHaveBeenCalledWith('test-uid', {
      name: '新規プロジェクト',
    });

    // 新しいプロジェクトが先頭に追加される
    expect(result.current.projects[0]).toEqual(newProject);
    expect(result.current.projects.length).toBe(mockProjects.length + 1);
  });

  it('未認証状態でcreateを呼び出すとエラーがスローされる', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.create({ name: 'テスト' });
      })
    ).rejects.toThrow('認証が必要です');
  });

  it('updateを呼び出すとプロジェクトが更新される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(projectService.updateProject).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.update('project-1', { name: '更新後の名前' });
    });

    expect(projectService.updateProject).toHaveBeenCalledWith('project-1', {
      name: '更新後の名前',
    });

    const updatedProject = result.current.projects.find(
      (p) => p.id === 'project-1'
    );
    expect(updatedProject?.name).toBe('更新後の名前');
  });

  it('archiveを呼び出すとプロジェクトが一覧から削除される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(projectService.archiveProject).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.projects.length;

    await act(async () => {
      await result.current.archive('project-1');
    });

    expect(projectService.archiveProject).toHaveBeenCalledWith('project-1');
    expect(result.current.projects.length).toBe(initialLength - 1);
    expect(
      result.current.projects.find((p) => p.id === 'project-1')
    ).toBeUndefined();
  });

  it('refreshを呼び出すとプロジェクト一覧が再取得される', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-uid' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 初回のfetch
    expect(projectService.getProjects).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    // refreshで再度fetch
    expect(projectService.getProjects).toHaveBeenCalledTimes(2);
  });
});
