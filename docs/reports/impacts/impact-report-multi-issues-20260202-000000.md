# 影響範囲分析レポート: 3件の問題

**レポートID**: impact-report-multi-issues-20260202-000000
**分析日時**: 2026-02-02
**分析対象**: 問題#2, #3, #4
**分析者**: impact-analyzer

---

## エグゼクティブサマリー

テストシナリオ実施により発見された3件の問題について影響範囲を分析しました。すべての問題は「機能未実装」が原因であり、既存コードの修正箇所は明確です。

| 問題 | 影響度 | 原因 | 修正難易度 |
|------|:------:|------|:----------:|
| #2: プロジェクト名重複警告未表示 | 低 | 機能未実装 | 低 |
| #3: プロジェクト一覧の合計時間・最終計測日未更新 | 中 | 機能未実装 | 中 |
| #4: アーカイブ済みプロジェクト集計除外未実装 | 中 | 実装済み（問題なし） | - |

---

## 問題#2: プロジェクト名重複時の警告未表示

### 現象

- 同名プロジェクト作成時に警告が表示されない
- 期待動作: テストシナリオ1.8では「警告表示されるが作成可能」
- 実際の動作: 警告なしで作成される

### 原因分析

**根本原因**: `ProjectCreateModal`コンポーネントに重複チェック機能が未実装

#### 関連ファイル

| ファイル | 行番号 | 問題箇所 | 影響 |
|----------|--------|----------|------|
| `src/components/features/project/ProjectCreateModal.tsx` | 25-47 | `handleSubmit`関数 | 重複チェックロジックが存在しない |
| `src/hooks/useProjects.ts` | - | - | プロジェクト一覧を保持しているが、Modalコンポーネントには渡されていない |
| `src/app/(auth)/page.tsx` | 119-123 | `ProjectCreateModal`呼び出し | `projects`propsを渡していない |

#### コード詳細

**現在の実装（問題箇所）**:

```tsx
// src/components/features/project/ProjectCreateModal.tsx:25-47
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const trimmedName = name.trim();
  if (!trimmedName) {
    setError('プロジェクト名を入力してください');
    return;
  }

  // ← ここに重複チェックが必要

  setIsSubmitting(true);
  try {
    await onCreate({
      name: trimmedName,
      color: color ?? undefined,
    });
    handleClose();
  } catch {
    setError('保存に失敗しました。もう一度お試しください。');
  } finally {
    setIsSubmitting(false);
  }
};
```

### 影響範囲

#### 直接影響

| ファイル | 影響内容 | 修正必要性 |
|----------|----------|:----------:|
| `src/components/features/project/ProjectCreateModal.tsx` | 重複チェック機能の追加 | **必須** |
| `src/app/(auth)/page.tsx` | `projects`propsの追加 | **必須** |

#### 間接影響

| ファイル | 影響内容 | 修正必要性 |
|----------|----------|:----------:|
| `src/hooks/useProjects.ts` | 変更なし（既存のprojectsを使用） | なし |
| `src/services/projects.ts` | 変更なし（重複許可の仕様） | なし |

### 修正方針

1. **Props追加**: `ProjectCreateModal`に`projects: Project[]`を追加
2. **重複チェック実装**: `handleSubmit`内で同名プロジェクトの存在確認
3. **警告表示**: 重複時に警告メッセージを表示（作成は可能）

**実装例**:

```tsx
// 1. Props追加
type ProjectCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateProjectInput) => Promise<void>;
  projects: Project[]; // ← 追加
};

// 2. 重複チェック実装
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const trimmedName = name.trim();
  if (!trimmedName) {
    setError('プロジェクト名を入力してください');
    return;
  }

  // 重複チェック（警告のみ、作成は可能）
  const isDuplicate = projects.some(p => p.name === trimmedName);
  if (isDuplicate) {
    setError('同じ名前のプロジェクトが既に存在します。それでも作成しますか?');
    // 続行を許可
  }

  // 以下は既存コード
  ...
};
```

### リスク評価

| リスク項目 | 評価 | 理由 |
|------------|:----:|------|
| 破壊的変更の有無 | ✅ | Propsの追加のみ、既存機能には影響なし |
| 型の互換性 | ✅ | `Project[]`型は既存の型定義を使用 |
| テストカバレッジ | ⚠️ | 重複チェックのテストが必要 |
| 循環依存のリスク | ✅ | なし |

---

## 問題#3: プロジェクト一覧の合計時間・最終計測日が更新されない

### 現象

- 計測後もプロジェクト一覧で「合計: 0分」「最終計測: -」のまま
- 期待動作: 計測完了後に合計時間と最終計測日が更新される
- 実際の動作: 履歴画面ではセッションが表示されるが、プロジェクト一覧には反映されない

### 原因分析

