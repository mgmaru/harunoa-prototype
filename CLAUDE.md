# CLAUDE.md

HaruNoaプロジェクトのClaude Code向け実装ガイドです。

---

## Project Overview

HaruNoaは、作業時間をプロジェクト単位で記録・可視化するWebアプリケーションです。

### Tech Stack

| 領域 | 技術 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| State | Zustand |
| Backend | Firebase (Authentication, Firestore) |
| Hosting | Vercel |
| Testing | Vitest + Testing Library |

---

## Commands

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run lint` | ESLint実行 |
| `npm run type-check` | TypeScript型チェック |
| `npm test` | テスト実行 |

---

## Directory Structure

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

## Code Style

### 命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `fetchProjects` |
| 型 | PascalCase | `Project` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| コンポーネント | PascalCase.tsx | `ProjectCard.tsx` |
| その他ファイル | kebab-case.ts | `use-timer.ts` |

### 基本ルール

- `const`のみ使用（`let`, `var`禁止）
- 型定義は`type`を使用（`interface`不使用）
- `any`禁止 → `unknown` + 型ガードで対応
- 型アサーション`as`禁止 → 型ガード関数を使用
- コンポーネントは500行以下に保つ

---

## Important Notes

### NEVER（絶対禁止）

- NEVER commit `.env` files or credentials
- NEVER call Firebase SDK outside `services/` layer - use services layer
- NEVER use `any` type - prefer `unknown` + type guards
- NEVER exceed 500 lines per file - split into smaller files

### 必須事項

- Firebase SDKは`services/`層でのみ呼び出す
- `Timestamp` → `Date`変換は`services/`層で行う
- クエリには必ず`limit()`を設定する
- Server Actionsでは認証・認可・入力検証を行う

### 作業ルール

- 実装・ドキュメント作成は段階的に行い、各段階で承認を得る
- 永続的ドキュメントは原則修正不可。修正時は必ず承認を得る
- 実装指示書は設計変更時に修正可（要承認）
- 実装に迷った時は、そのまま続けずに必ず質問する
- 同じ意図の文章を複数の場所に記載しない
- セキュリティを意識したコーディングを心掛ける

---

## Testing

| 種別 | 配置 | ツール |
|------|------|--------|
| ユニットテスト | ソースと同階層 | Vitest + Testing Library |
| 統合・E2Eテスト | `tests/` | Playwright（将来） |

---

## Documentation

### ドキュメント種別

| 種別 | 場所 | 役割 | 変更ルール |
|------|------|------|------------|
| 永続的ドキュメント | `docs/` | 設計仕様の定義 | 原則不可（要承認） |
| 実装指示書 | `docs/implementation/` | 実装手順の記載 | 設計変更時は修正可（要承認） |

### 永続的ドキュメント

| ファイル | 内容 |
|----------|------|
| `requirements.md` | 要件定義 |
| `01_tech-stack.md` | 技術スタック・依存パッケージ・環境変数 |
| `02_data-model.md` | Firestore構造・型定義・セキュリティルール |
| `03_api-design.md` | services層のAPI仕様 |
| `04_component-structure.md` | コンポーネント設計・Hooks・Stores |

### 実装指示書

実装は以下の順番で進める（`docs/implementation/`配下）：

| 順番 | ファイル | 機能 |
|:----:|----------|------|
| 0 | `00_setup.md` | プロジェクト初期化 |
| 1 | `01_auth.md` | 認証 |
| 2 | `02_project-management.md` | プロジェクト管理 |
| 3 | `03_timer.md` | タイマー・集中モード |
| 4 | `04_history.md` | 履歴管理 |
| 5 | `05_analytics.md` | 集計・グラフ |
| 6 | `06_settings.md` | 設定 |
| 7 | `07_offline-support.md` | オフライン対応 |
| 8 | `08_pomodoro.md` | ポモドーロ |
| 9 | `09_notification.md` | 通知 |
| 10 | `10_session-archive.md` | セッションアーカイブ |

その他：`frontend-coding-standards.md`、`backend-coding-standards.md`

### 設計変更時の対応

- ドキュメントとコードを同時に更新する
- 修正ドキュメントの影響範囲を特定し、関連ドキュメントも更新する
- 図・表を活用し、簡潔に記載する
