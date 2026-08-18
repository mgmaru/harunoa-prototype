---
name: update-issue
description: |
  作成済みのGitHub Issueを、変更種別（補足・訂正・再定義・分割・破棄）に応じた作法で更新する。
  経緯はコメント、結論は本文という原則に従い、議論の文脈を失わずにIssueを改善する。
  Use when: (1) Issueの観点がずれていると気づいた時、(2) より良い提案が浮かんだ時、(3) Issueに情報を追記したい時、(4) Issueを分割したい時、(5) Issueの前提が崩れて破棄したい時。
disable-model-invocation: true
allowed-tools: Read, Write, Glob, Grep, Bash(gh issue view *), Bash(gh issue list *), Bash(gh issue edit *), Bash(gh issue comment *), Bash(gh issue create *), Bash(gh issue close *), Bash(gh issue reopen *), Bash(gh label list *), Bash(gh repo view *)
argument-hint: "[Issue番号] [amend|correct|rescope|split|supersede]（種別は省略可）"
---

# GitHub Issue 更新

`$ARGUMENTS` で指定された Issue を、変更種別に応じた作法で更新する。

---

## 基本原則

GitHub は **Issue本文の編集では購読者に通知が飛ばない**が、**コメントでは飛ぶ**。
本文を静かに書き換えると、関係者から見て「最初からそう書いてあった」ことになり、
なぜ方針が変わったのかが失われる。

したがって、このSkillは以下の原則に従う。

| 対象 | 役割 |
|------|------|
| **コメント** | **なぜ**変えるのかという経緯・提案・合意の記録 |
| **本文** | **最終的にどうなったか**という結論 |
| **更新履歴** | 本文末尾に日付と要約を残し、経緯コメントへリンクする |

### 絶対に守ること

- **他人が作成したIssueの本文を、合意なしに編集しない**（提案はコメントで行う）
- **本文の全面書き換えより追記を優先する**（議論の文脈が壊れるため）
- **タイトルの変更は本文以上に慎重に**（検索性と通知に影響する）
- **クローズ理由を使い分ける**（`completed` = 解決した / `not planned` = やらない・破棄）

---

## 手順

### Step 1: Issue の特定と現状把握

Issue番号が指定されている場合、本文・ラベル・コメント・作成者を取得する:

```bash
gh issue view {番号} --json number,title,body,labels,state,author,comments,url
```

Issue番号が省略された場合、オープンなIssue一覧を提示して選択を求める:

```bash
gh issue list --state open --json number,title,labels,updatedAt --limit 20
```

**作成者を必ず確認する**。ログインユーザーと異なる場合、本文編集は行わず提案コメントに留める:

```bash
gh api user --jq .login
```

---

### Step 2: 変更種別の判定

ユーザーの意図とIssueの現状から、以下の5種別のいずれかを判定する。
引数で種別が指定されている場合はそれを優先するが、**明らかに不適切なら理由を添えて再提案する**。

| 種別 | 判断基準 | 本文 | コメント | 新Issue | クローズ |
|------|----------|:----:|:--------:|:-------:|:--------:|
| **amend**（補足） | 情報追加のみ。方針は変わらない | 追記 | 任意 | - | - |
| **correct**（訂正） | typo・リンク切れ・ラベル誤り | 直接編集 | 不要 | - | - |
| **rescope**（再定義） | 観点がずれている／より良い案がある | 更新 | **必須** | - | - |
| **split**（分割） | 複数の関心事が混在している | 追記のみ | **必須** | 作成 | - |
| **supersede**（破棄） | 前提そのものが崩れた | 触らない | **必須** | 作成 | **する** |

**判定結果と根拠をユーザーに提示し、承認を得てから Step 3 に進む。**

判断に迷う場合の指針:
- 「解決策が変わる」なら amend ではなく **rescope**
- 「1つのPRで対応できない粒度」なら **split**
- 「このIssueをそのまま実装しても価値がない」なら **supersede**

---

### Step 3: 種別ごとの実行

#### 3.1 amend（補足）

方針を変えずに情報を追加する。本文の該当セクションに追記し、更新履歴を残す。

```bash
gh issue edit {番号} --body-file {一時ファイル}
```

情報量が多い場合や、他者に知らせる価値がある場合はコメントも併記する:

```markdown
**note:** {追記した内容の要約}
```