**根本原因**: プロジェクト一覧画面でセッションデータを集計する機能が未実装

#### 関連ファイル

| ファイル | 行番号 | 問題箇所 | 影響 |
|----------|--------|----------|------|
| `src/app/(auth)/page.tsx` | 23-143 | `HomePage`コンポーネント全体 | セッション取得ロジックが存在しない |
| `src/components/features/project/ProjectList.tsx` | 26-38 | `ProjectList`コンポーネント | `ProjectCard`に集計データを渡していない |
| `src/components/features/project/ProjectCard.tsx` | 16-31 | Props定義 | `totalTime`, `lastMeasuredAt`はオプショナルpropsだが常にundefined |

#### コード詳細

**現在の実装（問題箇所）**:

```tsx
// src/app/(auth)/page.tsx:108-113
<ProjectList
  projects={projects}
  onEdit={setEditingProject}
  onArchive={setArchivingProject}
  // ← totalTime, lastMeasuredAtを計算して渡す必要がある
/>
```

```tsx
// src/components/features/project/ProjectList.tsx:28-34
{projects.map((project) => (
  <ProjectCard
    key={project.id}
    project={project}
    onEdit={() => onEdit(project)}
    onArchive={() => onArchive(project)}
    // ← totalTime, lastMeasuredAtが渡されていない
  />
))}
```

```tsx
// src/components/features/project/ProjectCard.tsx:24-30
export const ProjectCard = ({
  project,
  totalTime = '0分',        // ← デフォルト値が常に使われる
  lastMeasuredAt,          // ← 常にundefined
  onEdit,
  onArchive,
}: ProjectCardProps) => {
```

### 影響範囲

#### 直接影響

| ファイル | 影響内容 | 修正必要性 |
|----------|----------|:----------:|
| `src/app/(auth)/page.tsx` | セッション集計ロジックの追加 | **必須** |
| `src/components/features/project/ProjectList.tsx` | 集計データのprops追加 | **必須** |
| `src/hooks/useSessions.ts` | 変更なし（既存API使用） | なし |
| `src/services/sessions.ts` | 変更なし（既存API使用） | なし |

#### 間接影響

| ファイル | 影響内容 | 修正必要性 |
|----------|----------|:----------:|
| `src/components/features/project/ProjectCard.tsx` | 変更なし（既にpropsを受け取る実装済み） | なし |
| `src/lib/date/aggregation.ts` | 期間集計ロジックの再利用可能性 | 検討 |

### 修正方針

#### 方針1: ホーム画面でセッションを取得・集計（推奨）

1. **セッション取得**: `useSessions`または`getSessionsByPeriod`でセッションを取得
2. **プロジェクト別集計**: 各プロジェクトの合計時間・最終計測日を計算
3. **データ渡し**: `ProjectList`経由で`ProjectCard`に集計データを渡す

**実装例**:

```tsx
// src/app/(auth)/page.tsx

// 1. セッション取得
const { user } = useAuth();
const [projectStats, setProjectStats] = useState<Map<string, { totalTime: string; lastMeasuredAt: Date | null }>>(new Map());

useEffect(() => {
  if (!user || projects.length === 0) return;

  const fetchStats = async () => {
    const { start, end } = getPeriodRange(period, new Date());
    const sessions = await getSessionsByPeriod(user.uid, start, end);

    const stats = new Map();
    for (const project of projects) {
      const projectSessions = sessions.filter(s => s.projectId === project.id);
      const totalMs = projectSessions.reduce((sum, s) => sum + s.durationMs, 0);
      const totalMinutes = Math.floor(totalMs / 1000 / 60);
      const lastSession = projectSessions[0]; // startAt desc順

      stats.set(project.id, {
        totalTime: `${totalMinutes}分`,
        lastMeasuredAt: lastSession?.startAt ?? null,
      });
    }

    setProjectStats(stats);
  };

  fetchStats();
}, [user, projects, period]);

// 2. ProjectListに渡す
<ProjectList
  projects={projects}
  projectStats={projectStats} // ← 追加
  onEdit={setEditingProject}
  onArchive={setArchivingProject}
/>
```

```tsx
// src/components/features/project/ProjectList.tsx

type ProjectListProps = {
  projects: Project[];
  projectStats: Map<string, { totalTime: string; lastMeasuredAt: Date | null }>; // ← 追加
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
};

{projects.map((project) => {
  const stats = projectStats.get(project.id);
  return (
    <ProjectCard
      key={project.id}
      project={project}
      totalTime={stats?.totalTime}           // ← 追加
      lastMeasuredAt={stats?.lastMeasuredAt} // ← 追加
      onEdit={() => onEdit(project)}
      onArchive={() => onArchive(project)}
    />
  );
})}
```

#### 方針2: カスタムフックの作成（推奨）

