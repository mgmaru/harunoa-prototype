---
name: frontend-standards
description: |
  HaruNoaプロジェクトのフロントエンドコーディング規約を提供。React/TypeScript/Tailwind CSSの実装パターンとルールを適用する。
  Use when: (1) フロントエンドコンポーネントを実装する時、(2) React/Hooks/TypeScriptのコードを書く時、(3) UIスタイリングを行う時、(4) src/components/配下のファイルを編集する時、(5) src/app/配下のページを実装する時。
---

# フロントエンド コーディング規約

> **技術スタック**: Next.js 14 (App Router) / TypeScript / Tailwind CSS / Zustand

---

## 1. 変数・定数

| ルール | 説明 |
|--------|------|
| `const` のみ使用 | `let`, `var` は禁止 |
| 不変性を守る | 配列・オブジェクトは直接変更せず、新しいものを作成 |
| 定数の配置 | ファイル上部、または `lib/constants.ts` に集約 |

```typescript
// ✅ 新しい配列・オブジェクトを作成
const newProjects = [...projects, newProject];
const updatedUser = { ...user, name: 'Hanako' };
```

---

## 2. 関数

| ルール | 説明 |
|--------|------|
| 引数3つ以上はオブジェクト化 | 可読性向上のため |
| 早期リターン推奨 | ネストを減らし、フラットに保つ |

---

## 3. TypeScript

| ルール | 説明 |
|--------|------|
| 型定義は `type` を使用 | `interface` は使用しない |
| `any` 禁止 | `unknown` + 型ガードで対応 |
| 型アサーション (`as`) 禁止 | 型ガード関数を使用 |
| 厳密比較 (`===`) を使用 | `==` は禁止 |

---

## 4. React ルール

| ルール | 説明 |
|--------|------|
| コンポーネントは純粋に保つ | 同じ props → 常に同じ結果 |
| レンダー中に副作用を起こさない | API呼び出し、console.log 等は `useEffect` で |
| Props / State を直接変更しない | 新しい値を作成して `setState` |
| 関数コンポーネントのみ使用 | クラスコンポーネントは禁止 |

---

## 5. Hooks ルール

| ルール | 理由 |
|--------|------|
| トップレベルでのみ呼び出す | React が呼び出し順序を追跡するため |
| 条件分岐・ループ内で呼び出さない | 順序が変わるとバグになる |
| `useEffect` は最小限に | 不要な場合はレンダー中に計算 |

---

## 6. コンポーネント設計

| ファイルサイズ | 対応 |
|---------------|------|
| 〜200行 | ✅ 適切 |
| 200〜500行 | ⚠️ 分割を検討 |
| 500行〜 | ❌ 必ず分割 |

| ルール | 説明 |
|--------|------|
| 名前付きエクスポート | `export const Component = ...` |
| default export | `page.tsx`, `layout.tsx` 等のみ例外的に使用 |

```typescript
// ✅ 推奨
export const ProjectCard = () => { ... }

// ❌ default exportは page.tsx, layout.tsx のみ
```

---

## 7. Tailwind CSS

| ルール | 説明 |
|--------|------|
| CSS ファイルに直接書かない | Tailwind で統一 |
| 色・余白は設定ファイルで管理 | `tailwind.config.ts` |
| `clsx` でクラスを整理 | 条件付きクラスを読みやすく |

---

## クイックリファレンス

### ✅ やること

- `const` のみ使う
- 型を明示的に定義する
- 名前付きエクスポートを使う
- コンポーネントは純粋に保つ
- 早期リターンでネストを減らす
- Tailwind + clsx でスタイリング

### ❌ やらないこと

- `let`, `var` を使う
- `any` を使う
- `as` で型アサーションする
- レンダー中に副作用を起こす
- Props / State を直接変更する
- 500行を超えるファイルを作る
