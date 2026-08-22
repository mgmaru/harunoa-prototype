/**
 * 計測画面（SCR-004）のユニットテスト
 *
 * 関連Issue: #20 プロジェクト一覧からの計測開始時のプロジェクト事前選択
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Project } from '@/types/project';
import TimerPage from '../page';

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  useProjects: vi.fn(),
  useTimer: vi.fn(),
  usePresets: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/timer',
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('@/hooks/useProjects', () => ({ useProjects: mocks.useProjects }));
vi.mock('@/hooks/useTimer', () => ({ useTimer: mocks.useTimer }));
vi.mock('@/hooks/usePresets', () => ({ usePresets: mocks.usePresets }));

const buildProject = (id: string, name: string): Project => ({
  id,
  userId: 'user-1',
  name,
  color: '#3B82F6',
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const projectA = buildProject('project-a', 'プロジェクトA');
const projectB = buildProject('project-b', 'プロジェクトB');

const setProjects = (projects: Project[], isLoading = false) => {
  mocks.useProjects.mockReturnValue({ projects, isLoading });
};

const getProjectSelect = () =>
  screen.getByRole('combobox', { name: /プロジェクト選択/ });

const getStartButton = () => screen.getByRole('button', { name: /計測開始/ });

describe('TimerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    setProjects([projectA, projectB]);
    mocks.useTimer.mockReturnValue({
      status: 'stopped',
      projectId: null,
      projectName: null,
      projectColor: null,
      memo: '',
      elapsedMs: 0,
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      setMemo: vi.fn(),
      reset: vi.fn(),
      isRunning: false,
      isPaused: false,
      isStopped: true,
      pomodoro: { setPreset: vi.fn() },
    });
    mocks.usePresets.mockReturnValue({
      presets: [],
      activePreset: null,
      isLoading: false,
    });
  });

  it('projectIdクエリに一致するプロジェクトを初期選択する', async () => {
    // Arrange
    mocks.searchParams = new URLSearchParams('projectId=project-b');

    // Act
    render(<TimerPage />);

    // Assert
    await waitFor(() => expect(getProjectSelect()).toHaveValue('project-b'));
    expect(getStartButton()).toBeEnabled();
  });

  it('プロジェクト一覧の読み込み完了後にprojectIdクエリを反映する', async () => {
    // Arrange
    mocks.searchParams = new URLSearchParams('projectId=project-b');
    setProjects([], true);
    const { rerender } = render(<TimerPage />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // Act
    setProjects([projectA, projectB]);
    rerender(<TimerPage />);

    // Assert
    await waitFor(() => expect(getProjectSelect()).toHaveValue('project-b'));
  });

  it('projectIdクエリが一覧に存在しない場合は未選択のままとする', async () => {
    // Arrange
    mocks.searchParams = new URLSearchParams('projectId=archived-project');

    // Act
    render(<TimerPage />);

    // Assert
    await waitFor(() => expect(getProjectSelect()).toHaveValue(''));
    expect(screen.getByText('選択してください')).toBeInTheDocument();
    expect(getStartButton()).toBeDisabled();
  });

  it('projectIdクエリがない場合は未選択のままとする', async () => {
    // Act
    render(<TimerPage />);

    // Assert
    await waitFor(() => expect(getProjectSelect()).toHaveValue(''));
    expect(getStartButton()).toBeDisabled();
  });

  it('初期選択後にユーザーが選んだプロジェクトを上書きしない', async () => {
    // Arrange
    mocks.searchParams = new URLSearchParams('projectId=project-b');
    const { rerender } = render(<TimerPage />);
    await waitFor(() => expect(getProjectSelect()).toHaveValue('project-b'));

    // Act: ユーザーが選択を変更した後、プロジェクト一覧が再取得される
    fireEvent.change(getProjectSelect(), { target: { value: 'project-a' } });
    setProjects([buildProject('project-a', 'プロジェクトA'), projectB]);
    rerender(<TimerPage />);

    // Assert
    await waitFor(() => expect(getProjectSelect()).toHaveValue('project-a'));
  });
});
