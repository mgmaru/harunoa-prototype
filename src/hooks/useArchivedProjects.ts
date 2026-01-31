'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getArchivedProjects, restoreProject } from '@/services/projects';
import { Project } from '@/types/project';

export const useArchivedProjects = () => {
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
      const data = await getArchivedProjects(user.uid);
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch archived projects:', e);
      setError(
        e instanceof Error ? e : new Error('アーカイブの取得に失敗しました')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const restore = useCallback(async (projectId: string): Promise<void> => {
    await restoreProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  return {
    projects,
    isLoading,
    error,
    restore,
    refresh: fetchProjects,
  };
};
