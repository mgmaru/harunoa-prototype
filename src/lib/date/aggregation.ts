import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Session } from '@/types/session';
import { Project } from '@/types/project';
import { splitSessionByDate } from '@/lib/date/session-split';

/**
 * プロジェクト別集計アイテム
 */
export type AggregateItem = {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalMinutes: number;
  percentage: number;
};

/**
 * 期間別集計結果
 */
export type PeriodAggregate = {
  label: string;
  startDate: Date;
  endDate: Date;
  items: AggregateItem[];
  totalMinutes: number;
};

/**
 * 期間タイプ
 */
export type PeriodType = 'day' | 'week' | 'month' | 'year';

/**
 * 期間タイプに応じた開始日・終了日を取得
 */
export const getPeriodRange = (
  type: PeriodType,
  date: Date
): { start: Date; end: Date } => {
  switch (type) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // 月曜始まり
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'year':
      return { start: startOfYear(date), end: endOfYear(date) };
  }
};

/**
 * 期間タイプに応じたラベルを取得
 */
export const getPeriodLabel = (type: PeriodType, date: Date): string => {
  switch (type) {
    case 'day':
      return format(date, 'yyyy年M月d日（E）', { locale: ja });
    case 'week': {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, 'M/d')}〜${format(end, 'M/d')}`;
    }
    case 'month':
      return format(date, 'yyyy年M月', { locale: ja });
    case 'year':
      return format(date, 'yyyy年', { locale: ja });
  }
};

/**
 * セッションをプロジェクト別に集計
 *
 * @param sessions 集計対象のセッション配列
 * @param projects プロジェクト一覧（アーカイブ済みを含む）
 * @param periodStart 集計期間の開始日
 * @param periodEnd 集計期間の終了日
 * @returns プロジェクト別の集計結果（作業時間の多い順）
 */
export const aggregateSessions = (
  sessions: Session[],
  projects: Project[],
  periodStart: Date,
  periodEnd: Date
): AggregateItem[] => {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const minutesByProject = new Map<string, number>();

  for (const session of sessions) {
    // アーカイブ済みプロジェクトは除外
    const project = projectMap.get(session.projectId);
    if (!project || project.isArchived) continue;

    // 日付跨ぎを按分
    const splits = splitSessionByDate(session.startAt, session.endAt);

    for (const split of splits) {
      // 期間内のみ集計
      if (split.date >= periodStart && split.date <= periodEnd) {
        // ミリ秒から分に変換
        const minutes = Math.floor(split.durationMs / 1000 / 60);
        const current = minutesByProject.get(session.projectId) || 0;
        minutesByProject.set(session.projectId, current + minutes);
      }
    }
  }

  const totalMinutes = Array.from(minutesByProject.values()).reduce(
    (a, b) => a + b,
    0
  );

  const items: AggregateItem[] = [];
  minutesByProject.forEach((minutes, projectId) => {
    const project = projectMap.get(projectId);
    if (!project) return;

    items.push({
      projectId,
      projectName: project.name,
      projectColor: project.color,
      totalMinutes: minutes,
      percentage: totalMinutes > 0 ? Math.floor((minutes / totalMinutes) * 100) : 0,
    });
  });

  // 時間の多い順にソート
  items.sort((a, b) => b.totalMinutes - a.totalMinutes);

  return items;
};