集計ロジックを`useProjectStats`フックとして切り出す:

```tsx
// src/hooks/useProjectStats.ts (新規作成)

type ProjectStat = {
  totalTime: string;
  lastMeasuredAt: Date | null;
};

export const useProjectStats = (
  projects: Project[],
  period: PeriodType
): Map<string, ProjectStat> => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Map<string, ProjectStat>>(new Map());

  useEffect(() => {
    // 集計ロジック（方針1と同様）
  }, [user, projects, period]);

  return stats;
};
```

### 依存関係

```
HomePage
  ↓ uses
useProjectStats (新規)
  ↓ uses
getSessionsByPeriod (既存)
  ↓ uses
Firestore sessions collection
```

### リスク評価

| リスク項目 | 評価 | 理由 |
|------------|:----:|------|
| 破壊的変更の有無 | ✅ | 既存機能には影響なし（追加のみ） |
| 型の互換性 | ✅ | 既存の型定義を使用 |
| テストカバレッジ | ⚠️ | 集計ロジックのテストが必要 |
| パフォーマンス | ⚠️ | セッション数が多い場合の性能確認が必要 |
| 循環依存のリスク | ✅ | なし |

### パフォーマンス考慮事項

| 項目 | 懸念 | 対策 |
|------|------|------|
| セッション取得 | 期間内の全セッションを取得 | `limit()`を設定、または期間を絞る |
| 集計処理 | プロジェクト数×セッション数のループ | メモ化（`useMemo`）を使用 |
| 再取得頻度 | 期間切替のたびに再取得 | キャッシュの導入を検討 |

---

## 問題#4: アーカイブ済みプロジェクトの集計除外が機能していない

### 現象

- プロジェクトをアーカイブしても集計画面にデータが表示される
- 期待動作: アーカイブ済みプロジェクトのセッションは集計に含めない
- 実際の動作: アーカイブ後も集計画面で合計時間に含まれる

### 原因分析

**根本原因**: **機能は正しく実装済み** - テスト手順の誤解または別の問題の可能性

#### コード検証

**アーカイブ除外は正しく実装されている**:

```tsx
// src/lib/date/aggregation.ts:104-106
for (const session of sessions) {
  // アーカイブ済みプロジェクトは除外
  const project = projectMap.get(session.projectId);
  if (!project || project.isArchived) continue; // ← 正しく除外されている
  ...
}
```

```tsx
// src/hooks/useAnalytics.ts:27-28
const { user } = useAuth();
const { projects } = useProjects(); // ← アクティブプロジェクトのみ取得

// useProjects内部
// src/hooks/useProjects.ts:30
const data = await getProjects(user.uid); // ← isArchived: false のみ取得

// services層
// src/services/projects.ts:108-119
export const getProjects = async (userId: string): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('userId', '==', userId),
    where('isArchived', '==', false), // ← 正しくフィルタ
    orderBy('updatedAt', 'desc'),
    limit(MAX_PROJECTS_LIMIT)
  );
  ...
};
```

### 影響範囲

**影響なし** - 既存実装は正しく動作しているはずです。

### 再現性の確認

問題が実際に発生しているか再確認が必要です。

#### 確認ポイント

| 確認項目 | 確認方法 | 期待結果 |
|----------|----------|----------|
| アーカイブ後のprojects配列 | `useProjects()`の戻り値をログ出力 | アーカイブしたプロジェクトが含まれない |
| 集計データ | `useAnalytics()`の`items`をログ出力 | アーカイブしたプロジェクトが含まれない |
| Firestore状態 | Firebase Consoleでドキュメント確認 | `isArchived: true`になっている |

#### テスト手順の見直し

テストシナリオ1.6の手順:

1. プロジェクトAを作成
2. プロジェクトAで計測（セッション作成）
3. 集計画面で確認 → データ表示される（正常）
4. プロジェクトAをアーカイブ
5. **集計画面で確認 → データが表示されない（期待動作）** ← ここを再確認

**注意**: 集計画面を開いたまま別タブでアーカイブした場合、画面更新が必要です。

### 修正方針

**方針A**: 問題が再現する場合

- `useProjects`と`useAnalytics`のデータ整合性を確認
- リアルタイム更新の実装（Firestore snapshot listener）

**方針B**: 問題が再現しない場合

- テストシナリオの手順を明確化
- 画面リロードの必要性を明記

### リスク評価

| リスク項目 | 評価 | 理由 |
|------------|:----:|------|
| 破壊的変更の有無 | ✅ | 修正不要の可能性が高い |
| 型の互換性 | ✅ | 変更なし |
| テストカバレッジ | ⚠️ | アーカイブフローのE2Eテストが必要 |
| 循環依存のリスク | ✅ | なし |

---

## 総合的な推奨アクション

