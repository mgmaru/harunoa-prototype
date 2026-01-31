# 集計・グラフ 実装指示書

対象画面：SCR-007（集計・グラフ）
関連ドキュメント：screen_specifications/05_analytics.md

---

## 概要

日/週/月/年の集計機能と、棒グラフ・円グラフによる可視化を実装する。

---

## 前提条件

- `04_history.md`が完了していること
- Chart.jsがインストールされていること

---

## 実装手順

### 1. 集計ユーティリティ

`src/lib/date/aggregation.ts`:
```typescript
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

export interface AggregateItem {
  projectId: string;
  projectName: string;
  projectColor: string;
  totalMinutes: number;
  percentage: number;
}

export interface PeriodAggregate {
  label: string;
  startDate: Date;
  endDate: Date;
  items: AggregateItem[];
  totalMinutes: number;
}

export type PeriodType = 'day' | 'week' | 'month' | 'year';

export function getPeriodRange(type: PeriodType, date: Date): { start: Date; end: Date } {
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
}

export function getPeriodLabel(type: PeriodType, date: Date): string {
  switch (type) {
    case 'day':
      return format(date, 'yyyy年M月d日（E）', { locale: ja });
    case 'week':
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, 'M/d')}〜${format(end, 'M/d')}`;
    case 'month':
      return format(date, 'yyyy年M月', { locale: ja });
    case 'year':
      return format(date, 'yyyy年', { locale: ja });
  }
}

export function aggregateSessions(
  sessions: Session[],
  projects: Project[],
  periodStart: Date,
  periodEnd: Date
): AggregateItem[] {
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
        const current = minutesByProject.get(session.projectId) || 0;
        minutesByProject.set(session.projectId, current + split.minutes);
      }
    }
  }

  const totalMinutes = Array.from(minutesByProject.values()).reduce((a, b) => a + b, 0);

  const items: AggregateItem[] = [];
  for (const [projectId, minutes] of minutesByProject) {
    const project = projectMap.get(projectId);
    if (!project) continue;

    items.push({
      projectId,
      projectName: project.name,
      projectColor: project.color,
      totalMinutes: minutes,
      percentage: totalMinutes > 0 ? Math.floor((minutes / totalMinutes) * 100) : 0,
    });
  }

  // 時間の多い順にソート
  items.sort((a, b) => b.totalMinutes - a.totalMinutes);

  return items;
}
```

### 2. 集計フック

`src/hooks/useAnalytics.ts`:
```typescript
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useProjects } from './useProjects';
import { getSessionsByPeriod } from '@/services/sessions';
import {
  aggregateSessions,
  getPeriodRange,
  getPeriodLabel,
  PeriodType,
  AggregateItem,
} from '@/lib/date/aggregation';
import { addDays, addWeeks, addMonths, addYears, subDays, subWeeks, subMonths, subYears } from 'date-fns';

export function useAnalytics() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<AggregateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const period = useMemo(() => getPeriodRange(periodType, currentDate), [periodType, currentDate]);
  const label = useMemo(() => getPeriodLabel(periodType, currentDate), [periodType, currentDate]);
  const totalMinutes = useMemo(() => items.reduce((a, b) => a + b.totalMinutes, 0), [items]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const sessions = await getSessionsByPeriod(user.uid, period.start, period.end);
      const aggregated = aggregateSessions(sessions, projects, period.start, period.end);
      setItems(aggregated);
    } finally {
      setIsLoading(false);
    }
  }, [user, period, projects]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPrevious = () => {
    setCurrentDate((d) => {
      switch (periodType) {
        case 'day': return subDays(d, 1);
        case 'week': return subWeeks(d, 1);
        case 'month': return subMonths(d, 1);
        case 'year': return subYears(d, 1);
      }
    });
  };

  const goToNext = () => {
    setCurrentDate((d) => {
      switch (periodType) {
        case 'day': return addDays(d, 1);
        case 'week': return addWeeks(d, 1);
        case 'month': return addMonths(d, 1);
        case 'year': return addYears(d, 1);
      }
    });
  };

  return {
    periodType,
    setPeriodType,
    label,
    items,
    totalMinutes,
    isLoading,
    goToPrevious,
    goToNext,
  };
}
```

### 3. グラフコンポーネント

`src/components/features/analytics/BarChart.tsx`:
```typescript
'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { AggregateItem } from '@/lib/date/aggregation';
import { formatDuration } from '@/lib/date/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

