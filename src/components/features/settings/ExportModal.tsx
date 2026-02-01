'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getProjects } from '@/services/projects';
import { getAllSessions, getArchivedSessions } from '@/services/sessions';
import {
  exportProjectsToCSV,
  exportSessionsToCSV,
  downloadCSV,
  createProjectMap,
} from '@/lib/csv/export';

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ExportOption = 'projects' | 'sessions' | 'archivedSessions';

export const ExportModal = ({ isOpen, onClose }: ExportModalProps) => {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<Set<ExportOption>>(
    () => new Set<ExportOption>(['projects', 'sessions'])
  );
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionToggle = (option: ExportOption) => {
    setSelectedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const handleExport = async () => {
    if (!user) return;
    if (selectedOptions.size === 0) {
      setError('エクスポートするデータを選択してください');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const dateStr = format(new Date(), 'yyyyMMdd');

      if (selectedOptions.has('projects')) {
        const projects = await getProjects(user.uid);
        const csv = exportProjectsToCSV(projects);
        downloadCSV(csv, `harunoa_projects_${dateStr}.csv`);
      }

      if (selectedOptions.has('sessions') || selectedOptions.has('archivedSessions')) {
        const projects = await getProjects(user.uid);
        const projectMap = createProjectMap(projects);

        if (selectedOptions.has('sessions') && !selectedOptions.has('archivedSessions')) {
          const sessions = await getAllSessions(user.uid);
          const activeSessions = sessions.filter((s) => !s.isArchived);
          const csv = exportSessionsToCSV(activeSessions, projectMap);
          downloadCSV(csv, `harunoa_sessions_${dateStr}.csv`);
        } else if (!selectedOptions.has('sessions') && selectedOptions.has('archivedSessions')) {
          const sessions = await getArchivedSessions(user.uid);
          const csv = exportSessionsToCSV(sessions, projectMap);
          downloadCSV(csv, `harunoa_archived_sessions_${dateStr}.csv`);
        } else {
          const sessions = await getAllSessions(user.uid);
          const csv = exportSessionsToCSV(sessions, projectMap);
          downloadCSV(csv, `harunoa_all_sessions_${dateStr}.csv`);
        }
      }

      onClose();
    } catch (e) {
      console.error('Export failed:', e);
      setError('エクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CSVエクスポート">
      <div className="space-y-4">
        <p className="text-gray-600">エクスポートするデータを選択</p>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOptions.has('projects')}
              onChange={() => handleOptionToggle('projects')}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span>プロジェクト</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOptions.has('sessions')}
              onChange={() => handleOptionToggle('sessions')}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span>セッション履歴</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOptions.has('archivedSessions')}
              onChange={() => handleOptionToggle('archivedSessions')}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span>アーカイブ済みセッション</span>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose} disabled={isExporting}>
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || selectedOptions.size === 0}
            isLoading={isExporting}
          >
            エクスポート
          </Button>
        </div>
      </div>
    </Modal>
  );
};
