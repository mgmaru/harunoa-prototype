# 設定 実装指示書

対象画面：SCR-008（設定）、SCR-009（ポモドーロプリセット管理）
関連ドキュメント：screen_specifications.md 6.8〜6.9節

---

## 概要

通知設定、ポモドーロプリセット管理、CSVエクスポート、ログアウト機能を実装する。

---

## 前提条件

- `05_analytics.md`が完了していること

---

## 実装手順

### 1. ユーザー設定API

`src/services/settings.ts`:
```typescript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserSettings } from '@/types/settings';

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const docRef = doc(db, 'userSettings', userId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    // デフォルト設定を作成
    const defaults: Omit<UserSettings, 'updatedAt'> = {
      userId,
      soundEnabled: false, // デフォルトOFF
      browserNotificationEnabled: true,
      activePomodoroPresetId: null,
    };
    await setDoc(docRef, { ...defaults, updatedAt: serverTimestamp() });
    return { ...defaults, updatedAt: new Date() };
  }
  
  return {
    ...snapshot.data(),
    updatedAt: snapshot.data()?.updatedAt?.toDate() || new Date(),
  } as UserSettings;
}

export async function updateUserSettings(
  userId: string,
  input: Partial<UserSettings>
): Promise<void> {
  await setDoc(
    doc(db, 'userSettings', userId),
    { ...input, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
```

### 2. プリセットAPI

`src/services/presets.ts`:
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PomodoroPreset, CreatePresetInput } from '@/types/preset';

const presetsRef = collection(db, 'pomodoroPresets');

