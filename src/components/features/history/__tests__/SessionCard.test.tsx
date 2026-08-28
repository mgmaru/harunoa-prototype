/**
 * SessionCardのユニットテスト
 *
 * 関連Issue: #24 履歴の時間表記に計測時間と一時停止時間の内訳を表示する
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Session } from '@/types/session';
import { Project } from '@/types/project';
import { SessionCard } from '../SessionCard';

const MINUTE = 60 * 1000;

const project: Project = {
  id: 'project-1',
  userId: 'user-1',
  name: 'プロジェクトA',
  color: '#3B82F6',
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2026-01-01T00:00:00'),
  updatedAt: new Date('2026-01-01T00:00:00'),
};

/**
 * 10:00〜14:00の経過時間に対し、計測時間3時間50分（＝一時停止10分）のセッション
 */
const createSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  userId: 'user-1',
  projectId: project.id,
  startAt: new Date('2026-01-21T10:00:00'),
  endAt: new Date('2026-01-21T14:00:00'),
  durationMs: 230 * MINUTE,
  memo: '',
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2026-01-21T14:00:00'),
  updatedAt: new Date('2026-01-21T14:00:00'),
  ...overrides,
});

describe('SessionCard', () => {
  const renderCard = (session: Session) =>
    render(
      <SessionCard
        session={session}
        project={project}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

  it('一時停止を含むセッションでは計測時間と一時停止時間の内訳を表示する', () => {
    renderCard(createSession());

    expect(
      screen.getByText('10:00 - 14:00（計測 3時間50分 / 一時停止 10分）')
    ).toBeInTheDocument();
  });

  it('一時停止のないセッションでは計測時間のみを表示する', () => {
    renderCard(
      createSession({
        endAt: new Date('2026-01-21T11:00:00'),
        durationMs: 60 * MINUTE,
      })
    );

    expect(screen.getByText('10:00 - 11:00（1時間）')).toBeInTheDocument();
  });
});
