---
name: review-pr
description: |
  Pull Requestの品質チェック（テスト・ビルド・lint・型チェック）とAIによるコードレビューを実行する。
  任意のリポジトリで使用可能な汎用Skill。
  Use when: (1) PRをマージする前に品質を確認したい時、(2) PRの変更内容をレビューしたい時、(3) テスト・ビルドが通るか確認したい時。
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(gh *), Bash(git *), Bash(npm *), Bash(npx *), Bash(pnpm *), Bash(yarn *), Bash(bun *), Bash(cargo *), Bash(make *), Bash(go *), Bash(python *), Bash(pip *)
argument-hint: "[PR番号] または空（現在のブランチのPR）"
---

# Pull Request レビュー

`$ARGUMENTS` に基づいて PR の品質チェックとコードレビューを実行する。

---

## 手順

### Step 1: PR の特定

#### $ARGUMENTS に PR 番号がある場合

```bash
gh pr view $ARGUMENTS --json number,title,body,headRefName,baseRefName,labels,additions,deletions,changedFiles
```

#### $ARGUMENTS が空の場合

現在のブランチに紐づく PR を取得する:

```bash
gh pr view --json number,title,body,headRefName,baseRefName,labels,additions,deletions,changedFiles
```

PR が見つからない場合は、オープンな PR 一覧を表示してユーザーに選択を求める:

```bash
gh pr list --state open --json number,title,headRefName,createdAt --limit 20
```

---

### Step 2: PR の概要を表示

PR の基本情報を整理して表示する:

```
PR #{番号}: {タイトル}
  ブランチ: {headRefName} → {baseRefName}
  変更: +{additions} -{deletions}（{changedFiles} ファイル）
```

---

### Step 3: 自動チェックの実行

#### 3.1 PR ブランチへの切り替え

```bash
gh pr checkout {番号}
```

#### 3.2 チェック項目の検出

プロジェクトの設定ファイルから利用可能なチェックコマンドを自動検出する:

- `package.json` の `scripts` セクション（Node.js）
- `Cargo.toml`（Rust）
- `Makefile`（make ベース）
- `pyproject.toml` / `setup.py`（Python）
- `go.mod`（Go）

#### 3.3 チェックの実行

検出したコマンドを順に実行する:

| チェック | コマンド例 | 目的 |
|---------|-----------|------|
| テスト | `npm test`, `cargo test`, `go test ./...` | 既存機能が壊れていないか |
| ビルド | `npm run build`, `cargo build`, `go build ./...` | コンパイル・バンドルが通るか |
| lint | `npm run lint`, `cargo clippy` | コードスタイル・潜在的問題 |
| 型チェック | `npm run type-check`, `tsc --noEmit` | 型の整合性 |

該当するコマンドが存在しない項目はスキップし、「N/A」と表示する。

---

### Step 4: コード差分の分析

#### 4.1 差分の取得

```bash
gh pr diff {番号}
```

#### 4.2 関連 Issue の取得

PR の本文から `Closes #番号` や `Fixes #番号` を検出し、関連 Issue を取得する:

```bash
gh issue view {番号} --json number,title,body,labels
```

#### 4.3 AI によるレビュー

以下の観点で差分を分析する:

| 観点 | チェック内容 |
|------|-------------|
| **Issue との整合性** | PR の変更が関連 Issue の要求を満たしているか |
| **意図しない変更** | 修正対象外のファイルが変更されていないか |
| **セキュリティ** | 脆弱性を新たに作り込んでいないか（入力検証、認証、機密情報の露出等） |
| **コード品質** | 重複コード、不要な複雑さ、命名の不適切さがないか |
| **テストの十分性** | 変更に対応するテストが追加されているか |

---

### Step 5: レビュー結果の表示

全チェック結果とレビューを以下の形式でまとめて表示する:

```
====================================
  PR #{番号} レビュー結果
====================================

## 自動チェック

| チェック    | 結果 |
|------------|------|
| テスト      | PASS / FAIL / N/A |
| ビルド      | PASS / FAIL / N/A |
| lint        | PASS / FAIL / N/A |
| 型チェック   | PASS / FAIL / N/A |

## コードレビュー

### Issue との整合性
（分析結果）

### 意図しない変更
（分析結果）

### セキュリティ
（分析結果）

### コード品質
（分析結果）

### テストの十分性
（分析結果）

## 総合判定

PASS: マージ可能 / WARN: 軽微な指摘あり / FAIL: 修正が必要
（理由の説明）
```

---

### Step 6: 次のアクションの提示

レビュー結果に基づいて、次のアクションを提示する:

#### 総合判定が PASS の場合

> 全チェック PASS、レビュー上の問題もありません。
>
> 1. **マージする** — `gh pr merge {番号} --merge`
> 2. **もう少し確認する** — 特定の箇所を詳しく見ます

#### 総合判定が WARN の場合

> 軽微な指摘があります。確認してください。
>
> 1. **指摘を修正する** — 修正を実施してコミットします
> 2. **このままマージする** — 指摘を許容してマージします
> 3. **PR を閉じる** — `gh pr close {番号}`

#### 総合判定が FAIL の場合

> 修正が必要な問題があります。
>
> 1. **自動修正する** — 可能な範囲で修正を実施します
> 2. **手動で対応する** — 問題箇所の詳細を表示します
> 3. **PR を閉じる** — `gh pr close {番号}`

**いずれの場合も、マージや閉じる操作はユーザーの明示的な指示があった場合のみ実行する。**

---

## 注意事項

- `gh` CLI が未認証の場合は `gh auth login` の実行を案内する
- マージ操作は必ずユーザーの明示的な指示を得てから実行する
- チェックコマンドが存在しない項目は「N/A」として扱い、FAIL にはしない
- 元のブランチに戻す操作は行わない（ユーザーがレビュー後に判断する）
- プロジェクト固有のコーディング規約（CLAUDE.md や skills）がある場合は、レビュー時にそれらの基準も適用する
