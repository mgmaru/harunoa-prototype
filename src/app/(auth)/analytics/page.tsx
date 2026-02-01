'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { Header, TabBar } from '@/components/layout/Header';
import { BarChart, PieChart } from '@/components/features/analytics';
import { formatDuration } from '@/lib/date/format';
import { PeriodType } from '@/lib/date/aggregation';
import clsx from 'clsx';

const PERIODS: { value: PeriodType; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '週' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
];

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
    goToToday,
  } = useAnalytics();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">集計・グラフ</h1>

        {/* 期間選択 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {/* 期間タイプ切替 */}
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodType(p.value)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  periodType === p.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* 期間ナビゲーション */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevious}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="前の期間へ"
            >
              ＜
            </button>
            <span className="min-w-[140px] text-center font-medium">{label}</span>
            <button
              onClick={goToNext}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="次の期間へ"
            >
              ＞
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              今日
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            この期間のデータはありません
          </div>
        ) : (
          <>
            {/* グラフセクション - PC: 横並び, スマホ: 縦並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 棒グラフ */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  プロジェクト別 作業時間
                </h2>
                <BarChart items={items} />
                <p className="mt-4 text-right text-gray-600">
                  合計: {formatDuration(totalMinutes)}
                </p>
              </div>

              {/* 円グラフ */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">プロジェクト割合</h2>
                <PieChart items={items} />
              </div>
            </div>

            {/* 合計時間表 */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">合計時間（表）</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-600">
                        プロジェクト
                      </th>
                      <th className="text-right py-3 font-medium text-gray-600">
                        合計時間
                      </th>
                      <th className="text-right py-3 font-medium text-gray-600 hidden sm:table-cell">
                        割合
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.projectId}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.projectColor }}
                            />
                            <span className="truncate">{item.projectName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3">
                          {formatDuration(item.totalMinutes)}
                        </td>
                        <td className="text-right py-3 text-gray-500 hidden sm:table-cell">
                          {item.percentage}%
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-3">合計</td>
                      <td className="text-right py-3">
                        {formatDuration(totalMinutes)}
                      </td>
                      <td className="text-right py-3 hidden sm:table-cell">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <TabBar />
    </div>
  );
}