export async function createPreset(
  userId: string,
  input: CreatePresetInput
): Promise<PomodoroPreset> {
  const docRef = await addDoc(presetsRef, {
    userId,
    ...input,
    isActive: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId,
    ...input,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getPresets(userId: string): Promise<PomodoroPreset[]> {
  const q = query(
    presetsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as PomodoroPreset[];
}

export async function updatePreset(
  id: string,
  input: Partial<CreatePresetInput>
): Promise<void> {
  await updateDoc(doc(db, 'pomodoroPresets', id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePreset(id: string): Promise<void> {
  await deleteDoc(doc(db, 'pomodoroPresets', id));
}

export async function setActivePreset(
  userId: string,
  presetId: string
): Promise<void> {
  // 他のプリセットをすべて非アクティブに
  const presets = await getPresets(userId);
  for (const p of presets) {
    if (p.id !== presetId && p.isActive) {
      await updateDoc(doc(db, 'pomodoroPresets', p.id), { isActive: false });
    }
  }
  // 指定のプリセットをアクティブに
  await updateDoc(doc(db, 'pomodoroPresets', presetId), { isActive: true });
}
```

### 3. アーカイブ済みセッション取得API

`src/services/sessions.ts`に追加（04_history.mdで定義したファイルに追加）:
```typescript
export async function getArchivedSessions(userId: string): Promise<Session[]> {
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('startAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    startAt: (doc.data().startAt as Timestamp).toDate(),
    endAt: (doc.data().endAt as Timestamp).toDate(),
    archivedAt: (doc.data().archivedAt as Timestamp)?.toDate() || null,
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as Session[];
}
```

### 4. CSVエクスポート

`src/lib/csv/export.ts`:
```typescript
import { Project } from '@/types/project';
import { Session } from '@/types/session';
import { format } from 'date-fns';

export function exportProjectsToCSV(projects: Project[]): string {
  const headers = ['ID', 'プロジェクト名', '色', 'アーカイブ済み', '作成日'];
  const rows = projects.map((p) => [
    p.id,
    p.name,
    p.color,
    p.isArchived ? 'はい' : 'いいえ',
    format(p.createdAt, 'yyyy-MM-dd HH:mm:ss'),
  ]);
  
  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function exportSessionsToCSV(
  sessions: Session[],
  projectMap: Map<string, string>
): string {
  const headers = ['ID', 'プロジェクト名', '開始時刻', '終了時刻', '計測時間(分)', 'メモ', 'アーカイブ済み', 'アーカイブ日時'];
  const rows = sessions.map((s) => [
    s.id,
    projectMap.get(s.projectId) || 'Unknown',
    format(s.startAt, 'yyyy-MM-dd HH:mm:ss'),
    format(s.endAt, 'yyyy-MM-dd HH:mm:ss'),
    s.durationMinutes,
    `"${s.memo.replace(/"/g, '""')}"`,
    s.isArchived ? 'はい' : 'いいえ',
    s.archivedAt ? format(s.archivedAt, 'yyyy-MM-dd HH:mm:ss') : '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
  const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

#### CSVエクスポートの対象データ

| 種類 | 対象 | 備考 |
|------|------|------|
| プロジェクト | 全プロジェクト | アーカイブ済み含む |
| セッション | 全セッション | アーカイブ済み含む（1年以上経過したデータ） |

セッションのCSVエクスポート時は、`getSessionsByPeriod`（アクティブのみ）と`getArchivedSessions`（アーカイブ済み）の両方を取得して結合する。

### 5. 設定画面

`src/app/(auth)/settings/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { Header } from '@/components/layout/Header';
import { ExportModal } from '@/components/features/settings/ExportModal';
import { LogoutModal } from '@/components/features/settings/LogoutModal';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { settings, update, isLoading } = useSettings();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSoundToggle = async () => {
    await update({ soundEnabled: !settings?.soundEnabled });
  };

  const handleNotificationToggle = async () => {
    if (!settings?.browserNotificationEnabled) {
      // 許可をリクエスト
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await update({ browserNotificationEnabled: true });
      }
    } else {
      await update({ browserNotificationEnabled: false });
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        {/* 通知設定 */}
        <section className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-4">通知設定</h2>
          
          <div className="flex justify-between items-center py-2">
            <span>通知音</span>
            <button
              onClick={handleSoundToggle}
              className={`w-12 h-6 rounded-full relative ${
                settings?.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings?.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <div>
              <span>ブラウザ通知</span>
              <p className="text-sm text-gray-500">ブラウザの許可が必要です</p>
            </div>
            <button
              onClick={handleNotificationToggle}
              className={`w-12 h-6 rounded-full relative ${
                settings?.browserNotificationEnabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings?.browserNotificationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* ポモドーロ */}
        <section className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-4">ポモドーロ</h2>
          <a
            href="/presets"
            className="text-primary-600 hover:underline"
          >
            プリセット管理 →
          </a>
        </section>

        {/* データ管理 */}
        <section className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-4">データ管理</h2>
          <button
            onClick={() => setShowExportModal(true)}
            className="text-primary-600 hover:underline"
          >
            CSVエクスポート
          </button>
        </section>

        {/* アカウント */}
        <section className="bg-white rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-4">アカウント</h2>
          <p className="text-gray-600 mb-2">
            ログイン中: {user?.email}
          </p>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="text-red-600 hover:underline"
          >
            ログアウト
          </button>
        </section>

        {/* アプリ情報 */}
        <section className="bg-white rounded-lg p-4">
          <h2 className="font-semibold mb-4">アプリ情報</h2>
          <p className="text-gray-600">バージョン: 2.0.0</p>
        </section>
      </main>

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {showLogoutModal && (
        <LogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
```

---

## バリデーション（プリセット）

| 条件 | エラーメッセージ |
|------|------------------|
| プリセット名が空 | 「プリセット名を入力してください」 |
| 集中時間 < 25分 | 「集中時間は25分以上で設定してください」 |
| 休憩時間 < 5分 | 「休憩時間は5分以上で設定してください」 |
| 休憩時間 > 10分 | 「休憩時間は10分以内で設定してください。...」 |
| 利用中プリセットの削除 | 「利用中のプリセットは削除できません。...」 |

---

## 次のステップ

→ `07_offline-support.md`（オフライン対応の実装）
