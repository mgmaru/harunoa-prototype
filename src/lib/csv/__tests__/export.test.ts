import { describe, it, expect } from 'vitest';
import {
  exportProjectsToCSV,
  exportSessionsToCSV,
  createProjectMap,
} from '../export';
import type { Project } from '@/types/project';
import type { Session } from '@/types/session';

describe('exportProjectsToCSV', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      userId: 'user-1',
      name: 'プロジェクト1',
      color: '#3B82F6',
      isArchived: false,
      archivedAt: null,
      createdAt: new Date('2026-01-15T10:30:00'),
      updatedAt: new Date('2026-01-20T14:00:00'),
    },
    {
      id: 'project-2',
      userId: 'user-1',
      name: 'アーカイブ済み',
      color: '#22C55E',
      isArchived: true,
      archivedAt: new Date('2026-01-18T09:00:00'),
      createdAt: new Date('2026-01-10T08:00:00'),
      updatedAt: new Date('2026-01-18T09:00:00'),
    },
  ];

  it('プロジェクトデータをCSV形式に変換する', () => {
    const csv = exportProjectsToCSV(mockProjects);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('ID,プロジェクト名,色,アーカイブ済み,作成日');
    expect(lines[1]).toBe('project-1,プロジェクト1,#3B82F6,いいえ,2026-01-15 10:30:00');
    expect(lines[2]).toBe('project-2,アーカイブ済み,#22C55E,はい,2026-01-10 08:00:00');
  });

  it('空の配列の場合はヘッダーのみ返す', () => {
    const csv = exportProjectsToCSV([]);
    expect(csv).toBe('ID,プロジェクト名,色,アーカイブ済み,作成日');
  });

  it('カンマを含むプロジェクト名はダブルクォートでエスケープする', () => {
    const projectsWithComma: Project[] = [
      {
        ...mockProjects[0],
        name: 'テスト,プロジェクト',
      },
    ];

    const csv = exportProjectsToCSV(projectsWithComma);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('"テスト,プロジェクト"');
  });

  it('ダブルクォートを含むプロジェクト名は二重エスケープする', () => {
    const projectsWithQuote: Project[] = [
      {
        ...mockProjects[0],
        name: 'テスト"プロジェクト',
      },
    ];

    const csv = exportProjectsToCSV(projectsWithQuote);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('"テスト""プロジェクト"');
  });
});

describe('exportSessionsToCSV', () => {
  const mockSessions: Session[] = [
    {
      id: 'session-1',
      userId: 'user-1',
      projectId: 'project-1',
      startAt: new Date('2026-01-20T09:00:00'),
      endAt: new Date('2026-01-20T10:30:00'),
      durationMs: 90 * 60 * 1000, // 90分
      memo: '朝の作業',
      isArchived: false,
      archivedAt: null,
      createdAt: new Date('2026-01-20T10:30:00'),
      updatedAt: new Date('2026-01-20T10:30:00'),
    },
    {
      id: 'session-2',
      userId: 'user-1',
      projectId: 'project-2',
      startAt: new Date('2026-01-19T14:00:00'),
      endAt: new Date('2026-01-19T15:30:00'),
      durationMs: 90 * 60 * 1000,
      memo: '',
      isArchived: true,
      archivedAt: new Date('2026-01-25T00:00:00'),
      createdAt: new Date('2026-01-19T15:30:00'),
      updatedAt: new Date('2026-01-25T00:00:00'),
    },
  ];

  const projectMap = new Map([
    ['project-1', 'プロジェクト1'],
    ['project-2', 'プロジェクト2'],
  ]);

  it('セッションデータをCSV形式に変換する', () => {
    const csv = exportSessionsToCSV(mockSessions, projectMap);
    const lines = csv.split('\n');

    expect(lines[0]).toBe(
      'ID,プロジェクト名,開始時刻,終了時刻,計測時間(分),メモ,アーカイブ済み,アーカイブ日時'
    );
    expect(lines[1]).toBe(
      'session-1,プロジェクト1,2026-01-20 09:00:00,2026-01-20 10:30:00,90,朝の作業,いいえ,'
    );
    expect(lines[2]).toBe(
      'session-2,プロジェクト2,2026-01-19 14:00:00,2026-01-19 15:30:00,90,,はい,2026-01-25 00:00:00'
    );
  });

  it('存在しないプロジェクトIDの場合はUnknownを表示する', () => {
    const sessionsWithUnknown: Session[] = [
      {
        ...mockSessions[0],
        projectId: 'unknown-project',
      },
    ];

    const csv = exportSessionsToCSV(sessionsWithUnknown, projectMap);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('Unknown');
  });

  it('空の配列の場合はヘッダーのみ返す', () => {
    const csv = exportSessionsToCSV([], projectMap);
    expect(csv).toBe(
      'ID,プロジェクト名,開始時刻,終了時刻,計測時間(分),メモ,アーカイブ済み,アーカイブ日時'
    );
  });

  it('メモにカンマや改行を含む場合はエスケープする', () => {
    const sessionsWithSpecialChars: Session[] = [
      {
        ...mockSessions[0],
        memo: 'テスト,メモ\n改行あり',
      },
    ];

    const csv = exportSessionsToCSV(sessionsWithSpecialChars, projectMap);

    // CSV全体に正しくエスケープされた文字列が含まれていることを確認
    expect(csv).toContain('"テスト,メモ\n改行あり"');
  });
});

describe('createProjectMap', () => {
  it('プロジェクトIDから名前へのマップを作成する', () => {
    const projects: Project[] = [
      {
        id: 'project-1',
        userId: 'user-1',
        name: 'プロジェクト1',
        color: '#3B82F6',
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'project-2',
        userId: 'user-1',
        name: 'プロジェクト2',
        color: '#22C55E',
        isArchived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const map = createProjectMap(projects);

    expect(map.get('project-1')).toBe('プロジェクト1');
    expect(map.get('project-2')).toBe('プロジェクト2');
    expect(map.size).toBe(2);
  });

  it('空の配列の場合は空のマップを返す', () => {
    const map = createProjectMap([]);
    expect(map.size).toBe(0);
  });
});
