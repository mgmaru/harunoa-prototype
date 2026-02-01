import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';
import { db } from '@/lib/firebase/config';
import { Session, CreateSessionInput, UpdateSessionInput } from '@/types/session';

/**
 * Firestoreに保存されるセッションドキュメントの型
 */
type SessionDocument = {
  userId: string;
  projectId: string;
  startAt: Timestamp;
  endAt: Timestamp;
  durationMs: number;
  memo: string;
  isArchived: boolean;
  archivedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const SESSIONS_COLLECTION = 'sessions';
const MAX_SESSIONS_LIMIT = 100;

/**
 * Firestore DocumentからSession型に変換
 */
const toSession = (id: string, data: SessionDocument): Session => ({
  id,
  userId: data.userId,
  projectId: data.projectId,
  startAt: data.startAt.toDate(),
  endAt: data.endAt.toDate(),
  durationMs: data.durationMs,
  memo: data.memo,
  isArchived: data.isArchived ?? false,
  archivedAt: data.archivedAt?.toDate() ?? null,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
});

/**
 * セッションを作成
 */
export const createSession = async (
  userId: string,
  input: CreateSessionInput
): Promise<Session> => {
  const docData = {
    userId,
    projectId: input.projectId,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    durationMs: input.durationMs,
    memo: input.memo,
    isArchived: false,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), docData);

  const now = new Date();
  return {
    id: docRef.id,
    userId,
    projectId: input.projectId,
    startAt: input.startAt,
    endAt: input.endAt,
    durationMs: input.durationMs,
    memo: input.memo,
    isArchived: false,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * ユーザーのセッション一覧を取得（新しい順）
 */
export const getSessions = async (userId: string): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('startAt', 'desc'),
    limit(MAX_SESSIONS_LIMIT)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * 特定プロジェクトのセッション一覧を取得
 */
export const getSessionsByProject = async (
  userId: string,
  projectId: string
): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('projectId', '==', projectId),
    orderBy('startAt', 'desc'),
    limit(MAX_SESSIONS_LIMIT)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * セッションを更新
 */
export const updateSession = async (
  sessionId: string,
  input: UpdateSessionInput
): Promise<void> => {
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.startAt !== undefined) {
    updateData.startAt = Timestamp.fromDate(input.startAt);
  }
  if (input.endAt !== undefined) {
    updateData.endAt = Timestamp.fromDate(input.endAt);
  }
  if (input.durationMs !== undefined) {
    updateData.durationMs = input.durationMs;
  }
  if (input.memo !== undefined) {
    updateData.memo = input.memo;
  }

  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionId), updateData);
};

/**
 * セッションを削除
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
};

/**
 * 特定の日付のセッション一覧を取得
 *
 * その日に開始されたセッションを取得する（日付跨ぎのセッションは開始日で取得）
 */
export const getSessionsByDate = async (
  userId: string,
  date: Date,
  options?: { limit?: number }
): Promise<Session[]> => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('startAt', '>=', Timestamp.fromDate(dayStart)),
    where('startAt', '<=', Timestamp.fromDate(dayEnd)),
    orderBy('startAt', 'desc'),
    limit(options?.limit ?? MAX_SESSIONS_LIMIT)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * 期間内のセッション一覧を取得
 */
export const getSessionsByPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('startAt', '>=', Timestamp.fromDate(startDate)),
    where('startAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * セッションを1件取得
 */
export const getSession = async (sessionId: string): Promise<Session | null> => {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return toSession(snapshot.id, snapshot.data() as SessionDocument);
};

/**
 * アーカイブ済みセッション一覧を取得（新しい順）
 */
export const getArchivedSessions = async (userId: string): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) =>
    toSession(docSnap.id, docSnap.data() as SessionDocument)
  );
};

/**
 * 全セッション一覧を取得（CSVエクスポート用、アーカイブ含む）
 */
export const getAllSessions = async (userId: string): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) =>
    toSession(docSnap.id, docSnap.data() as SessionDocument)
  );
};
