/**
 * セッション（作業記録）の型定義
 */
export type Session = {
  id: string;
  userId: string;
  projectId: string;
  startAt: Date;
  endAt: Date;
  durationMs: number; // 実作業時間（一時停止時間を除く）
  memo: string;
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * セッション作成時の入力型
 */
export type CreateSessionInput = {
  projectId: string;
  startAt: Date;
  endAt: Date;
  durationMs: number;
  memo: string;
};

/**
 * セッション更新時の入力型
 */
export type UpdateSessionInput = Partial<{
  startAt: Date;
  endAt: Date;
  durationMs: number;
  memo: string;
}>;
