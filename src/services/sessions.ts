import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
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
