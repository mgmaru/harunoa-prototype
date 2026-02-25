---
name: create-issue
description: |
  GitHubのIssueテンプレート（バグ報告・改善提案・質問）に沿って、Issueを自動作成しGitHubに登録する。
  Use when: (1) バグを発見・報告したい時、(2) 機能追加や改善を提案したい時、(3) 仕様や使い方について質問したい時。
disable-model-invocation: true
allowed-tools: Bash(gh issue create *), Bash(gh issue list *), Bash(gh issue view *)
argument-hint: "[bug|feature|question] [説明]"
---

# GitHub Issue 自動作成

ユーザーの `$ARGUMENTS` に基づいて、プロジェクトのIssueテンプレートに沿ったGitHub Issueを作成する。

---

## 手順

### Step 1: 引数の解析

引数の **最初の単語** でIssue種別を判定する:

| 引数の先頭 | 種別 | ラベル | タイトルプレフィックス |
|------------|------|--------|----------------------|
| `bug` | バグ報告 | `bug` | `[Bug]` |
| `feature` または `enhancement` | 改善提案 | `enhancement` | `[Enhancement]` |
| `question` | 質問 | `question` | `[Question]` |

最初の単語以降を **Issue の内容説明** として使用する。

### Step 2: テンプレートに沿った本文作成

種別ごとに以下のセクション構成で本文を構成する。ユーザーの説明から推測できる情報は埋め、不明な部分は「（未記入）」とする。

#### バグ報告（bug）

```markdown
## バグの概要
{ユーザーの説明から要約}

## 再現手順
1. {推測できる手順、不明なら「（未記入）」}

## 期待する動作
{推測できる期待動作}

## 実際の動作
{ユーザーの説明から抽出}

## 環境
- OS: （未記入）
- ブラウザ / Node.js バージョン: （未記入）
- アプリバージョン: （未記入）

## スクリーンショット・ログ
（なし）
```

#### 改善提案（feature / enhancement）

```markdown
## 概要
{ユーザーの説明から要約}

## 背景・動機
{推測できる背景}

## 提案する解決策
{ユーザーの説明から抽出}

## 代替案
（未記入）

## 補足情報
（なし）
```

#### 質問（question）

```markdown
## 質問内容
{ユーザーの説明から抽出}

## 試したこと
（未記入）

## 関連するドキュメント・Issue
（未記入）
```

### Step 3: 確認

Issue を作成する **前に**、以下をユーザーに表示して確認を求める:

- 種別（バグ / 改善提案 / 質問）
- タイトル
- ラベル
- 本文の全文

ユーザーの承認を得てから次のステップに進む。修正要望があれば反映する。

### Step 4: Issue 作成

`gh issue create` コマンドで Issue を作成する:

```bash
gh issue create \
  --title "[Bug] タイトル" \
  --label "bug" \
  --body "$(cat <<'EOF'
本文をここに
EOF
)"
```

### Step 5: 結果報告

作成された Issue の URL を表示する。

---

## 注意事項

- タイトルは簡潔に（50文字以内推奨）
- 本文は必ず対応するテンプレートのセクション構成に従う
- `gh` CLI が未認証の場合は `gh auth login` の実行を案内する
- Issue 作成前に必ずユーザーの確認を取る（自動で作成しない）
- 会話の文脈やコードベースの情報を活用して、できるだけ具体的な内容を記載する
