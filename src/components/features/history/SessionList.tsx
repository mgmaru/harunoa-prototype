'use client';

import { SessionCard } from './SessionCard';
import { Session } from '@/types/session';
import { Project } from '@/types/project';

type SessionListProps = {
  sessions: Session[];
  projects: Project[];
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
};

export const SessionList = ({
  sessions,
  projects,
  onEdit,
  onDelete,
}: SessionListProps) => {
  const getProject = (projectId: string): Project | undefined => {
    return projects.find((p) => p.id === projectId);
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        この日のセッションはありません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          project={getProject(session.projectId)}
          onEdit={() => onEdit(session)}
          onDelete={() => onDelete(session)}
        />
      ))}
    </div>
  );
};
