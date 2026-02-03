# HaruNoa

作業時間をプロジェクト単位で記録・可視化するWebアプリケーション

## 概要

HaruNoaは、日々の作業を「プロジェクト単位」で記録し、進捗を可視化するためのタイムトラッキングアプリです。

### 主な機能

- **タイマー機能**: ワンクリックで作業時間を計測
- **プロジェクト管理**: 複数プロジェクトの作業時間を個別に管理
- **集中モード**: 通知をブロックして作業に集中
- **履歴・分析**: 作業履歴の確認とグラフによる可視化
- **ポモドーロタイマー**: 作業と休憩のサイクル管理

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | Google Auth (Firebase Auth) |
| Database | Firestore |
| State | Zustand |
| Form | React Hook Form + Zod |
| Chart | Chart.js |
| Test | Vitest + Testing Library |

## 開発セットアップ

### 必要条件

- Node.js 18以上
- npm 9以上
- Firebaseプロジェクト

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/HiroTech08/harunoa-prototype.git
cd harunoa-prototype

# 依存関係をインストール
npm install
```

### 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、Firebase の設定値を入力してください。

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用ビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | ESLintでコードチェック |
| `npm run test` | テストを監視モードで実行 |
| `npm run test:run` | テストを1回実行 |

## ディレクトリ構造

```
src/
├── app/          # ページコンポーネント（App Router）
├── components/   # UIコンポーネント
│   ├── ui/       # 汎用UIコンポーネント
│   └── domain/   # ドメイン固有コンポーネント
├── hooks/        # カスタムフック
├── lib/          # ユーティリティ・設定
├── services/     # Firebase/外部サービス連携
├── stores/       # Zustandストア
└── types/        # 型定義
```

## ドキュメント

開発に関する詳細は以下のドキュメントを参照してください。

| ドキュメント | 説明 |
|--------------|------|
| [`docs/requirements.md`](./docs/requirements.md) | 要件定義 |
| [`docs/screen_specifications/`](./docs/screen_specifications/) | 画面仕様書 |
| [`docs/implementation/`](./docs/implementation/) | 実装指示書 |
| [`docs/01_tech-stack.md`](./docs/01_tech-stack.md) | 技術スタック詳細 |
| [`docs/02_data-model.md`](./docs/02_data-model.md) | データモデル設計 |
| [`docs/03_api-design.md`](./docs/03_api-design.md) | API設計 |
| [`docs/04_component-structure.md`](./docs/04_component-structure.md) | コンポーネント構成 |
