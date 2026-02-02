'use client';

import { useState, useEffect, useMemo } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from './useAuth';
import { getSessionsByPeriod } from '@/services/sessions';
import { Project } from '@/types/project';

export type PeriodType = 'day' | 'week' | 'month';

export type ProjectStat = {
  totalTime: string;
  lastMeasuredAt: Date | null;
};

/**
 * 期間の開始日と終了日を取得
 */
const getPeriodRange = (period: PeriodType, date: Date): { start: Date; end: Date } => {
  switch (period) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
  }
};

/**
 * 分を「X時間Y分」または「X分」形式に変換
 */
const formatMinutes = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
  }
  return `${minutes}分`;
};

/**
 * プロジェクト別の統計情報（合計時間・最終計測日）を取得するフック
 */
export const useProjectStats = (
  projects: Project[],
  period: PeriodType
): { stats: Map<string, ProjectStat>; isLoading: boolean } => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Map<string, ProjectStat>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const periodRange = useMemo(() => getPeriodRange(period, new Date()), [period]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || projects.length === 0) {
        setStats(new Map());
        return;
      }

      setIsLoading(true);
      try {
        const sessions = await getSessionsByPeriod(
          user.uid,
          periodRange.start,
          periodRange.end
        );

        const newStats = new Map<string, ProjectStat>();

        for (const project of projects) {
          // このプロジェクトのセッションをフィルタ
          const projectSessions = sessions.filter((s) => s.projectId === project.id);

          // 合計時間を計算（ミリ秒から分へ）
          const totalMs = projectSessions.reduce((sum, s) => sum + s.durationMs, 0);
          const totalMinutes = Math.floor(totalMs / 1000 / 60);

          // 最終計測日（最新のセッションの開始日）
          const lastSession = projectSessions[0]; // startAt desc順

          newStats.set(project.id, {
            totalTime: formatMinutes(totalMinutes),
            lastMeasuredAt: lastSession?.startAt ?? null,
          });
        }

        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch project stats:', error);
        setStats(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, projects, periodRange]);

  return { stats, isLoading };
};
