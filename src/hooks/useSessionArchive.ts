'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { archiveOldSessions } from '@/services/sessions';

type ArchiveResult = {
  archivedCount: number;
  archivedAt: Date;
};

export function useSessionArchive() {
  const { user } = useAuth();
  const [isArchiving, setIsArchiving] = useState(false);
  const [lastArchiveResult, setLastArchiveResult] =
    useState<ArchiveResult | null>(null);

  const runArchive = useCallback(async () => {
    if (!user || isArchiving) return;

    setIsArchiving(true);
    try {
      const result = await archiveOldSessions(user.uid);
      setLastArchiveResult({
        archivedCount: result.archivedCount,
        archivedAt: new Date(),
      });
      return result;
    } finally {
      setIsArchiving(false);
    }
  }, [user, isArchiving]);

  return {
    runArchive,
    isArchiving,
    lastArchiveResult,
  };
}
