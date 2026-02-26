---
name: fix-issue
description: |
  GitHub Issueを取得・分析し、バグ修正や機能追加を実装してコミットまで自動実行する。
  任意のリポジトリで使用可能な汎用Skill。
  Use when: (1) GitHub Issueに基づいてバグを修正したい時、(2) GitHub Issueの機能要望を実装したい時、(3) 未対応のIssueを一覧表示して選択したい時。
disable-model-invocation: true
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(gh *), Bash(git *), Bash(npm *), Bash(npx *), Bash(pnpm *), Bash(yarn *), Bash(bun *), Bash(cargo *), Bash(make *), Bash(go *), Bash(python *), Bash(pip *)
argument-hint: "[Issue番号] または空（一覧から選択）"
---

# GitHub Issue 自動修正

`$ARGUMENTS` に基づいて GitHub Issue を取得・分析し、修正を実装する。

---

## 手順

### Step 1: Issue の特定

#### $ARGUMENTS に Issue 番号がある場合

`gh issue view` で詳細を取得する:

```bash
gh issue view $ARGUMENTS --json number,title,body,labels,assignees,comments
```

#### $ARGUMENTS が空の場合

オープンな Issue 一覧を取得し、ユーザーに選択を求める:

```bash
gh issue list --state open --json number,title,labels,createdAt --limit 20
```

一覧を整形して表示し、修正する Issue 番号をユーザーに確認する。

---

### Step 2: Issue の分析

取得した Issue の内容を分析し、以下を整理してユーザーに提示する:

1. **問題の要約**: Issue の内容を1〜2文で要約
2. **種別の判定**: バグ修正 / 機能追加 / リファクタリング / その他
3. **修正方針**: 具体的にどのファイル・ロジックを変更するか
4. **影響範囲**: 変更が影響する箇所の概要
5. **テスト方針**: どのようにテストで検証するか

分析にあたっては、コードベースを十分に調査する:
- `Glob` と `Grep` でプロジェクト構造と関連ファイルを特定する
- `Read` で関連コードを読み、ロジックを理解する
- Issue のコメント欄に追加情報があれば活用する

**分析結果をユーザーに提示し、承認を得てから Step 3 に進む。**

---

### Step 3: ブランチ作成

修正用ブランチを作成する:

```bash
# 最新のデフォルトブランチから分岐
git checkout main && git pull origin main
git checkout -b fix/issue-{番号}
```

ブランチ名の規則:
- バグ修正: `fix/issue-{番号}`
- 機能追加: `feat/issue-{番号}`
- リファクタリング: `refactor/issue-{番号}`

**注意**: デフォルトブランチが `main` でない場合は、`gh repo view --json defaultBranchRef` で確認する。

---

### Step 4: 実装

Issue の内容と分析結果に基づいて修正を実装する。

#### 実装時のルール

- **プロジェクトの CLAUDE.md やコーディング規約に必ず従う**（自動読み込みされる）
- 修正は最小限かつ的確に行う。関係ないコードを変更しない
- 既存のコードスタイル（インデント、命名、構造）に合わせる
- セキュリティ上の問題を新たに作り込まない
- 必要に応じてテストも追加・修正する

#### テスト実行

プロジェクトにテスト環境がある場合、修正後にテストを実行する:

```bash
# package.json の scripts を確認し、適切なテストコマンドを実行
# 例: npm test, npm run test, pnpm test, yarn test, cargo test, go test ./..., etc.
```

テストが失敗した場合は修正し、全て通るまで繰り返す。

---

### Step 5: コミット

変更内容をコミットする。

```bash
git add {変更したファイル}
git commit -m "$(cat <<'EOF'
fix: Issue内容の要約 (#番号)

- 変更点1
- 変更点2

Closes #番号

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

コミットメッセージの規則:
- Conventional Commits 形式（`fix:`, `feat:`, `refactor:` 等）
- プロジェクト固有のコミット規約がある場合はそちらに従う
- タイトルに Issue 番号を含める
- `Closes #番号` で Issue の自動クローズを設定

---

### Step 6: PR 作成前チェック

コミット完了後、PR を作成する**前に**以下の品質チェックを実行する。

#### 6.1 チェック項目の検出

プロジェクトの設定ファイルから、利用可能なチェックコマンドを自動検出する:

```bash
# package.json の scripts を確認（Node.js プロジェクトの場合）
# Cargo.toml を確認（Rust プロジェクトの場合）
# Makefile を確認（make ベースのプロジェクトの場合）
# etc.
```

#### 6.2 チェックの実行

検出したコマンドを順に実行する。代表的なチェック項目:

| チェック | コマンド例 | 目的 |
|---------|-----------|------|
| テスト | `npm test`, `cargo test`, `go test ./...` | 既存機能が壊れていないか |
| ビルド | `npm run build`, `cargo build`, `go build ./...` | コンパイル・バンドルが通るか |
| lint | `npm run lint`, `cargo clippy` | コードスタイル・潜在的問題 |
| 型チェック | `npm run type-check`, `tsc --noEmit` | 型の整合性 |

**全チェック PASS の場合**: Step 7 に進む。

**いずれかが FAIL の場合**:
1. エラー内容を分析し、修正を実施する
2. 再度全チェックを実行する
3. 全て PASS するまで繰り返す（最大 3 回）
4. 3 回で解決しない場合は、エラー内容をユーザーに報告して判断を仰ぐ

#### 6.3 チェック結果の表示

全チェックの結果をまとめて表示する:

```
PR 作成前チェック結果:
  テスト:    PASS
  ビルド:    PASS
  lint:      PASS
  型チェック: PASS
```

---

### Step 7: 次のアクションの確認

全チェック PASS 後、ユーザーに次のアクションを確認する:

> 全チェックが PASS しました。次にどうしますか？
>
> 1. **PR を作成する** — ブランチを push して Pull Request を作成します
> 2. **追加修正する** — 変更内容を調整します
> 3. **ここで終了** — コミットまでで完了とします

#### PR 作成を選択した場合

```bash
git push -u origin {ブランチ名}
gh pr create \
  --title "fix: Issue内容の要約" \
  --body "$(cat <<'EOF'
## Summary
- 変更内容の要約

Closes #{番号}

## Quality checks
- [x] テスト: PASS
- [x] ビルド: PASS
- [x] lint: PASS
- [x] 型チェック: PASS

## Test plan
- [ ] テスト項目

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

PR の URL を表示して完了。

---

## 注意事項

- `gh` CLI が未認証の場合は `gh auth login` の実行を案内する
- **Step 2 の分析結果**と **Step 7 の次のアクション**で必ずユーザー確認を取る
- 破壊的な操作（ファイル削除、大規模リファクタリング等）は事前にユーザーに警告する
- リポジトリのデフォルトブランチは `main` と限らない。不明な場合は `gh repo view` で確認する
- コミットメッセージは、プロジェクト固有の規約（CLAUDE.md や skills）があればそちらを優先する
- Issue のラベルやコメントも参考にして、修正の優先度や方針を判断する
