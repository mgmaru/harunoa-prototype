---
name: project-context
description: |
  HaruNoaプロジェクトの共通コンテキスト（技術スタック、ディレクトリ構造、命名規則、アーキテクチャルール等）を提供する。
  Use when: サブエージェントがプロジェクト固有の情報を必要とする時、コード検索・レビュー・テスト・ビルド・分析等のタスク実行時に自動的に参照される。
---

# project-context Skill

HaruNoaプロジェクトの共通コンテキストを提供するスキルです。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript 5.x, Tailwind CSS 3.x |
| State | Zustand |
| Backend | Firebase (Authentication, Firestore) |
| Testing | Vitest + Testing Library |
| Linter | ESLint |
| Formatter | Prettier |

---

## ディレクトリ構造

```
src/
├── app/                  # Next.js App Router（ページ）
│   ├── (auth)/           # 認証必要ページ群
│   └── login/            # ログイン画面
├── components/
│   ├── ui/               # 汎用UI（Button, Modal, Toast等）
│   ├── layout/           # レイアウト（Header, TabBar）
│   └── features/         # 機能別（project/, timer/, history/等）
├── hooks/                # カスタムフック
├── stores/               # Zustandストア
├── services/             # Firebase SDK呼び出し（データアクセス層）
├── lib/                  # ユーティリティ
│   ├── firebase/         # Firebase初期化のみ
│   └── date/             # 日付操作・集計ロジック
├── constants/            # 定数定義
└── types/                # TypeScript型定義
```

---

## 命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `fetchProjects` |
| 型 | PascalCase | `Project`, `Session` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| コンポーネント | PascalCase.tsx | `ProjectCard.tsx` |
| フック | use-xxx.ts（kebab-case） | `use-timer.ts` |
| その他ファイル | kebab-case.ts | `format-date.ts` |

---

## アーキテクチャルール

### レイヤー構造と依存方向

```
app/（ページ）
  ↓ uses
components/（UIコンポーネント）
  ↓ uses
hooks/ + stores/（状態管理）
  ↓ uses
services/（データアクセス）
  ↓ uses
lib/firebase/（Firebase初期化）
```

### 変更時の影響範囲

| 変更層 | 影響を受ける層 |
|--------|---------------|
| `types/` | services/, hooks/, components/ |
| `services/` | hooks/, components/features/ |
| `hooks/` | components/ |
| `stores/` | hooks/, components/ |
| `components/ui/` | components/features/, app/ |
| `components/features/` | app/ |
| `lib/` | services/, hooks/, components/ |

### 重要なルール

- **services/層のみ**がFirebase SDKを直接呼び出す
- `Timestamp` → `Date`変換は`services/`層で行う
- Firestoreクエリには必ず`limit()`を設定する
- Server Actionsでは認証・認可・入力検証を行う

---

## 禁止事項（絶対守る）

| 禁止事項 | 理由 |
|---------|------|
| `.env`ファイルやクレデンシャルのコミット | セキュリティリスク |
| Firebase SDKを`services/`層以外で呼び出し | アーキテクチャ違反 |
| `any`型の使用 | 型安全性の欠如 |
| 型アサーション`as`の使用 | 型ガード関数を使用すること |
| `let`, `var`の使用 | `const`のみ使用 |
| 500行を超えるファイル | 可読性・保守性の低下 |
| `interface`の使用 | `type`を使用すること |

---

## 機能領域とディレクトリ対応

| 機能領域 | コンポーネント | Hook | Store | Service |
|----------|---------------|------|-------|---------|
| 認証 | - | useAuth | authStore | auth-service |
| プロジェクト | features/project/ | useProjects | - | project-service |
| タイマー | features/timer/, features/focus/ | useTimer | timerStore | - |
| 履歴 | features/history/ | useSessions | - | session-service |
| 集計 | features/analytics/ | useAnalytics | - | - |
| 設定 | features/settings/ | useSettings | - | settings-service |
| プリセット | features/preset/ | usePresets | - | preset-service |

---

## コマンド一覧

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint実行 |
| `npm run type-check` | TypeScript型チェック |
| `npm test` | 全テスト実行 |
| `npm test -- --watch` | ウォッチモード |
| `npm test -- --coverage` | カバレッジ計測付き |
| `npm test -- path/to/file.test.ts` | 特定ファイルのみ実行 |

---

## テスト環境

| 項目 | 内容 |
|------|------|
| テストフレームワーク | Vitest |
| テストユーティリティ | Testing Library |
| テストファイル配置 | ソースと同階層（`*.test.ts`） |
| E2E/統合テスト | `tests/` ディレクトリ（Playwright将来予定） |

---

## 主要パッケージ

### 本番依存

| パッケージ | 用途 |
|------------|------|
| next | フレームワーク（14.x） |
| react / react-dom | UI（18.x） |
| firebase | BaaS（認証・Firestore） |
| zustand | 状態管理 |
| chart.js / react-chartjs-2 | グラフ描画 |
| react-hook-form | フォーム |
| date-fns | 日付操作 |
| zod | バリデーション |

### 開発依存

| パッケージ | 用途 |
|------------|------|
| typescript | 型システム（5.x） |
| tailwindcss | スタイリング（3.x） |
| eslint | リンター |
| prettier | フォーマッター |
| vitest | テストフレームワーク |
| @testing-library/react | テストユーティリティ |

---

## レポート出力先

サブエージェントが生成するレポートの保存先：

| エージェント | 保存先 |
|-------------|--------|
| test-runner | `docs/reports/tests/` |
| build-executor | `docs/reports/builds/` |
| test-analyzer | `docs/reports/analysis/` |
| code-reviewer | `docs/reports/reviews/` |
| security-checker | `docs/reports/security/` |
| impact-analyzer | `docs/reports/impacts/` |
| dependency-checker | `docs/reports/dependencies/` |
| log-analyzer | `docs/reports/logs/` |

### 命名規則

- フォーマット: `{type}-report-{scope}-YYYYMMDD-HHMMSS.md`
- 最新レポート: 各ディレクトリの `latest.md` シンボリックリンク

---

## セキュリティ要件

### 認証・認可チェックリスト

| 場所 | チェック項目 | 必須 |
|------|-------------|:----:|
| Server Actions | 認証確認 | 必須 |
| Server Actions | 認可（リソース所有者）確認 | 必須 |
| Server Actions | Zodで入力検証 | 必須 |
| services/層 | 認証確認（Defense in Depth） | 必須 |
| Firestoreルール | `request.auth != null` | 必須 |
| Firestoreルール | `request.auth.uid == resource.data.userId` | 必須 |

---

## ドキュメント構造

| ディレクトリ | 内容 |
|-------------|------|
| `docs/` | 設計ドキュメント |
| `docs/implementation/` | 実装指示書 |
| `docs/testing/` | テスト仕様書 |
| `docs/reports/` | エージェント生成レポート |

### 主要ドキュメント

| ファイル | 内容 |
|----------|------|
| `docs/requirements.md` | 要件定義 |
| `docs/01_tech-stack.md` | 技術スタック詳細 |
| `docs/02_data-model.md` | Firestore構造・型定義 |
| `docs/03_api-design.md` | services層のAPI仕様 |
| `docs/04_component-structure.md` | コンポーネント設計 |
| `docs/tasklist.md` | 実装タスクリスト |
