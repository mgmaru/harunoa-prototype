import { format } from 'date-fns';
import { Project } from '@/types/project';
import { Session } from '@/types/session';

/**
 * プロジェクトデータをCSV形式に変換
 */
export const exportProjectsToCSV = (projects: Project[]): string => {
  const headers = ['ID', 'プロジェクト名', '色', 'アーカイブ済み', '作成日'];
  const rows = projects.map((p) => [
    escapeCSVField(p.id),
    escapeCSVField(p.name),
    escapeCSVField(p.color),
    p.isArchived ? 'はい' : 'いいえ',
    format(p.createdAt, 'yyyy-MM-dd HH:mm:ss'),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

/**
 * セッションデータをCSV形式に変換
 */
export const exportSessionsToCSV = (
  sessions: Session[],
  projectMap: Map<string, string>
): string => {
  const headers = [
    'ID',
    'プロジェクト名',
    '開始時刻',
    '終了時刻',
    '計測時間(分)',
    'メモ',
    'アーカイブ済み',
    'アーカイブ日時',
  ];
  const rows = sessions.map((s) => [
    escapeCSVField(s.id),
    escapeCSVField(projectMap.get(s.projectId) ?? 'Unknown'),
    format(s.startAt, 'yyyy-MM-dd HH:mm:ss'),
    format(s.endAt, 'yyyy-MM-dd HH:mm:ss'),
    String(Math.round(s.durationMs / 60000)),
    escapeCSVField(s.memo),
    s.isArchived ? 'はい' : 'いいえ',
    s.archivedAt ? format(s.archivedAt, 'yyyy-MM-dd HH:mm:ss') : '',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
};

/**
 * CSVフィールドをエスケープ
 * カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
 */
const escapeCSVField = (field: string): string => {
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

/**
 * CSVファイルをダウンロード
 */
export const downloadCSV = (content: string, filename: string): void => {
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * プロジェクトMapを作成（projectId -> projectName）
 */
export const createProjectMap = (projects: Project[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const project of projects) {
    map.set(project.id, project.name);
  }
  return map;
};
