# セッション自動アーカイブ 実装指示書

関連ドキュメント：requirements.md 5.8.1節、02_data-model.md

---

## 概要

1年以上経過したセッションを自動的にアーカイブし、通常の集計・グラフから除外する機能を実装する。
アーカイブされたデータはCSVエクスポートで取得可能。

---

## 前提条件

- `04_history.md`が完了していること
- `06_settings.md`が完了していること

---

## 基本仕様

### アーカイブの定義

| 項目 | 仕様 |
|------|------|
| 対象 | `endAt`（終了時刻）から1年以上経過したセッション |
| 実行タイミング | クライアントサイドで実行（ログイン時、集計画面表示時） |
| 影響 | 集計・グラフには含まれない、CSVエクスポートでは取得可能 |

### Session型の拡張（02_data-model.mdで定義済み）

```typescript
interface Session {
  // ... 既存フィールド
  isArchived: boolean;      // アーカイブ済みフラグ
  archivedAt: Date | null;  // アーカイブ日時
}
```

---

## 実装手順

### 1. アーカイブ実行API

`src/services/sessions.ts`に追加:
```typescript
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { subYears } from 'date-fns';

/**
 * 1年以上経過したセッションをアーカイブする
 * @param userId ユーザーID
 * @returns アーカイブした件数
 */
export async function archiveOldSessions(
  userId: string
): Promise<{ archivedCount: number }> {
  const oneYearAgo = subYears(new Date(), 1);

  // 1年以上前に終了した、未アーカイブのセッションを取得
  const q = query(
    collection(db, 'sessions'),
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

    for (const doc of chunk) {
      batch.update(doc.ref, {
        isArchived: true,
        archivedAt: Timestamp.now(),
      });
    }

    await batch.commit();
    archivedCount += chunk.length;
  }

  return { archivedCount };
}
```

### 2. アーカイブ実行フック

`src/hooks/useSessionArchive.ts`:
```typescript
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { archiveOldSessions } from '@/services/sessions';

export function useSessionArchive() {
  const { user } = useAuth();
  const [isArchiving, setIsArchiving] = useState(false);
  const [lastArchiveResult, setLastArchiveResult] = useState<{
    archivedCount: number;
    archivedAt: Date;
  } | null>(null);

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
```

### 3. ログイン時の自動アーカイブ実行

`src/hooks/useAuth.ts`を更新:
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthStateChanged, signInWithGoogle, signOut } from '@/services/auth';
import { archiveOldSessions } from '@/services/sessions';

export function useAuth() {
  const { user, isLoading, setUser } = useAuthStore();
  const hasRunArchive = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setUser(user);

      // ログイン成功時に1度だけアーカイブを実行
      if (user && !hasRunArchive.current) {
        hasRunArchive.current = true;
        try {
          const result = await archiveOldSessions(user.uid);
          if (result.archivedCount > 0) {
            console.log(`${result.archivedCount}件のセッションをアーカイブしました`);
          }
        } catch (e) {
          console.error('セッションアーカイブに失敗しました:', e);
          // アーカイブ失敗は致命的エラーではないため、処理を継続
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return {
    user,
    isLoading,
    signIn: signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
```

### 4. 集計画面でのアーカイブ実行（オプション）

`src/app/(auth)/analytics/page.tsx`に追加:
```typescript
'use client';

import { useEffect } from 'react';
import { useSessionArchive } from '@/hooks/useSessionArchive';
// ... 他のimport

export default function AnalyticsPage() {
  const { runArchive } = useSessionArchive();
  // ... 他のhooks

  // 集計画面表示時にもアーカイブを実行（ログイン後時間が経っている場合に対応）
  useEffect(() => {
    runArchive();
  }, [runArchive]);

  // ... 残りのコンポーネント
}
```

---

## 影響を受ける既存機能

### 集計・グラフ（05_analytics.md）

`getSessionsByPeriod`が`isArchived === false`でフィルタリングするため、自動的にアーカイブ済みセッションは除外される。

### 履歴（04_history.md）

`getSessionsByDate`が`isArchived === false`でフィルタリングするため、自動的にアーカイブ済みセッションは除外される。

### CSVエクスポート（06_settings.md）

`getArchivedSessions`を使用してアーカイブ済みセッションを取得し、エクスポート対象に含める。

---

## エラーハンドリング

| 状況 | 対応 |
|------|------|
| アーカイブ処理が失敗 | エラーをログに記録し、処理を継続（致命的エラーではない） |
| 大量データのアーカイブ | バッチ処理（500件ごと）で実行、タイムアウトを防止 |

---

## テスト観点

- [ ] 1年以上前のセッションがアーカイブされる
- [ ] 1年未満のセッションはアーカイブされない
- [ ] アーカイブ済みセッションが集計・グラフに含まれない
- [ ] アーカイブ済みセッションが履歴一覧に表示されない
- [ ] アーカイブ済みセッションがCSVエクスポートに含まれる
- [ ] ログイン時に自動でアーカイブが実行される
- [ ] 大量データ（500件以上）でもアーカイブが完了する
- [ ] アーカイブ失敗時もアプリが正常に動作する

---

## 補足：アーカイブ対象の判定基準

```
現在日時: 2027-01-23
1年前: 2026-01-23

セッション例:
- endAt: 2026-01-22 → アーカイブ対象（1年以上前）
- endAt: 2026-01-23 → アーカイブ対象外（ちょうど1年）
- endAt: 2026-01-24 → アーカイブ対象外（1年未満）
```

`endAt <= 1年前` の条件でアーカイブする。

---

## 次のステップ

これでセッションアーカイブ機能の実装指示書は完了。
実装順序: `04_history.md` → `05_analytics.md` → `06_settings.md` → `10_session-archive.md`
