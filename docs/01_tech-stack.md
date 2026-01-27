# 技術スタック定義書（HaruNoa）

作成日：2026-01-22
関連ドキュメント：requirements.md, screen_specifications.md

---

## 1. 概要

本ドキュメントは、HaruNoaの技術スタックを定義する。

---

## 2. フロントエンド

| 項目 | 技術 | バージョン | 理由 |
|------|------|-----------|------|
| フレームワーク | Next.js (App Router) | 14.x | SSR対応、ルーティング、API Routes |
| 言語 | TypeScript | 5.x | 型安全性 |
| UIライブラリ | React | 18.x | Next.jsの標準 |
| スタイリング | Tailwind CSS | 3.x | ユーティリティファースト、レスポンシブ対応 |
| 状態管理 | Zustand | 4.x | 軽量、シンプル |
| グラフ | Chart.js + react-chartjs-2 | 4.x | 棒グラフ・円グラフ対応 |
| フォーム | React Hook Form | 7.x | バリデーション統合 |
| 日付操作 | date-fns | 3.x | 軽量、TypeScript対応 |

---

## 3. バックエンド / インフラ

| 項目 | 技術 | 理由 |
|------|------|------|
| BaaS | Firebase | 認証・DB・ホスティングを一括提供 |
| 認証 | Firebase Authentication | Google OAuth対応 |
| データベース | Cloud Firestore | NoSQL、リアルタイム同期、オフライン対応 |
| ホスティング | Vercel | Next.jsとの親和性、自動デプロイ |
| ストレージ | Firebase Storage | 将来の拡張用（v2では未使用） |

---

## 4. 開発環境

### 4.1 基本構成

| 項目 | 技術 | バージョン/設定 |
|------|------|----------------|
| Node.js | Node.js | 20.x LTS（.nvmrcで指定） |
| パッケージマネージャ | npm | - |
| 対応ブラウザ | Google Chrome | last 2 Chrome versions |

### 4.2 コード品質

| 項目 | 技術 | 備考 |
|------|------|------|
| リンター | ESLint | Next.js / TypeScript対応 |
| フォーマッター | Prettier | Tailwindクラスソート対応 |
| Git フック | Husky + lint-staged | コミット前チェック |

**ESLint プラグイン構成**:

| プラグイン | 用途 |
|------------|------|
| eslint-config-next | Next.js固有ルール |
| @typescript-eslint/eslint-plugin | TypeScript対応 |
| eslint-config-prettier | Prettier競合回避 |
| prettier-plugin-tailwindcss | Tailwindクラスのソート |

### 4.3 テスト

| 項目 | 技術 | 備考 |
|------|------|------|
| ユニットテスト | Vitest + Testing Library | 高速、TypeScriptネイティブ対応 |
| E2Eテスト | Playwright | 将来実装 |

### 4.4 Firebaseローカル開発

| 項目 | 技術 | 備考 |
|------|------|------|
| エミュレータ | Firebase Emulator Suite | ローカル開発用 |

**使用するエミュレータ**:

| エミュレータ | 用途 |
|--------------|------|
| Authentication | Google OAuth認証のモック |
| Firestore | データベース操作のモック |

### 4.5 環境変数バリデーション

| 項目 | 技術 | 備考 |
|------|------|------|
| バリデーション | @t3-oss/env-nextjs + zod | 型安全な環境変数管理 |

### 4.6 CI/CD

| 項目 | 技術 | 備考 |
|------|------|------|
| CI | GitHub Actions | ビルド・テスト・型チェック |
| CD | Vercel | 自動デプロイ（main / PRプレビュー） |

**GitHub Actions ワークフロー**:

```yaml
# .github/workflows/ci.yml で実行する項目
- npm ci
- npm run lint
- npm run type-check
- npm run test
- npm run build
```

### 4.7 エディタ設定

| 項目 | ファイル | 備考 |
|------|----------|------|
| 共通設定 | .editorconfig | インデント、改行コード統一 |
| VSCode設定 | .vscode/settings.json | 保存時フォーマット等 |
| 推奨拡張機能 | .vscode/extensions.json | ESLint, Prettier, Tailwind CSS IntelliSense |

---

## 5. ディレクトリ構造

### 5.1 構造の設計方針

