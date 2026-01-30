---
name: commit-guidelines
description: |
  HaruNoaプロジェクトのGit commit/PR/ブランチ規約を提供する。
  Use when: (1) コミットメッセージを作成する時、(2) git commitを実行する時、(3) PRを作成する時、(4) ブランチを作成する時、(5) /commitコマンドを使用する時。
disable-model-invocation: true
---

# commit-guidelines Skill

HaruNoaプロジェクトのGit運用規約を提供する。

---

## コミットメッセージフォーマット

### 基本形式（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 例

```
feat(timer): add pause/resume functionality

- Add pause button to timer component
- Store elapsed time in Zustand store
- Resume from paused state correctly

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Type一覧

| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能追加 | 新しいコンポーネント、新しいAPI |
| `fix` | バグ修正 | 動作不良の修正、エラー対応 |
| `refactor` | リファクタリング | 動作を変えないコード改善 |
| `test` | テスト追加・修正 | テストファイルの追加・修正 |
| `docs` | ドキュメント変更 | README、コメント、JSDoc |
| `style` | スタイル変更 | フォーマット、セミコロン等 |
| `chore` | ビルド・設定変更 | package.json、設定ファイル |
| `perf` | パフォーマンス改善 | 最適化、高速化 |

---

## Scope一覧（HaruNoa固有）

| Scope | 対象 |
|-------|------|
| `auth` | 認証機能（login, logout, session） |
| `project` | プロジェクト管理 |
| `timer` | タイマー機能 |
| `history` | 履歴・セッション管理 |
| `analytics` | 集計・グラフ |
| `settings` | 設定画面 |
| `preset` | プリセット機能 |
| `ui` | 共通UIコンポーネント |
| `layout` | レイアウトコンポーネント |
| `store` | Zustandストア |
| `service` | services層 |
| `hook` | カスタムフック |
| `type` | 型定義 |
| `config` | 設定ファイル |
| `deps` | 依存関係 |

---

## Subject（件名）のルール

| ルール | 例 |
|--------|-----|
| 50文字以内 | ✅ `add project creation form` |
| 小文字で開始 | ✅ `add...` / ❌ `Add...` |
| 命令形（動詞原形） | ✅ `add` / ❌ `added`, `adding` |
| ピリオドで終わらない | ✅ `add feature` / ❌ `add feature.` |
| 「何を」ではなく「何をする」 | ✅ `add timer pause button` |

### 良いsubjectの例

```
feat(timer): add pause/resume functionality
fix(auth): resolve session persistence issue
refactor(project): extract color picker component
test(hook): add useTimer unit tests
docs(readme): update installation instructions
```

### 悪いsubjectの例

```
❌ feat(timer): Added pause button.        # 過去形、ピリオド
❌ fix: bug fix                            # 曖昧、scopeなし
❌ Update code                             # typeなし、大文字開始
❌ feat(timer): add pause/resume functionality to timer component  # 長すぎる
```

---

## Body（本文）のルール

| ルール | 説明 |
|--------|------|
| 空行でsubjectと分離 | 必須 |
| 72文字で折り返し | 読みやすさのため |
| 「Why」を説明 | 「What」はdiffでわかる |
| 箇条書きは`-`を使用 | 一貫性のため |

### 例

```
feat(analytics): add weekly summary chart

- Display total work hours per day in bar chart
- Calculate average daily hours for the week
- Add export functionality for chart data

Weekly view helps users track their productivity patterns
and identify peak working days.

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## ブランチ命名規則

### 形式

```
<type>/<issue-number>-<short-description>
```

### 例

| Type | 例 |
|------|-----|
| feature | `feature/42-add-timer-pause` |
| fix | `fix/55-auth-session-bug` |
| refactor | `refactor/60-extract-color-picker` |
| test | `test/65-timer-unit-tests` |
| docs | `docs/70-update-readme` |
| chore | `chore/75-update-dependencies` |

### ルール

- すべて小文字
- 単語はハイフン区切り
- 20文字以内（説明部分）
- issue番号がない場合は省略可

---

## PRテンプレート

```markdown
## 概要
<!-- 変更の概要を1-2文で -->

## 変更内容
<!-- 主な変更点を箇条書きで -->
-
-
-

## テスト
<!-- 実施したテスト -->
- [ ] ユニットテスト追加/更新
- [ ] 手動テスト実施
- [ ] 既存テストがパス

## スクリーンショット
<!-- UIの変更がある場合 -->

## チェックリスト
- [ ] コードスタイルに準拠
- [ ] 型エラーなし（`npm run type-check`）
- [ ] Lintエラーなし（`npm run lint`）
- [ ] テストパス（`npm test`）
```

---

## コミット作成手順

### 1. 変更内容を確認

```bash
git status
git diff --staged
```

### 2. 変更をステージング

```bash
# 特定ファイルを追加（推奨）
git add src/components/features/timer/TimerControls.tsx

# 関連ファイルをまとめて追加
git add src/components/features/timer/
```

### 3. コミットメッセージを作成

```bash
git commit -m "$(cat <<'EOF'
feat(timer): add pause/resume functionality

- Add pause button to timer component
- Store elapsed time in Zustand store
- Resume from paused state correctly

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## コミット単位のガイドライン

| 単位 | 説明 |
|------|------|
| 1機能 = 1コミット | 論理的にまとまった変更 |
| テストは実装と一緒に | 別コミットにしない |
| リファクタリングは分離 | 機能追加と混ぜない |
| フォーマット修正は分離 | ロジック変更と混ぜない |

### 良いコミット単位

```
commit 1: feat(timer): add pause/resume functionality
commit 2: refactor(timer): extract timer display component
commit 3: style(timer): format timer components
```

### 悪いコミット単位

```
commit 1: add pause button and refactor and fix bug and format  # 混在
commit 2: WIP                                                     # 意味不明
commit 3: fix                                                     # 情報不足
```

---

## 禁止事項

| 禁止 | 理由 |
|------|------|
| `git add -A` / `git add .` | 意図しないファイルを含む可能性 |
| `--no-verify` | pre-commit hookをスキップしない |
| `--force` push | 履歴を破壊する |
| `.env`ファイルのコミット | 機密情報の漏洩 |
| 空コミット（変更なし） | 履歴が汚れる |
| `WIP`のままのコミット | 意味のある説明が必要 |

---

## チェックリスト

コミット前に確認すること：

- [ ] `git status`で意図したファイルのみステージングしたか
- [ ] `git diff --staged`で変更内容を確認したか
- [ ] コミットメッセージはConventional Commits形式か
- [ ] subjectは50文字以内、命令形、小文字開始か
- [ ] 機密情報（.env, credentials）を含んでいないか
- [ ] 型チェック・Lintがパスするか
- [ ] テストがパスするか
