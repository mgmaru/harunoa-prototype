# プロジェクト管理 実装指示書

対象画面：SCR-002（プロジェクト一覧）、SCR-003（アーカイブ一覧）
関連ドキュメント：screen_specifications.md 6.2〜6.3節

---

## 概要

プロジェクトのCRUD操作とアーカイブ機能を実装する。

---

## 前提条件

- `01_auth.md`が完了していること

---

## 実装手順

### 1. プロジェクトAPI実装

`src/services/projects.ts`:
```typescript
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Project, CreateProjectInput } from '@/types/project';
import { PROJECT_COLORS } from '@/constants/colors';

const projectsRef = collection(db, 'projects');

// 次の自動割当色を取得
async function getNextAutoColor(userId: string): Promise<string> {
  const q = query(
    projectsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const usedColors = snapshot.docs.map((d) => d.data().color);
  
  for (const color of PROJECT_COLORS) {
    if (!usedColors.includes(color)) {
      return color;
    }
  }
  return PROJECT_COLORS[0]; // 全て使用済みなら最初に戻る
}

export async function createProject(
  userId: string,
  input: CreateProjectInput
): Promise<Project> {
  const color = input.color || (await getNextAutoColor(userId));
  
  const docRef = await addDoc(projectsRef, {
    userId,
    name: input.name,
    color,
    isArchived: false,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId,
    name: input.name,
    color,
    isArchived: false,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getProjects(userId: string): Promise<Project[]> {
  const q = query(
    projectsRef,
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
  })) as Project[];
}

export async function updateProject(
  id: string,
  input: Partial<CreateProjectInput>
): Promise<void> {
  await updateDoc(doc(db, 'projects', id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveProject(id: string): Promise<void> {
  await updateDoc(doc(db, 'projects', id), {
    isArchived: true,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function restoreProject(id: string): Promise<void> {
  await updateDoc(doc(db, 'projects', id), {
    isArchived: false,
    archivedAt: null,
    updatedAt: serverTimestamp(),
  });
}

export async function getArchivedProjects(userId: string): Promise<Project[]> {
  const q = query(
    projectsRef,
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('archivedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data().createdAt as Timestamp).toDate(),
    updatedAt: (doc.data().updatedAt as Timestamp).toDate(),
    archivedAt: (doc.data().archivedAt as Timestamp)?.toDate() || null,
  })) as Project[];
}
```

### 2. カラーパレット定義

`src/constants/colors.ts`:
```typescript
export const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#EAB308', // yellow
  '#F97316', // orange
  '#EF4444', // red
  '#A855F7', // purple
  '#78716C', // brown
  '#1F2937', // gray-dark
  '#9CA3AF', // gray-light
  '#06B6D4', // cyan
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];
```

### 3. プロジェクトフック

`src/hooks/useProjects.ts`:
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getProjects,
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
  getArchivedProjects,
} from '@/services/projects';
import { Project, CreateProjectInput } from '@/types/project';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getProjects(user.uid);
      setProjects(data);
    } catch (e) {
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const create = async (input: CreateProjectInput) => {
    if (!user) throw new Error('Not authenticated');
    const project = await createProject(user.uid, input);
    setProjects((prev) => [project, ...prev]);
    return project;
  };

  const update = async (id: string, input: Partial<CreateProjectInput>) => {
    await updateProject(id, input);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...input } : p))
    );
  };

  const archive = async (id: string) => {
    await archiveProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    projects,
    isLoading,
    error,
    create,
    update,
    archive,
    refresh: fetchProjects,
  };
}
```

### 4. プロジェクト一覧画面

`src/app/(auth)/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectList } from '@/components/features/project/ProjectList';
import { ProjectCreateModal } from '@/components/features/project/ProjectCreateModal';
import { Header } from '@/components/layout/Header';

export default function HomePage() {
  const { projects, isLoading, create, update, archive } = useProjects();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              + 新規作成
            </button>
            <a href="/archive" className="text-gray-600 hover:underline px-4 py-2">
              アーカイブ
            </a>
          </div>
        </div>

        {/* 期間切替 */}
        <div className="flex gap-2 mb-4">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border'
              }`}
            >
              {p === 'day' ? '当日' : p === 'week' ? '当週' : '当月'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <ProjectList
            projects={projects}
            period={period}
            onEdit={update}
            onArchive={archive}
          />
        )}
      </main>

      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={create}
      />
    </div>
  );
}
```

---

## バリデーション

| 条件 | エラーメッセージ |
|------|------------------|
| プロジェクト名が空 | 「プロジェクト名を入力してください」 |
| 通信エラー | 「保存に失敗しました。もう一度お試しください。」 |

---

## テスト観点

- [ ] プロジェクト一覧が表示される
- [ ] 新規作成モーダルが開く
- [ ] プロジェクト作成後、一覧に追加される
- [ ] 色未指定時に自動割当される
- [ ] 編集モーダルで名前・色を変更できる
- [ ] アーカイブ後、一覧から消える
- [ ] アーカイブ一覧で復帰できる

---

## 次のステップ

→ `03_timer.md`（タイマー・集中モードの実装）
