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

type Props = {
  items: AggregateItem[];
};

export const BarChart = ({ items }: Props) => {
  const data = {
    labels: items.map((i) => i.projectName),
    datasets: [
      {
        data: items.map((i) => i.totalMinutes),
        backgroundColor: items.map((i) => i.projectColor),
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { raw: unknown }) => {
            const value = context.raw as number;
            return formatDuration(value);
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: string | number) => {
            const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
            return formatDuration(numValue);
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-[200px] md:h-[300px]">
      <Bar data={data} options={options} />
    </div>
  );
};
