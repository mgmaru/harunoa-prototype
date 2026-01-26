# バックエンド コーディング規約

> **技術スタック**: Firebase (Authentication, Firestore) / Next.js 14 / TypeScript

---

## 1. アーキテクチャと責務分離

Firebase SDKの呼び出しは `src/services/` 層に集約する。

| レイヤー | 役割 | ルール |
|----------|------|--------|
| UI Components | 表示のみ | ロジックを持たない |
| Hooks | 状態管理 | services を呼び出し、stores に反映 |
| Services | データアクセス | **Firebase SDKを呼ぶ唯一の場所** |
| Firestore | データベース | 永続化層 |

---

## 2. セキュリティ（最優先）

### 2.1 認証・認可チェック

| 場所 | チェック項目 | 必須 |
|------|-------------|:----:|
| Server Actions | 認証確認 | 🔴 |
| Server Actions | 認可（リソース所有者）確認 | 🔴 |
| Server Actions | Zodで入力検証 | 🔴 |
| services/層 | 認証確認（Defense in Depth） | 🔴 |
| Firestoreルール | `request.auth != null` | 🔴 |
| Firestoreルール | `request.auth.uid == resource.data.userId` | 🔴 |

> **重要**: Server Actionsは公開HTTPエンドポイントとして扱われる。Middlewareだけでの認証は不十分。

### 2.2 機密情報の取り扱い

| ❌ 禁止 | ✅ 正しい方法 |
|--------|--------------|
| APIキーをコードに埋め込む | 環境変数を使用 |
| .envファイルをGitにコミット | .gitignoreに追加 |
| エラー詳細をクライアントに返す | 汎用メッセージのみ返す |

---

## 3. services/層

### 3.1 基本原則

| 原則 | 説明 |
|------|------|
| 単一責任 | 1ファイルは1つのエンティティのみ扱う |
| Firebase依存の集約 | SDK呼び出しはservices/層に限定 |
| 型安全性 | すべての関数に戻り値の型を明示 |

### 3.2 ファイル構成

```
src/services/
├── auth.ts           # 認証
├── projects.ts       # プロジェクトCRUD
├── sessions.ts       # セッションCRUD
├── presets.ts        # プリセットCRUD
└── analytics.ts      # 集計クエリ
```

### 3.3 命名規則

| 種別 | 規則 | 例 |
|------|------|-----|
| ファイル名 | 複数形のケバブケース | `projects.ts` |
| 関数名 | 動詞 + 名詞（キャメルケース） | `getProject`, `createSession` |
| CRUD関数 | `get`, `create`, `update`, `delete` | `getProjects`, `updateProject` |
| 単体取得 | `getXxx` + `ById` | `getProjectById` |

### 3.4 型定義

| 型 | 用途 |
|----|------|
| `XxxDocument` | Firestoreに保存される形式（Timestamp型） |
| `Xxx` | アプリケーションで使用する形式（Date変換済み） |
| `CreateXxxInput` | 作成時の入力データ |
| `UpdateXxxInput` | 更新時の入力データ（Partial） |

### 3.5 アンチパターン

| ❌ 禁止 | ✅ 正しい方法 |
|--------|--------------|
| any型を使う | 具体的な型を定義 |
| エラーを握りつぶす | 適切にthrowまたはログ出力 |
| Firebase SDKをコンポーネントで呼ぶ | services/層を経由 |
| services/層でUIロジックを書く | hooks/やcomponents/で実装 |

---

## 4. Firestore設計

### 4.1 設計原則

| 項目 | ルール |
|------|--------|
| ネスト | 原則1階層まで |
| ID生成 | `addDoc()`で自動生成を基本 |
| 日付 | `serverTimestamp()`を使用 |
| 更新 | 一部更新には`updateDoc`を使用（`setDoc`は上書き） |

### 4.2 クエリ

| ルール | 説明 |
|--------|------|
| `limit()`必須 | リスト取得時は必ず設定。全件取得は禁止 |
| 複合インデックス | `where`を複数使う場合、コンソールから作成 |

### 4.3 ドキュメントID

| ❌ 避ける | ✅ 推奨 |
|----------|---------|
| `.`, `..` | 自動生成ID |
| スラッシュ含む | スラッシュなし |
| 連番（1, 2, 3...） | ランダムID（ホットスポット回避） |

### 4.4 Timestamp変換

services/層で`Timestamp` → `Date`に変換し、コンポーネントが直接扱わないようにする。

---

## 5. エラーハンドリング

### 5.1 基本ルール

| ルール | 説明 |
|--------|------|
| async/await使用 | `.then().catch()`チェーンは避ける |
| try/catch必須 | services/層のメソッドは必ずエラーハンドリング |
| ログ出力 | `console.error`で詳細情報を出力 |

### 5.2 エラーの種類と対処

| エラー種別 | 対処方法 |
|-----------|----------|
| 認証エラー | ログインページへリダイレクト |
| 認可エラー | 403エラーを返す |
| バリデーションエラー | フィールド単位でエラーを返す |
| ネットワークエラー | リトライまたはオフラインキュー |
| 想定外エラー | ログ記録 + 汎用メッセージ表示 |

### 5.3 レイヤー別の処理

| レイヤー | 方針 |
|---------|------|
| services/層 | エラーをthrowする |
| hooks/層 | エラーを状態として管理 |

---

## 6. Server Actions / Route Handlers

### 6.1 Server Actions

| チェック項目 | 説明 |
|-------------|------|
| 認証確認 | ユーザーがログインしているか |
| 認可確認 | リソースへのアクセス権があるか |
| 入力検証 | Zodでバリデーション |

### 6.2 Route Handlers

| ルール | 説明 |
|--------|------|
| HTTPメソッド | GET（取得）, POST（作成）, PUT/PATCH（更新）, DELETE（削除） |
| ステータスコード | 200, 201, 400, 401, 404, 500 を正しく返す |
| レスポンス形式 | `{ data: ... }` または `{ error: { message, code } }` |

---

## 7. トランザクションとバッチ

| 手法 | 使い分け |
|------|----------|
| `writeBatch` | 複数書き込みをアトミックに。読み取りに依存しない場合 |
| `runTransaction` | 「現在値を読んでから更新」する場合（カウンタ等） |

---

## クイックリファレンス

### ✅ やること

- Firebase SDKは`services/`層でのみ呼び出す
- Server Actionsで認証・認可・入力検証を行う
- すべての関数に戻り値の型を明示する
- `async/await` + `try/catch`でエラーハンドリング
- クエリには`limit()`を設定する
- `Timestamp` → `Date`変換はservices/層で行う
- CRUD関数は`get`, `create`, `update`, `delete`で始める

### ❌ やらないこと

- コンポーネントでFirebase SDKを直接呼ぶ
- `any`型を使う
- エラーを握りつぶす（空配列を返す等）
- Middlewareだけで認証を済ませる
- 全件取得（`limit()`なしのクエリ）
- APIキーやエラー詳細をクライアントに露出
- ドキュメントIDに`.`, `..`, `/`を使う
