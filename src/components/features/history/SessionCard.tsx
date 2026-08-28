'use client';

import { format } from 'date-fns';
import { ColorDot } from '@/components/ui/ColorPicker';
import { Button } from '@/components/ui/Button';
import { formatSessionDuration } from '@/lib/date/format';
import { Session } from '@/types/session';
import { Project } from '@/types/project';

type SessionCardProps = {
  session: Session;
  project: Project | undefined;
  onEdit: () => void;
  onDelete: () => void;
};

export const SessionCard = ({
  session,
  project,
  onEdit,
  onDelete,
}: SessionCardProps) => {
  const projectColor = project?.color ?? '#6B7280';
  const projectName = project?.name ?? '不明なプロジェクト';

  const startTime = format(session.startAt, 'HH:mm');
  const endTime = format(session.endAt, 'HH:mm');
  const duration = formatSessionDuration(
    session.startAt,
    session.endAt,
    session.durationMs
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <ColorDot color={projectColor} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{projectName}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {startTime} - {endTime}（{duration}）
          </p>
          <p className="mt-1 text-sm text-gray-500">
            メモ: {session.memo || '-'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          編集
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          削除
        </Button>
      </div>
    </div>
  );
};
