/**
 * プロジェクトの型定義
 */
export type Project = {
  id: string;
  userId: string;
  name: string;
  color: string;
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * プロジェクト作成時の入力型
 */
export type CreateProjectInput = {
  name: string;
  color?: string;
};

/**
 * プロジェクト更新時の入力型
 */
export type UpdateProjectInput = Partial<CreateProjectInput>;
