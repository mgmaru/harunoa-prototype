'use client';

import { Project } from '@/types/project';
import { ProjectCard, ArchivedProjectCard } from './ProjectCard';

type ProjectListProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
};

export const ProjectList = ({
  projects,
  onEdit,
  onArchive,
}: ProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">プロジェクトがありません</p>
        <p className="text-sm">「+ 新規作成」ボタンからプロジェクトを作成してください</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={() => onEdit(project)}
          onArchive={() => onArchive(project)}
        />
      ))}
    </div>
  );
};

type ArchivedProjectListProps = {
  projects: Project[];
  onRestore: (projectId: string) => void;
  restoringId: string | null;
};

export const ArchivedProjectList = ({
  projects,
  onRestore,
  restoringId,
}: ArchivedProjectListProps) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">アーカイブ済みのプロジェクトはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ArchivedProjectCard
          key={project.id}
          project={project}
          onRestore={() => onRestore(project.id)}
          isRestoring={restoringId === project.id}
        />
      ))}
    </div>
  );
};
