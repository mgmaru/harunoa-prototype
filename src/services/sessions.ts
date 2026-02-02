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
  writeBatch,
} from 'firebase/firestore';
import { startOfDay, endOfDay, subYears, subDays } from 'date-fns';
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
/** ページネーション: 1ページあたりの件数 */
const PAGE_SIZE = 50;

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
 * ユーザーのセッション一覧を取得（新しい順、アーカイブ済みを除外）
 */
export const getSessions = async (userId: string): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('startAt', 'desc'),
    limit(MAX_SESSIONS_LIMIT)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * 特定プロジェクトのセッション一覧を取得（アーカイブ済みを除外）
 */
export const getSessionsByProject = async (
  userId: string,
  projectId: string
): Promise<Session[]> => {
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('projectId', '==', projectId),
    where('isArchived', '==', false),
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
 * ページネーション付きセッション取得の結果
 */
type PaginatedSessionsResult = {
  /** セッション一覧 */
  sessions: Session[];
  /** 総件数 */
  totalCount: number;
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 次のページがあるか */
  hasNextPage: boolean;
  /** 前のページがあるか */
  hasPrevPage: boolean;
};

/**
 * 特定の日付のセッション一覧を取得（アーカイブ済みを除外）
 *
 * その日に開始されたセッションを取得する（日付跨ぎのセッションは開始日で取得）
 * projectIdを指定すると、そのプロジェクトのセッションのみを取得
 * pageを指定すると、ページネーションを適用（1ページ50件）
 */
export const getSessionsByDate = async (
  userId: string,
  date: Date,
  options?: { limit?: number; projectId?: string; page?: number }
): Promise<Session[]> => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // プロジェクトIDが指定されている場合は、そのプロジェクトのみフィルタ
  const baseConstraints = [
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('startAt', '>=', Timestamp.fromDate(dayStart)),
    where('startAt', '<=', Timestamp.fromDate(dayEnd)),
  ];

  if (options?.projectId) {
    baseConstraints.push(where('projectId', '==', options.projectId));
  }

  const q = query(
    collection(db, SESSIONS_COLLECTION),
    ...baseConstraints,
    orderBy('startAt', 'desc'),
    limit(options?.limit ?? MAX_SESSIONS_LIMIT)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );
};

/**
 * 特定の日付のセッション一覧をページネーション付きで取得（アーカイブ済みを除外）
 *
 * 日付フィルタがあるため全件取得し、クライアント側でページネーションを適用
 * （1日あたりのセッション数は限定的なため、この方式を採用）
 *
 * @param userId ユーザーID
 * @param date 取得する日付
 * @param page ページ番号（1始まり）
 * @param options オプション（projectIdでプロジェクトフィルタ）
 * @returns ページネーション付きセッション結果
 */
export const getSessionsByDatePaginated = async (
  userId: string,
  date: Date,
  page: number = 1,
  options?: { projectId?: string }
): Promise<PaginatedSessionsResult> => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // 日付フィルタがあるため、その日の全セッションを取得
  // （1日あたり数百件を超えることは稀なため全件取得が効率的）
  const baseConstraints = [
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('startAt', '>=', Timestamp.fromDate(dayStart)),
    where('startAt', '<=', Timestamp.fromDate(dayEnd)),
  ];

  if (options?.projectId) {
    baseConstraints.push(where('projectId', '==', options.projectId));
  }

  const q = query(
    collection(db, SESSIONS_COLLECTION),
    ...baseConstraints,
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const allSessions = snapshot.docs.map((doc) =>
    toSession(doc.id, doc.data() as SessionDocument)
  );

  const totalCount = allSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  // ページネーション適用
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const sessions = allSessions.slice(startIndex, endIndex);

  return {
    sessions,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * 期間内のセッション一覧を取得（アーカイブ済みを除外）
 *
 * 日付跨ぎ・複数日跨ぎセッションを正しく取得するため、以下の3つのクエリを実行してマージする：
 * 1. startAt が期間内のセッション
 * 2. endAt が期間内のセッション（startAt が期間より前）
 * 3. 期間を完全に跨ぐセッション（startAt < periodStart かつ endAt > periodEnd）
 */
export const getSessionsByPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Session[]> => {
  // クエリ1: startAt が期間内のセッション
  const qByStart = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('startAt', '>=', Timestamp.fromDate(startDate)),
    where('startAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('startAt', 'desc')
  );

  // クエリ2: endAt が期間内のセッション（日付跨ぎ対応）
  // ソート順はasc（既存インデックスに合わせる。マージ後に再ソートするため順序は問わない）
  const qByEnd = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('endAt', '>=', Timestamp.fromDate(startDate)),
    where('endAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('endAt', 'asc')
  );

  // クエリ3: 期間を完全に跨ぐセッション（複数日跨ぎ対応）
  // Firestoreの制約（2フィールドに対する範囲クエリ不可）を回避するため、
  // startAt が期間開始日の30日前〜期間開始日より前のセッションを取得し、
  // クライアント側で endAt > periodEnd をフィルタ
  const thirtyDaysBeforeStart = subDays(startDate, 30);
  const qSpanning = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('startAt', '>=', Timestamp.fromDate(thirtyDaysBeforeStart)),
    where('startAt', '<', Timestamp.fromDate(startDate)),
    orderBy('startAt', 'desc')
  );

  // 3つのクエリを並列実行
  const [snapshotByStart, snapshotByEnd, snapshotSpanning] = await Promise.all([
    getDocs(qByStart),
    getDocs(qByEnd),
    getDocs(qSpanning),
  ]);

  // 結果をマージ（重複を除去）
  const sessionMap = new Map<string, Session>();

  for (const doc of snapshotByStart.docs) {
    const session = toSession(doc.id, doc.data() as SessionDocument);
    sessionMap.set(doc.id, session);
  }

  for (const doc of snapshotByEnd.docs) {
    if (!sessionMap.has(doc.id)) {
      const session = toSession(doc.id, doc.data() as SessionDocument);
      sessionMap.set(doc.id, session);
    }
  }

  // 期間を完全に跨ぐセッションのみ追加（endAt > periodEnd）
  for (const doc of snapshotSpanning.docs) {
    if (!sessionMap.has(doc.id)) {
      const session = toSession(doc.id, doc.data() as SessionDocument);
      // endAt が期間終了より後のもののみ追加（期間を完全に跨ぐ）
      if (session.endAt > endDate) {
        sessionMap.set(doc.id, session);
      }
    }
  }

  // startAt の降順でソート
  const sessions = Array.from(sessionMap.values());
  sessions.sort((a, b) => b.startAt.getTime() - a.startAt.getTime());

  return sessions;
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

/**
 * 1年以上経過したセッションをアーカイブする
 * @param userId ユーザーID
 * @returns アーカイブした件数
 */
export const archiveOldSessions = async (
  userId: string
): Promise<{ archivedCount: number }> => {
  const oneYearAgo = subYears(new Date(), 1);

  // 1年以上前に終了した、未アーカイブのセッションを取得
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    where('endAt', '<=', Timestamp.fromDate(oneYearAgo))
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { archivedCount: 0 };
  }

  // バッチ更新（Firestoreは1バッチ500件まで）
  const batchSize = 500;
  let archivedCount = 0;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(i, i + batchSize);

    for (const docSnap of chunk) {
      batch.update(docSnap.ref, {
        isArchived: true,
        archivedAt: Timestamp.now(),
      });
    }

    await batch.commit();
    archivedCount += chunk.length;
  }

  return { archivedCount };
};
