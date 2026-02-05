'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { ColorDot } from '@/components/ui/ColorPicker';
import { Button } from '@/components/ui/Button';
import { Project } from '@/types/project';
import { formatDate } from '@/lib/date/format';

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

type ProjectCardProps = {
  project: Project;
  totalTime?: string;
  lastMeasuredAt?: Date | null;
  onEdit: () => void;
  onArchive: () => void;
};

export const ProjectCard = ({
  project,
  totalTime = '0分',
  lastMeasuredAt,
  onEdit,
  onArchive,
}: ProjectCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <ColorDot color={project.color} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
          <div className="mt-1 text-sm text-gray-500 space-y-0.5">
            <p>合計: {totalTime}</p>
            <p>
              最終計測:{' '}
              {lastMeasuredAt ? formatDate(lastMeasuredAt) : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          編集
        </Button>
        <Button variant="ghost" size="sm" onClick={onArchive}>
          アーカイブ
        </Button>
        <Link
          href={`/timer?projectId=${project.id}`}
          className={clsx(
            'ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium min-h-[44px]',
            'bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
          )}
        >
          <span>計測開始</span>
          <PlayIcon />
        </Link>
      </div>
    </div>
  );
};

type ArchivedProjectCardProps = {
  project: Project;
  onRestore: () => void;
  isRestoring?: boolean;
};

export const ArchivedProjectCard = ({
  project,
  onRestore,
  isRestoring = false,
}: ArchivedProjectCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <ColorDot color={project.color} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
          <p className="mt-1 text-sm text-gray-500">
            アーカイブ日:{' '}
            {project.archivedAt ? formatDate(project.archivedAt) : '-'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRestore}
          isLoading={isRestoring}
        >
          復帰
        </Button>
      </div>
    </div>
  );
};