interface Props {
  items: AggregateItem[];
}

export function BarChart({ items }: Props) {
  const data = {
    labels: items.map((i) => i.projectName),
    datasets: [
      {
        data: items.map((i) => i.totalMinutes),
        backgroundColor: items.map((i) => i.projectColor),
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => formatDuration(context.raw),
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: number) => formatDuration(value),
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
```

`src/components/features/analytics/PieChart.tsx`:
```typescript
'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AggregateItem } from '@/lib/date/aggregation';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  items: AggregateItem[];
}

export function PieChart({ items }: Props) {
  const data = {
    labels: items.map((i) => `${i.projectName} (${i.percentage}%)`),
    datasets: [
      {
        data: items.map((i) => i.totalMinutes),
        backgroundColor: items.map((i) => i.projectColor),
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return <Pie data={data} options={options} />;
}
```

### 4. 集計画面

`src/app/(auth)/analytics/page.tsx`:
```typescript
'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Header } from '@/components/layout/Header';
import { BarChart } from '@/components/features/analytics/BarChart';
import { PieChart } from '@/components/features/analytics/PieChart';
import { formatDuration } from '@/lib/date/format';

export default function AnalyticsPage() {
  const {
    periodType,
    setPeriodType,
    label,
    items,
    totalMinutes,
    isLoading,
    goToPrevious,
    goToNext,
  } = useAnalytics();

  const periods = [
    { value: 'day', label: '日' },
    { value: 'week', label: '週' },
    { value: 'month', label: '月' },
    { value: 'year', label: '年' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">集計・グラフ</h1>

        {/* 期間選択 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-2">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodType(p.value)}
                className={`px-4 py-2 rounded-lg ${
                  periodType === p.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goToPrevious} className="px-3 py-2 border rounded">
              ＜
            </button>
            <span className="min-w-[150px] text-center">{label}</span>
            <button onClick={goToNext} className="px-3 py-2 border rounded">
              ＞
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            この期間のデータはありません
          </div>
        ) : (
          <>
            {/* 棒グラフ */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">プロジェクト別 作業時間</h2>
              <BarChart items={items} />
              <p className="mt-4 text-right text-gray-600">
                合計: {formatDuration(totalMinutes)}
              </p>
            </div>

            {/* 円グラフ */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">プロジェクト割合</h2>
              <div className="max-w-sm mx-auto">
                <PieChart items={items} />
              </div>
            </div>

            {/* 表 */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">合計時間（表）</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">プロジェクト</th>
                    <th className="text-right py-2">合計時間</th>
                    <th className="text-right py-2">割合</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.projectId} className="border-b">
                      <td className="py-2 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.projectColor }}
                        />
                        {item.projectName}
                      </td>
                      <td className="text-right py-2">
                        {formatDuration(item.totalMinutes)}
                      </td>
                      <td className="text-right py-2">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2">合計</td>
                    <td className="text-right py-2">{formatDuration(totalMinutes)}</td>
                    <td className="text-right py-2">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

---

## 表示仕様

| 項目 | 仕様 |
|------|------|
| 週の開始 | 月曜日 |
| 時間表示形式 | Xh Ym（例：5h 30m） |
| 割合表示 | 小数点以下切り捨て |
| アーカイブ済みプロジェクト | 集計に含めない |
| アーカイブ済みセッション | 集計に含めない（1年以上経過で自動アーカイブ） |

---

## 次のステップ

→ `06_settings.md`（設定の実装）
