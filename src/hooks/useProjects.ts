'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getProjects,
  createProject,
  updateProject,
  archiveProject,
} from '@/services/projects';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getProjects(user.uid);
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects:', e);
      setError(e instanceof Error ? e : new Error('プロジェクトの取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const create = useCallback(
    async (input: CreateProjectInput): Promise<Project> => {
      if (!user) {
        throw new Error('認証が必要です');
      }

      const project = await createProject(user.uid, input);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [user]
  );

  const update = useCallback(
    async (projectId: string, input: UpdateProjectInput): Promise<void> => {
      await updateProject(projectId, input);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, ...input, updatedAt: new Date() }
            : p
        )
      );
    },
    []
  );

  const archive = useCallback(async (projectId: string): Promise<void> => {
    await archiveProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  return {
    projects,
    isLoading,
    error,
    create,
    update,
    archive,
    refresh: fetchProjects,
  };
};
