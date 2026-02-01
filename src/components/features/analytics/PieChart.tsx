'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AggregateItem } from '@/lib/date/aggregation';
import { formatDuration } from '@/lib/date/format';

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = {
  items: AggregateItem[];
};

export const PieChart = ({ items }: Props) => {
  const data = {
    labels: items.map((i) => `${i.projectName} (${i.percentage}%)`),
    datasets: [
      {
        data: items.map((i) => i.totalMinutes),
        backgroundColor: items.map((i) => i.projectColor),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown; label: string }) => {
            const value = context.raw as number;
            return `${context.label}: ${formatDuration(value)}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-[250px] md:h-[300px]">
      <Pie data={data} options={options} />
    </div>
  );
};
