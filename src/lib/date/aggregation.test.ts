import { describe, it, expect } from 'vitest';
import {
  getPeriodRange,
  getPeriodLabel,
  aggregateSessions,
} from './aggregation';
import { Session } from '@/types/session';
import { Project } from '@/types/project';

describe('getPeriodRange', () => {
  const testDate = new Date('2026-01-15T12:00:00');

  it('should return start and end of day for "day" type', () => {
    const result = getPeriodRange('day', testDate);

    expect(result.start.getFullYear()).toBe(2026);
    expect(result.start.getMonth()).toBe(0);
    expect(result.start.getDate()).toBe(15);
    expect(result.start.getHours()).toBe(0);
    expect(result.start.getMinutes()).toBe(0);

    expect(result.end.getDate()).toBe(15);
    expect(result.end.getHours()).toBe(23);
    expect(result.end.getMinutes()).toBe(59);
  });

  it('should return start (Monday) and end (Sunday) of week for "week" type', () => {
    // 2026-01-15 is Thursday
    const result = getPeriodRange('week', testDate);

    // Week starts on Monday (2026-01-12)
    expect(result.start.getDate()).toBe(12);
    expect(result.start.getDay()).toBe(1); // Monday

    // Week ends on Sunday (2026-01-18)
    expect(result.end.getDate()).toBe(18);
    expect(result.end.getDay()).toBe(0); // Sunday
  });

  it('should return start and end of month for "month" type', () => {
    const result = getPeriodRange('month', testDate);

    expect(result.start.getDate()).toBe(1);
    expect(result.end.getDate()).toBe(31); // January has 31 days
  });

  it('should return start and end of year for "year" type', () => {
    const result = getPeriodRange('year', testDate);

    expect(result.start.getMonth()).toBe(0);
    expect(result.start.getDate()).toBe(1);
    expect(result.end.getMonth()).toBe(11);
    expect(result.end.getDate()).toBe(31);
  });
});

describe('getPeriodLabel', () => {
  const testDate = new Date('2026-01-15T12:00:00');

  it('should format day label in Japanese', () => {
    const result = getPeriodLabel('day', testDate);

    expect(result).toContain('2026年1月15日');
    expect(result).toContain('木'); // Thursday in Japanese
  });

  it('should format week label as date range', () => {
    const result = getPeriodLabel('week', testDate);

    // Monday to Sunday: 1/12〜1/18
    expect(result).toBe('1/12〜1/18');
  });

  it('should format month label in Japanese', () => {
    const result = getPeriodLabel('month', testDate);

    expect(result).toBe('2026年1月');
  });

  it('should format year label in Japanese', () => {
    const result = getPeriodLabel('year', testDate);

    expect(result).toBe('2026年');
  });
});

describe('aggregateSessions', () => {
  const createMockSession = (
    id: string,
    projectId: string,
    startAt: Date,
    endAt: Date
  ): Session => ({
    id,
    userId: 'user-1',
    projectId,
    startAt,
    endAt,
    durationMs: endAt.getTime() - startAt.getTime(),
    memo: '',
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockProject = (
    id: string,
    name: string,
    color: string,
    isArchived = false
  ): Project => ({
    id,
    userId: 'user-1',
    name,
    color,
    isArchived,
    archivedAt: isArchived ? new Date() : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('should aggregate sessions by project', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');

    const projects = [
      createMockProject('proj-1', 'Project A', '#FF0000'),
      createMockProject('proj-2', 'Project B', '#00FF00'),
    ];

    const sessions = [
      // Project A: 60 minutes
      createMockSession(
        'sess-1',
        'proj-1',
        new Date('2026-01-15T10:00:00'),
        new Date('2026-01-15T11:00:00')
      ),
      // Project B: 30 minutes
      createMockSession(
        'sess-2',
        'proj-2',
        new Date('2026-01-15T14:00:00'),
        new Date('2026-01-15T14:30:00')
      ),
      // Project A: 30 minutes (additional)
      createMockSession(
        'sess-3',
        'proj-1',
        new Date('2026-01-15T15:00:00'),
        new Date('2026-01-15T15:30:00')
      ),
    ];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result).toHaveLength(2);

    // Sorted by totalMinutes descending
    expect(result[0].projectId).toBe('proj-1');
    expect(result[0].totalMinutes).toBe(90); // 60 + 30
    expect(result[0].projectName).toBe('Project A');
    expect(result[0].projectColor).toBe('#FF0000');

    expect(result[1].projectId).toBe('proj-2');
    expect(result[1].totalMinutes).toBe(30);
  });

  it('should calculate percentage correctly', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');

    const projects = [
      createMockProject('proj-1', 'Project A', '#FF0000'),
      createMockProject('proj-2', 'Project B', '#00FF00'),
    ];

    const sessions = [
      // Project A: 90 minutes (75%)
      createMockSession(
        'sess-1',
        'proj-1',
        new Date('2026-01-15T10:00:00'),
        new Date('2026-01-15T11:30:00')
      ),
      // Project B: 30 minutes (25%)
      createMockSession(
        'sess-2',
        'proj-2',
        new Date('2026-01-15T14:00:00'),
        new Date('2026-01-15T14:30:00')
      ),
    ];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result[0].percentage).toBe(75);
    expect(result[1].percentage).toBe(25);
  });

  it('should exclude archived projects', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');

    const projects = [
      createMockProject('proj-1', 'Active Project', '#FF0000', false),
      createMockProject('proj-2', 'Archived Project', '#00FF00', true),
    ];

    const sessions = [
      createMockSession(
        'sess-1',
        'proj-1',
        new Date('2026-01-15T10:00:00'),
        new Date('2026-01-15T11:00:00')
      ),
      createMockSession(
        'sess-2',
        'proj-2',
        new Date('2026-01-15T14:00:00'),
        new Date('2026-01-15T15:00:00')
      ),
    ];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe('proj-1');
  });

  it('should exclude sessions outside the period', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');

    const projects = [createMockProject('proj-1', 'Project A', '#FF0000')];

    const sessions = [
      // Within period: 60 minutes
      createMockSession(
        'sess-1',
        'proj-1',
        new Date('2026-01-15T10:00:00'),
        new Date('2026-01-15T11:00:00')
      ),
      // Outside period (different day)
      createMockSession(
        'sess-2',
        'proj-1',
        new Date('2026-01-16T10:00:00'),
        new Date('2026-01-16T11:00:00')
      ),
    ];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].totalMinutes).toBe(60);
  });

  it('should return empty array when no sessions in period', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');
    const projects = [createMockProject('proj-1', 'Project A', '#FF0000')];
    const sessions: Session[] = [];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result).toHaveLength(0);
  });

  it('should handle sessions spanning multiple days', () => {
    // Arrange
    const periodStart = new Date('2026-01-15T00:00:00');
    const periodEnd = new Date('2026-01-15T23:59:59');

    const projects = [createMockProject('proj-1', 'Project A', '#FF0000')];

    // Session spanning from 23:00 to 01:00 next day (2 hours total)
    // Only the part within Jan 15 should be counted (1 hour: 23:00-00:00)
    const sessions = [
      createMockSession(
        'sess-1',
        'proj-1',
        new Date('2026-01-15T23:00:00'),
        new Date('2026-01-16T01:00:00')
      ),
    ];

    // Act
    const result = aggregateSessions(sessions, projects, periodStart, periodEnd);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].totalMinutes).toBe(60); // Only the Jan 15 portion
  });
});
