# ステージング環境デプロイ手順

HaruNoaをVercel Preview（ステージング環境）にデプロイするための手順書です。

---

## 目次

1. [前提条件](#前提条件)
2. [事前準備](#事前準備)
3. [Firebase設定](#firebase設定)
4. [Vercel設定](#vercel設定)
5. [デプロイ実行](#デプロイ実行)
6. [動作確認](#動作確認)
7. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 必要なアカウント

| サービス | 用途 | 備考 |
|----------|------|------|
| GitHub | ソースコード管理 | リポジトリ作成済みであること |
| Firebase | 認証・データベース | プロジェクト作成済みであること |
| Vercel | ホスティング | 無料プランで可 |

### 必要なツール

| ツール | バージョン | 確認コマンド |
|--------|-----------|--------------|
| Node.js | 18.x以上 | `node -v` |
| npm | 9.x以上 | `npm -v` |
| Firebase CLI | 最新版 | `firebase --version` |
| Git | 最新版 | `git --version` |

### Firebase CLIのインストール（未インストールの場合）

```bash
npm install -g firebase-tools
firebase login
```

---

## 事前準備

### 1. ローカルビルドの確認

デプロイ前にローカルでビルドが成功することを確認します。

```bash
npm run build
```

**期待結果**：エラーなくビルドが完了すること

### 2. GitHubリポジトリへのプッシュ

最新のコードがGitHubにプッシュされていることを確認します。

```bash
git status
git add .
git commit -m "デプロイ準備完了"
git push origin main
```

---

## Firebase設定

### 1. Firebaseプロジェクトの確認

Firebase Consoleにアクセスし、以下の情報を確認します。

**アクセス先**: https://console.firebase.google.com/

| 設定項目 | 確認場所 |
|----------|----------|
| API Key | プロジェクト設定 → 全般 → ウェブAPI キー |
| Auth Domain | プロジェクト設定 → 全般 → `プロジェクトID.firebaseapp.com` |
| Project ID | プロジェクト設定 → 全般 → プロジェクトID |
| Storage Bucket | プロジェクト設定 → 全般 → `プロジェクトID.appspot.com` |
| Messaging Sender ID | プロジェクト設定 → Cloud Messaging → 送信者ID |
| App ID | プロジェクト設定 → 全般 → アプリID |

### 2. 認証済みドメインの追加

Google認証を使用するため、Vercelのドメインを認証済みドメインに追加します。

**設定場所**: Firebase Console → Authentication → Settings → Authorized domains

**追加するドメイン**：

| ドメイン | 用途 |
|----------|------|
| `プロジェクト名.vercel.app` | 本番デプロイ用 |
| `プロジェクト名-git-*.vercel.app` | Previewデプロイ用（ワイルドカード不可の場合は都度追加） |

> **注意**: Vercel Previewのドメインは毎回異なります。認証エラーが発生した場合は、エラーメッセージに表示されるドメインを追加してください。

### 3. Firestoreセキュリティルールのデプロイ

ローカルで定義したセキュリティルールをFirebaseにデプロイします。

```bash
# Firebaseプロジェクトを選択（初回のみ）
firebase use --add

# ルールのデプロイ
firebase deploy --only firestore:rules
```

**期待結果**：

```
✔  Deploy complete!
```

### 4. Firestoreインデックスのデプロイ（必要な場合）

複合インデックスが必要な場合はインデックスもデプロイします。

```bash
firebase deploy --only firestore:indexes
```

---

## Vercel設定

### 1. Vercelプロジェクトの作成

#### 方法A: Vercel Dashboard（GUI）

1. https://vercel.com/dashboard にアクセス
2. 「Add New...」→「Project」をクリック
3. 「Import Git Repository」でGitHubリポジトリを選択
4. 「Import」をクリック

#### 方法B: Vercel CLI

```bash
# Vercel CLIのインストール（未インストールの場合）
npm install -g vercel

# プロジェクトのリンク
vercel link
```

### 2. 環境変数の設定

Vercel Dashboard → Project → Settings → Environment Variables

以下の環境変数を設定します。

| 変数名 | 値 | Production | Preview | Development |
|--------|-----|:----------:|:-------:|:-----------:|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | FirebaseのAPIキー | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `プロジェクトID.firebaseapp.com` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | FirebaseのプロジェクトID | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `プロジェクトID.appspot.com` | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebaseの送信者ID | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | FirebaseのアプリID | ✓ | ✓ | ✓ |
| `NEXT_PUBLIC_APP_URL` | デプロイ先のURL | ✓ | ✓ | - |
| `NEXT_PUBLIC_USE_EMULATOR` | `false` | ✓ | ✓ | - |

**設定手順**：

1. 「Add New」をクリック
2. Key（変数名）を入力
3. Value（値）を入力
4. Environment（適用環境）を選択
5. 「Save」をクリック

> **重要**: `NEXT_PUBLIC_USE_EMULATOR`は必ず`false`に設定してください。`true`の場合、ローカルのEmulatorに接続しようとして失敗します。

### 3. ビルド設定の確認

Vercel Dashboard → Project → Settings → General

| 設定項目 | 値 |
|----------|-----|
| Framework Preset | Next.js（自動検出） |
| Build Command | `npm run build`（デフォルト） |
| Output Directory | `.next`（デフォルト） |
| Install Command | `npm install`（デフォルト） |

---

## デプロイ実行

### Previewデプロイ（ステージング）

#### 方法A: プルリクエスト経由（推奨）

1. 新しいブランチを作成

```bash
git checkout -b feature/staging-test
git push origin feature/staging-test
```

2. GitHubでプルリクエストを作成
3. Vercelが自動的にPreviewデプロイを実行
4. PRのコメントにPreview URLが投稿される

#### 方法B: Vercel CLI経由

```bash
# Previewデプロイ
vercel

# デプロイ完了後、URLが表示される
```

### Productionデプロイ

```bash
# mainブランチにマージ後、自動デプロイ
git checkout main
git merge feature/staging-test
git push origin main
```

または

```bash
# CLI経由で直接Productionデプロイ
vercel --prod
```

---

## 動作確認

### 1. 基本動作確認

デプロイ完了後、以下の項目を確認します。

| No | 確認項目 | 確認方法 |
|----|----------|----------|
| 1 | ページ表示 | デプロイURLにアクセスし、ログイン画面が表示される |
| 2 | Google認証 | 「Googleでログイン」でログインできる |
| 3 | プロジェクト作成 | 新規プロジェクトを作成できる |
| 4 | 計測機能 | 計測の開始・停止ができる |
| 5 | データ保存 | 作成したデータがリロード後も保持される |

### 2. ステージング環境テスト

ローカルテストで実施できなかった以下のテストを実施します。

| カテゴリ | テスト内容 |
|----------|-----------|
| 9. 複数端末 | PC・スマホ間のデータ同期 |
| 10. オフライン対応 | ネットワーク切断時の動作 |
| 11. 非機能要件 | 性能・信頼性の確認 |
| 12. レスポンシブ対応 | スマホ・タブレットでの表示確認 |

詳細なテストシナリオは `docs/testing/test-scenarios.md` を参照してください。

---

## トラブルシューティング

### ビルドエラー

**症状**: Vercelでビルドが失敗する

**対処法**:

1. ローカルでビルドが成功するか確認

```bash
npm run build
```

2. エラーメッセージを確認し、該当ファイルを修正
3. 修正後、再度プッシュしてデプロイ

### 認証エラー

**症状**: 「The current domain is not authorized for OAuth operations」

**対処法**:

1. Firebase Console → Authentication → Settings → Authorized domains
2. エラーメッセージに表示されているドメインを追加
3. ページをリロードして再度ログイン

### Firestoreアクセスエラー

**症状**: 「FirebaseError: Missing or insufficient permissions」

**対処法**:

1. Firestoreルールがデプロイされているか確認

```bash
firebase deploy --only firestore:rules
```

2. 環境変数`NEXT_PUBLIC_FIREBASE_PROJECT_ID`が正しいか確認
3. ログインユーザーのUIDとデータのuserIdが一致しているか確認

### 環境変数が読み込まれない

**症状**: Firebase設定がundefinedになる

**対処法**:

1. Vercel Dashboard → Settings → Environment Variables で設定を確認
2. 変数名が`NEXT_PUBLIC_`で始まっているか確認
3. 設定後、再デプロイを実行（環境変数の変更は既存デプロイに反映されない）

```bash
vercel --force
```

### Emulatorに接続しようとする

**症状**: ローカルのEmulatorに接続しようとしてエラー

**対処法**:

1. `NEXT_PUBLIC_USE_EMULATOR`が`false`に設定されているか確認
2. Developmentのみ`true`にするか、変数自体を削除

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| v1 | 2026-02-04 | 初版作成 |
