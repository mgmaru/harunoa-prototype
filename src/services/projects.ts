import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Project, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import { PROJECT_COLORS } from '@/constants/colors';

/**
 * Firestoreに保存されるプロジェクトドキュメントの型
 */
type ProjectDocument = {
  userId: string;
  name: string;
  color: string;
  isArchived: boolean;
  archivedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const PROJECTS_COLLECTION = 'projects';
const MAX_PROJECTS_LIMIT = 100;

/**
 * Firestore DocumentからProject型に変換
 */
const toProject = (id: string, data: ProjectDocument): Project => ({
  id,
  userId: data.userId,
  name: data.name,
  color: data.color,
  isArchived: data.isArchived,
  archivedAt: data.archivedAt?.toDate() ?? null,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
});

/**
 * アクティブなプロジェクト一覧を取得
 */
export const getProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(MAX_PROJECTS_LIMIT)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toProject(doc.id, doc.data() as ProjectDocument)
  );
};

/**
 * 次の自動割当色を取得
 * 未使用の色があれば優先、すべて使用済みなら最も使用数が少ない色を返す
 *
 * 集計対象はアクティブなプロジェクトのみ。
 * アーカイブ済みプロジェクトの色は再利用可能として扱う。
 */
const getNextAutoColor = async (userId: string): Promise<string> => {
  const activeProjects = await getProjects(userId);

  const usageCounts = new Map<string, number>(
    PROJECT_COLORS.map((color) => [color, 0])
  );
  for (const project of activeProjects) {
    const count = usageCounts.get(project.color);
    // パレット外の色（過去の定義など）は集計対象外
    if (count !== undefined) {
      usageCounts.set(project.color, count + 1);
    }
  }

  let leastUsedColor: string = PROJECT_COLORS[0];
  let leastUsedCount = Number.POSITIVE_INFINITY;

  for (const color of PROJECT_COLORS) {
    const count = usageCounts.get(color) ?? 0;
    if (count === 0) {
      return color;
    }
    if (count < leastUsedCount) {
      leastUsedCount = count;
      leastUsedColor = color;
    }
  }

  return leastUsedColor;
};

/**
 * プロジェクトを作成
 */
export const createProject = async (
  userId: string,
  input: CreateProjectInput
): Promise<Project> => {
  const color = input.color ?? (await getNextAutoColor(userId));

  const docData = {
    userId,
    name: input.name,
    color,
    isArchived: false,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), docData);

  const now = new Date();
  return {
    id: docRef.id,
    userId,
    name: input.name,
    color,
    isArchived: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * プロジェクトを更新
 */
export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput
): Promise<void> => {
  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), updateData);
};

/**
 * プロジェクトをアーカイブ
 */
export const archiveProject = async (projectId: string): Promise<void> => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    isArchived: true,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * プロジェクトをアーカイブから復帰
 */
export const restoreProject = async (projectId: string): Promise<void> => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * アーカイブ済みプロジェクト一覧を取得
 */
export const getArchivedProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('archivedAt', 'desc'),
    limit(MAX_PROJECTS_LIMIT)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toProject(doc.id, doc.data() as ProjectDocument)
  );
};