| 方針 | 説明 |
|------|------|
| SRP（単一責任の原則） | 各ディレクトリは1つの責任のみを持つ |
| 変更容易性 | Firebase SDK等の変更時、影響範囲を限定できる構造 |
| スケーラビリティ | 機能追加時に既存構造を壊さず拡張可能 |

### 5.2 ディレクトリ詳細

```
harunoa-prototype/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # 認証が必要なページ群（Route Group）
│   │   │   ├── page.tsx            # ホーム（プロジェクト一覧）
│   │   │   ├── archive/            # アーカイブ一覧
│   │   │   ├── timer/              # 計測画面
│   │   │   ├── focus/              # 集中モード
│   │   │   ├── history/            # 履歴
│   │   │   ├── analytics/          # 集計・グラフ
│   │   │   ├── settings/           # 設定
│   │   │   └── presets/            # ポモドーロプリセット
│   │   ├── login/                  # ログイン画面
│   │   ├── layout.tsx
│   │   ├── error.tsx               # グローバルエラーハンドリング
│   │   └── globals.css
│   │
│   ├── components/                 # UIコンポーネント
│   │   ├── ui/                     # 汎用UI（Button, Modal, Toast, Input等）
│   │   ├── layout/                 # レイアウト（Header, TabBar, Navigation）
│   │   └── features/               # 機能固有コンポーネント
│   │       ├── project/            # ProjectList, ProjectCard, ProjectCreateModal等
│   │       ├── timer/              # TimerSetup, ProjectSelect, PresetSelect等
│   │       ├── focus/              # FocusScreen, TimerDisplay, TimerControls等
│   │       ├── history/            # SessionList, SessionEditModal, DateFilter等
│   │       ├── analytics/          # BarChart, PieChart, SummaryTable等
│   │       ├── settings/           # NotificationSettings, ExportModal等
│   │       └── preset/             # PresetList, PresetCreateModal等
│   │
│   ├── hooks/                      # カスタムフック
│   │   ├── useAuth.ts              # 認証状態
│   │   ├── useTimer.ts             # タイマー操作
│   │   ├── useProjects.ts          # プロジェクト操作
│   │   ├── useSessions.ts          # セッション操作
│   │   ├── useOnline.ts            # オンライン状態検知
│   │   └── useNotification.ts      # 通知
│   │
│   ├── services/                   # データアクセス層（※1）
│   │   ├── auth.ts                 # 認証（signIn, signOut）
│   │   ├── projects.ts             # プロジェクトCRUD
│   │   ├── sessions.ts             # セッションCRUD
│   │   ├── presets.ts              # プリセットCRUD
│   │   └── analytics.ts            # 集計クエリ
│   │
│   ├── stores/                     # Zustand ストア（※2）
│   │   ├── index.ts                # 統合エクスポート
│   │   ├── authStore.ts            # 認証状態
│   │   ├── timerStore.ts           # タイマー状態
│   │   ├── pomodoroStore.ts        # ポモドーロ状態
│   │   ├── toastStore.ts           # トースト管理
│   │   └── offlineStore.ts         # オフライン状態・キュー
│   │
│   ├── lib/                        # ユーティリティ
│   │   ├── firebase/               # Firebase初期化のみ
│   │   │   ├── config.ts           # Firebase初期化
│   │   │   ├── auth.ts             # Firebase Authインスタンス
│   │   │   └── firestore.ts        # Firestoreインスタンス
│   │   ├── date/                   # 日付操作（date-fns）
│   │   │   ├── format.ts           # フォーマット関数
│   │   │   └── aggregation.ts      # 按分計算・集計
│   │   ├── validation/             # バリデーション（zod）
│   │   │   └── schemas.ts          # Zodスキーマ
│   │   ├── csv/                    # CSVエクスポート
│   │   │   └── export.ts
│   │   └── errors.ts               # エラー定義
│   │
│   ├── constants/                  # 定数
│   │   ├── pomodoro.ts             # MIN_FOCUS_TIME, MIN_BREAK_TIME等
│   │   ├── colors.ts               # カラーパレット（10色）
│   │   ├── routes.ts               # ルートパス定義
│   │   └── app.ts                  # アプリ全般（ページネーション等）
│   │
│   └── types/                      # TypeScript型定義
│       ├── project.ts
│       ├── session.ts
│       ├── preset.ts
│       └── user.ts
│
├── public/                         # 静的ファイル
│   ├── sounds/                     # 通知音ファイル
│   └── icons/
│
├── docs/                           # ドキュメント
│
└── tests/                          # 統合・E2Eテスト
    └── e2e/                        # Playwright
```

