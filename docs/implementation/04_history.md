# 履歴管理 実装指示書

対象画面：SCR-006（履歴）
関連ドキュメント：screen_specifications.md 6.6節

---

## 概要

セッション履歴の表示、編集、削除機能を実装する。
日付フィルタ、ページネーション、日付跨ぎの按分ロジックを含む。

---

## 前提条件

- `03_timer.md`が完了していること

---

## 実装手順

### 1. セッションAPI実装

`src/services/sessions.ts`:
```typescript
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
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Session, CreateSessionInput, UpdateSessionInput } from '@/types/session';

const sessionsRef = collection(db, 'sessions');

export async function createSession(
  userId: string,
  input: CreateSessionInput
): Promise<Session> {
  const durationMinutes = Math.round(
    (input.endAt.getTime() - input.startAt.getTime()) / 60000
  );

  const docRef = await addDoc(sessionsRef, {
    userId,
    projectId: input.projectId,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    durationMinutes,
    memo: input.memo || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId,
    projectId: input.projectId,
    startAt: input.startAt,
    endAt: input.endAt,
    durationMinutes,
    memo: input.memo || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getSessionsByDate(
  userId: string,
  date: Date,
  options?: { limit?: number; cursor?: string }
): Promise<{ sessions: Session[]; nextCursor?: string }> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  let q = query(
    sessionsRef,
    where('userId', '==', userId),
    where('startAt', '>=', Timestamp.fromDate(startOfDay)),
    where('startAt', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('startAt', 'desc'),
    limit(options?.limit || 50)
  );

  const snapshot = await getDocs(q);
  
  const sessions = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startAt: (doc.data().startAt as Timestamp).toDate(),
    endAt: (doc.data().endAt as Timestamp).toDate(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as Session[];

  return { sessions };
}

export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<void> {
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.startAt) updates.startAt = Timestamp.fromDate(input.startAt);
  if (input.endAt) updates.endAt = Timestamp.fromDate(input.endAt);
  if (input.memo !== undefined) updates.memo = input.memo;

  // durationMinutesを再計算
  if (input.startAt || input.endAt) {
    // 既存のデータを取得して計算する必要がある
  }

  await updateDoc(doc(db, 'sessions', id), updates);
}

export async function deleteSession(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sessions', id));
}

export async function getSessionsByPeriod(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Session[]> {
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    where('startAt', '>=', Timestamp.fromDate(startDate)),
    where('startAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startAt: (doc.data().startAt as Timestamp).toDate(),
    endAt: (doc.data().endAt as Timestamp).toDate(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as Session[];
}
```

### 2. 日付跨ぎ按分ロジック

`src/lib/date/session-split.ts`:
```typescript
import { startOfDay, endOfDay, differenceInMinutes, addDays } from 'date-fns';

interface SplitSession {
  date: Date;
  minutes: number;
}

export function splitSessionByDate(
  startAt: Date,
  endAt: Date
): SplitSession[] {
  const result: SplitSession[] = [];
  let current = startAt;

  while (current < endAt) {
    const dayEnd = endOfDay(current);
    const sessionEnd = dayEnd < endAt ? dayEnd : endAt;
    
    const minutes = differenceInMinutes(sessionEnd, current);
    
    if (minutes > 0) {
      result.push({
        date: startOfDay(current),
        minutes: Math.min(minutes, 24 * 60), // 1日最大24時間
      });
    }

    current = addDays(startOfDay(current), 1);
  }

  return result;
}

// 使用例:
// startAt: 2026-01-21 23:50
// endAt:   2026-01-22 00:10
// 結果: [
//   { date: 2026-01-21, minutes: 10 },
//   { date: 2026-01-22, minutes: 10 }
// ]
```

### 3. 履歴フック

`src/hooks/useSessions.ts`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getSessionsByDate,
  updateSession,
  deleteSession,
} from '@/services/sessions';
import { Session, UpdateSessionInput } from '@/types/session';

export function useSessions(date: Date) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { sessions } = await getSessionsByDate(user.uid, date);
      setSessions(sessions);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, date]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const update = async (id: string, input: UpdateSessionInput) => {
    await updateSession(id, input);
    await fetchSessions();
  };

  const remove = async (id: string) => {
    await deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    sessions,
    isLoading,
    error,
    update,
    remove,
    refresh: fetchSessions,
  };
}
```

### 4. 履歴画面

`src/app/(auth)/history/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useProjects } from '@/hooks/useProjects';
import { Header } from '@/components/layout/Header';
import { SessionList } from '@/components/features/history/SessionList';
import { SessionEditModal } from '@/components/features/history/SessionEditModal';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { sessions, isLoading, update, remove } = useSessions(selectedDate);
  const { projects } = useProjects();
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const quickDates = [
    { label: '今日', date: new Date() },
    { label: '昨日', date: subDays(new Date(), 1) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">履歴</h1>

        {/* 日付フィルタ */}
        <div className="flex gap-2 mb-6">
          {quickDates.map((q) => (
            <button
              key={q.label}
              onClick={() => setSelectedDate(q.date)}
              className={`px-4 py-2 rounded-lg ${
                format(selectedDate, 'yyyy-MM-dd') === format(q.date, 'yyyy-MM-dd')
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border'
              }`}
            >
              {q.label}
            </button>
          ))}
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border rounded-lg px-4 py-2"
          />
        </div>

        {/* 選択日表示 */}
        <p className="text-gray-600 mb-4">
          {format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })}
        </p>

        {/* セッション一覧 */}
        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            この日のセッションはありません
          </div>
        ) : (
          <SessionList
            sessions={sessions}
            projects={projects}
            onEdit={setEditingSession}
            onDelete={remove}
          />
        )}
      </main>

      {/* 編集モーダル */}
      {editingSession && (
        <SessionEditModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={async (input) => {
            await update(editingSession.id, input);
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
}
```

---

## バリデーション

| 条件 | エラーメッセージ |
|------|------------------|
| 開始時刻 > 終了時刻 | 「開始時刻は終了時刻より前にしてください」 |
| 終了時刻が未来 | 「終了時刻は現在時刻より後にできません」 |

---

## テスト観点

- [ ] 今日/昨日のセッションが表示される
- [ ] カレンダーで日付を選択できる
- [ ] セッション編集モーダルが開く
- [ ] 時刻を編集して保存できる
- [ ] 開始>終了でエラーが表示される
- [ ] セッション削除確認が表示される
- [ ] 削除後に一覧から消える

---

## 次のステップ

→ `05_analytics.md`（集計・グラフの実装）
