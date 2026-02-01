import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { Session } from '@/types/session';
import type { Project } from '@/types/project';

// Firebase configをモック（インポート前に実行）
vi.mock('@/lib/firebase/config', () => ({
  app: {},
  auth: {},
  db: {},
}));

// Firebase sessionsサービスのモック
vi.mock('@/services/sessions', () => ({
  getSessionsByPeriod: vi.fn(),
}));

// useAuthをモック
vi.mock('../useAuth');

// useProjectsをモック
vi.mock('../useProjects');

// モック後にインポート
import { useAnalytics } from '../useAnalytics';
import * as sessionService from '@/services/sessions';
import { useAuth } from '../useAuth';
import { useProjects } from '../useProjects';

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    userId: 'test-user-id',
    name: 'Project A',
    color: '#FF0000',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'proj-2',
    userId: 'test-user-id',
    name: 'Project B',
    color: '#00FF00',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 固定日付を設定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00'));

    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'test-user-id' } as User,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    vi.mocked(useProjects).mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      error: null,
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
      refresh: vi.fn(),
    });

    // デフォルトは空配列を返す
    vi.mocked(sessionService.getSessionsByPeriod).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should initialize with week period type', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(result.current.periodType).toBe('week');
  });

  it('should fetch sessions and aggregate on mount', async () => {
    // Arrange
    const mockSessions: Session[] = [
      {
        id: 'sess-1',
        userId: 'test-user-id',
        projectId: 'proj-1',
        startAt: new Date('2026-01-15T10:00:00'),
        endAt: new Date('2026-01-15T11:00:00'),
        durationMs: 3600000,
        memo: '',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
    ];
    vi.mocked(sessionService.getSessionsByPeriod).mockResolvedValue(mockSessions);

    // Act
    const { result } = renderHook(() => useAnalytics());

    // useEffectとasync処理を実行
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Assert
    expect(sessionService.getSessionsByPeriod).toHaveBeenCalled();
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].projectId).toBe('proj-1');
    expect(result.current.items[0].totalMinutes).toBe(60);
  });

  it('should calculate total minutes from all items', async () => {
    // Arrange
    const mockSessions: Session[] = [
      {
        id: 'sess-1',
        userId: 'test-user-id',
        projectId: 'proj-1',
        startAt: new Date('2026-01-15T10:00:00'),
        endAt: new Date('2026-01-15T11:00:00'),
        durationMs: 3600000,
        memo: '',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
      {
        id: 'sess-2',
        userId: 'test-user-id',
        projectId: 'proj-2',
        startAt: new Date('2026-01-15T14:00:00'),
        endAt: new Date('2026-01-15T14:30:00'),
        durationMs: 1800000,
        memo: '',
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15'),
      },
    ];
    vi.mocked(sessionService.getSessionsByPeriod).mockResolvedValue(mockSessions);

    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Assert
    expect(result.current.totalMinutes).toBe(90); // 60 + 30
  });

  it('should change period type when setPeriodType is called', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.setPeriodType('month');
    });

    // Assert
    expect(result.current.periodType).toBe('month');
  });

  it('should navigate to previous period when goToPrevious is called', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const initialLabel = result.current.label;

    act(() => {
      result.current.goToPrevious();
    });

    // Assert
    expect(result.current.label).not.toBe(initialLabel);
    // For week type, should show previous week
    expect(result.current.label).toBe('1/5〜1/11');
  });

  it('should navigate to next period when goToNext is called', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.goToNext();
    });

    // Assert
    // For week type, should show next week
    expect(result.current.label).toBe('1/19〜1/25');
  });

  it('should return to today when goToToday is called', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Navigate away
    act(() => {
      result.current.goToPrevious();
    });
    act(() => {
      result.current.goToPrevious();
    });

    const awayLabel = result.current.label;

    // Go back to today
    act(() => {
      result.current.goToToday();
    });

    // Assert
    expect(result.current.label).not.toBe(awayLabel);
    expect(result.current.label).toBe('1/12〜1/18'); // Week containing Jan 15
  });

  it('should generate correct label for day period type', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.setPeriodType('day');
    });

    // Assert
    expect(result.current.label).toContain('2026年1月15日');
  });

  it('should generate correct label for month period type', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.setPeriodType('month');
    });

    // Assert
    expect(result.current.label).toBe('2026年1月');
  });

  it('should generate correct label for year period type', async () => {
    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      result.current.setPeriodType('year');
    });

    // Assert
    expect(result.current.label).toBe('2026年');
  });

  it('should return empty items when no sessions exist', async () => {
    // Arrange - already mocked to return empty array

    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Assert
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalMinutes).toBe(0);
  });

  it('should not fetch data when user is not authenticated', async () => {
    // Arrange
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    // Act
    const { result } = renderHook(() => useAnalytics());

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Assert
    expect(sessionService.getSessionsByPeriod).not.toHaveBeenCalled();
    expect(result.current.items).toHaveLength(0);
  });
});