### 5.3 レイヤー構造

```
┌─────────────────────────────────────────────────────────────┐
│  app/                     ページコンポーネント（Server/Client） │
├─────────────────────────────────────────────────────────────┤
│  components/              UIコンポーネント                      │
├─────────────────────────────────────────────────────────────┤
│  hooks/                   React Hooks（UIとservicesの橋渡し）  │
│  stores/                  クライアント状態管理（Zustand）        │
├─────────────────────────────────────────────────────────────┤
│  services/                データアクセス層（Firebase SDK呼び出し）│
├─────────────────────────────────────────────────────────────┤
│  lib/firebase/            Firebase初期化・インスタンス          │
│  lib/date/, lib/csv/等    純粋なユーティリティ関数              │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 補足

| No | 項目 | 説明 |
|:--:|------|------|
| ※1 | services/ | Firebase SDKへの依存を集約。SDK変更時の影響範囲を限定 |
| ※2 | stores/ | Zustand Slicesパターンを採用。機能ごとにストアを分割 |

### 5.5 テストファイルの配置

| テスト種別 | 配置場所 | 例 |
|-----------|----------|-----|
| ユニットテスト | ソースと同階層（Colocation） | `src/services/projects.test.ts` |
| 統合・E2Eテスト | tests/ディレクトリに集約 | `tests/e2e/timer.spec.ts` |

---

## 6. 環境変数

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 7. 依存パッケージ一覧

### 本番依存
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "firebase": "^10.0.0",
  "zustand": "^4.0.0",
  "chart.js": "^4.0.0",
  "react-chartjs-2": "^5.0.0",
  "react-hook-form": "^7.0.0",
  "date-fns": "^3.0.0",
  "clsx": "^2.0.0",
  "@t3-oss/env-nextjs": "^0.9.0",
  "zod": "^3.0.0"
}
```

### 開発依存
```json
{
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0",
  "@typescript-eslint/eslint-plugin": "^7.0.0",
  "@typescript-eslint/parser": "^7.0.0",
  "eslint-config-prettier": "^9.0.0",
  "prettier": "^3.0.0",
  "prettier-plugin-tailwindcss": "^0.5.0",
  "husky": "^9.0.0",
  "lint-staged": "^15.0.0",
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "firebase-tools": "^13.0.0"
}
```

---

## 8. 変更履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| v0 | 2026-01-22 | 初版作成 |
| v1 | 2026-01-23 | 開発環境セクションを拡充（レビュー結果反映） |
| v2 | 2026-01-23 | ディレクトリ構造を全面的に見直し |

### v1での主な変更点

| カテゴリ | 変更内容 |
|----------|----------|
| 基本構成 | Node.js 20.x LTS、対応ブラウザを追加 |
| コード品質 | ESLintプラグイン構成を詳細化 |
| ローカル開発 | Firebase Emulator Suiteを追加 |
| 環境変数 | @t3-oss/env-nextjs + zodによるバリデーションを追加 |
| CI/CD | GitHub Actionsを追加 |
| エディタ設定 | .editorconfig、VSCode設定を追加 |
| 依存パッケージ | 開発環境拡充に伴うパッケージを追加 |

### v2での主な変更点

| カテゴリ | 変更内容 |
|----------|----------|
| 構造変更 | `services/` ディレクトリを新設（データアクセス層） |
| 構造変更 | `constants/` ディレクトリを新設（定数管理） |
| 構造変更 | `lib/utils/` を責任別に分割（`lib/date/`, `lib/validation/`, `lib/csv/`） |
| 構造変更 | `lib/firebase/` はFirebase初期化のみに限定 |
| 構造変更 | `app/(auth)/archive/` を追加（アーカイブ一覧） |
| 構造変更 | `app/error.tsx` を追加（グローバルエラーハンドリング） |
| 構造変更 | `stores/` を04_component-structure.mdに合わせて詳細化 |
| 構造変更 | `components/features/` を04_component-structure.mdに合わせて詳細化 |
| テスト | ユニットテストはColocation、統合・E2Eテストはtestsディレクトリに集約 |
| ドキュメント | 設計方針、レイヤー構造、補足説明を追加 |