### 優先度付け

| 問題 | 優先度 | 理由 | 推定工数 |
|------|:------:|------|:--------:|
| #3: プロジェクト一覧の合計時間・最終計測日 | **高** | ユーザビリティに直結 | 4-6時間 |
| #2: プロジェクト名重複警告 | 中 | UX改善 | 1-2時間 |
| #4: アーカイブ済み集計除外 | 低 | 既存実装で対応済みの可能性 | 1時間（検証のみ） |

### 実装順序

1. **問題#4の再現性確認**（30分）
   - テスト手順の見直し
   - ログ出力による状態確認

2. **問題#3の修正**（4-6時間）
   - `useProjectStats`フックの作成
   - `HomePage`での集計実装
   - `ProjectList`のprops追加
   - テスト追加

3. **問題#2の修正**（1-2時間）
   - `ProjectCreateModal`に重複チェック追加
   - `HomePage`から`projects`propsを渡す
   - テスト追加

### 事前確認が必要な項目

- [ ] 問題#4が実際に再現するか確認
- [ ] プロジェクト一覧の期間切替（当日/当週/当月）の仕様確認
- [ ] 合計時間の表示形式（分のみ？時間分？）
- [ ] パフォーマンス要件（セッション数、プロジェクト数）

### テスト計画

#### 問題#2のテスト

| テストケース | 操作 | 期待結果 |
|-------------|------|----------|
| 重複警告表示 | 既存プロジェクトと同名で作成 | 警告メッセージ表示 |
| 重複でも作成可能 | 警告表示後に作成ボタン押下 | 作成成功 |
| 大文字小文字の区別 | 「Project」と「project」 | 仕様確認必要 |

#### 問題#3のテスト

| テストケース | 操作 | 期待結果 |
|-------------|------|----------|
| 初回計測後の表示 | セッション作成→ホーム画面 | 合計時間・最終計測日が表示される |
| 複数セッション | 同じプロジェクトで2回計測 | 合計時間が加算される |
| 期間切替 | 当日→当週に切替 | 合計時間が期間に応じて変わる |
| 期間外セッション | 先週のセッションがある場合 | 当日表示では0分 |

#### 問題#4のテスト

| テストケース | 操作 | 期待結果 |
|-------------|------|----------|
| アーカイブ後の集計 | プロジェクトアーカイブ→集計画面 | データが表示されない |
| 復帰後の集計 | アーカイブ復帰→集計画面 | データが再表示される |

### 注意事項

1. **問題#3のパフォーマンス**
   - セッション数が多い場合の性能に注意
   - 必要に応じてキャッシュやページネーション導入

2. **問題#2の仕様確認**
   - 警告表示後の挙動（作成継続/キャンセル）
   - 大文字小文字の扱い

3. **問題#4の検証**
   - 実際に問題が発生しているか再確認
   - 画面更新のタイミングに注意

---

## 影響を受けるファイル一覧

### 直接修正が必要

| ファイル | 問題 | 修正内容 | 行数 |
|----------|------|----------|:----:|
| `src/app/(auth)/page.tsx` | #2, #3 | props追加、集計ロジック追加 | +30 |
| `src/components/features/project/ProjectCreateModal.tsx` | #2 | 重複チェック追加 | +10 |
| `src/components/features/project/ProjectList.tsx` | #3 | props追加 | +5 |
| `src/hooks/useProjectStats.ts` | #3 | 新規作成 | +60 |

### 間接的に影響を受ける（修正不要）

| ファイル | 理由 |
|----------|------|
| `src/components/features/project/ProjectCard.tsx` | 既にprops対応済み |
| `src/hooks/useProjects.ts` | 既存APIを使用 |
| `src/services/projects.ts` | 変更なし |
| `src/services/sessions.ts` | 既存APIを使用 |
| `src/lib/date/aggregation.ts` | 再利用可能 |

### テストファイル

| ファイル | 内容 |
|----------|------|
| `src/hooks/__tests__/useProjectStats.test.ts` | 新規作成 |
| `src/components/features/project/__tests__/ProjectCreateModal.test.tsx` | 既存ファイルに追加 |

---

## まとめ

### 分析結果

- **問題#2**: 機能未実装、修正難易度低
- **問題#3**: 機能未実装、修正難易度中、優先度高
- **問題#4**: 既存実装で対応済みの可能性が高い

### 次のステップ

1. 問題#4の再現性確認
2. 問題#3の修正（`useProjectStats`フック作成）
3. 問題#2の修正（重複チェック追加）
4. テスト追加

### 推定工数

- **合計**: 6-9時間
  - 問題#4確認: 0.5時間
  - 問題#3修正: 4-6時間
  - 問題#2修正: 1-2時間
  - テスト追加: 1時間

---

**レポート終了**
