# harunoa-prototype-ui
This is a prototype of the UI for "HaruNoa".

## 1. プロジェクト概要
HaruNoaは、日々実施した作業を「プロジェクト単位」で記録・可視化し、作業の進捗を把握するためのWebアプリケーションです。
v2では「個人利用（単一ユーザ）」にフォーカスし、ポモドーロタイマーや計測機能の使い勝手を重視しています。

## 2. ドキュメント（開発の指針）
開発を開始する前に、必ず以下のドキュメントを参照してください。
これらが全ての「正」となる情報源です。

- **要件定義書**: [`docs/requirements_v2.1.md`](./docs/requirements_v2.1.md)
- **画面仕様書**: [`docs/screen_specifications_v0.md`](./docs/screen_specifications_v0.md)

## 3. 技術スタック
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Google Auth (via Firebase Auth or Supabase Auth)
- **Database**: Firestore or Supabase (PostgreSQL)
- **State Management**: React Context / Hooks

## 4. ディレクトリ構造のルール
- `src/app`: ページコンポーネントのみ。ロジックは極力持たせない。
- `src/components/ui`: 汎用的なUIコンポーネント（ボタン、入力欄など）。
- `src/components/domain`: HaruNoa固有の機能コンポーネント（タイマー、グラフなど）。
- `src/types`: 共有される型定義は必ずここで定義する。

## 5. 開発セットアップ手順

### インストール
```bash
npm install