#### 3.2 correct（訂正）

事実誤認・typo・ラベル誤りを直す。**内容の意味が変わらない場合のみ**コメント不要。

```bash
gh issue edit {番号} --body-file {一時ファイル}
gh issue edit {番号} --add-label "enhancement" --remove-label "bug"
```

ラベルはリポジトリに存在するものだけを使う:

```bash
gh label list
```

#### 3.3 rescope（再定義）★最も作法が問われる

**必ず「コメントで提案 → 承認 → 本文更新」の順に行う。本文を先に変えない。**

**(1) 提案コメントを投稿する**

Conventional Comments 形式（`suggestion:` / `issue:` / `question:` / `note:`）を使う:

```bash
gh issue comment {番号} --body "$(cat <<'EOF'
**suggestion:** {現在の観点の何が問題かを具体的に}

{より良いと考える方針と、その根拠}

**変更したい点:**
- {変更点1}
- {変更点2}

問題なければ本文を更新します。
EOF
)"
```

**(2) ユーザーの承認を得る**

**(3) 本文を更新し、末尾に更新履歴を追加する**

```markdown
---
## 更新履歴
- YYYY-MM-DD: {変更内容の要約}（[経緯]({コメントのURL})）
```

コメントURLは投稿時の出力から取得する。

#### 3.4 split（分割）

**(1) 分割案をコメントで提示し、承認を得る**

```markdown
**suggestion:** このIssueは以下の独立した関心事を含んでいるため、分割を提案します。

1. {関心事1}
2. {関心事2}

分割後、このIssueはトラッキング用として残します。
```

**(2) 子Issueを作成する**（`create-issue` Skillのテンプレート構成に従う）

各子Issueの本文末尾に親への参照を入れる:

```markdown
Part of #{親番号}
```

**(3) 親Issueの本文にチェックリストを追記する**

```markdown
## 分割タスク
- [ ] #{子番号1} {タイトル}
- [ ] #{子番号2} {タイトル}
```

親Issueの元の内容は**消さずに残す**。

#### 3.5 supersede（破棄）

前提が崩れたIssueを、新しいIssueで置き換える。**元Issueの本文は編集しない**（履歴として残す）。

**(1) 理由をコメントで説明し、承認を得る**

```markdown
**issue:** このIssueの前提である「{前提}」が成立しなくなりました。

理由: {具体的な理由}

新しいIssueを作成し、こちらは `not planned` でクローズすることを提案します。
```

**(2) 新Issueを作成する**（本文末尾に `Supersedes #{元番号}`）

**(3) 元Issueにクローズ理由をコメントし、`not planned` でクローズする**

```bash
gh issue comment {元番号} --body "Superseded by #{新番号}"
gh issue close {元番号} --reason "not planned"
```

**`--reason "completed"` は使わない**。解決していないため。

重複が理由の場合は `duplicate` ラベルを付け、`Duplicate of #{番号}` とコメントする。

---

### Step 4: 結果報告

実行した操作を一覧で報告し、Issue と作成したコメント・新Issue の URL を提示する:

```
更新内容:
  種別:       rescope（再定義）
  コメント:   {コメントURL}
  本文:       更新済み（更新履歴を追加）
  ラベル:     変更なし
  Issue:      {IssueURL}
```

---

## 他Skillとの連携

| 状況 | 連携先 |
|------|--------|
| 新規Issueを作成する | `create-issue` |
| Issueを解決する実装を行う | `fix-issue` |
| `fix-issue` の分析中に前提のずれに気づいた | **このSkill**（rescope）で修正してから実装に戻る |

`fix-issue` の Step 2（Issue分析）で「Issueの観点自体がずれている」と判断した場合、
そのまま実装を進めずに、このSkillでの修正を提案すること。

---

## 注意事項

- `gh` CLI が未認証の場合は `gh auth login` の実行を案内する
- **Step 2 の種別判定**と、**本文を変更する前**に必ずユーザー確認を取る
- 本文の更新は `--body-file` を使う（長文をシェル引数に直接渡さない）
- クローズ済みIssueを更新する場合、まず `gh issue reopen` が必要か確認する
- 更新履歴の日付は実際の日付を使う（推測しない）
- 会話の文脈やコードベースの調査結果を活用し、提案は具体的に記述する
