# CLAUDE.md

HaruNoaプロジェクトのClaude Code向け実装ガイドです。

---

## Project Overview

HaruNoaは、作業時間をプロジェクト単位で記録・可視化するWebアプリケーションです。

**技術スタック**: Next.js 14 (App Router) / TypeScript / Tailwind CSS / Firebase / Zustand / Vitest

---

## Important Notes

### NEVER（絶対禁止）

- NEVER commit `.env` files or credentials
- NEVER call Firebase SDK outside `services/` layer - use services layer
- NEVER use `any` type - prefer `unknown` + type guards
- NEVER exceed 500 lines per file - split into smaller files

### 作業ルール

- 実装・ドキュメント作成は段階的に行い、各段階で承認を得る
- 永続的ドキュメントは原則修正不可。修正時は必ず承認を得る
- 実装指示書は設計変更時に修正可（要承認）
- 実装に迷った時は、そのまま続けずに必ず質問する
- 同じ意図の文章を複数の場所に記載しない
- セキュリティを意識したコーディングを心掛ける
- 実装およびテストは `docs/tasklist.md` を参照しながら進める
- タスクは1つずつ段階的に進める
- タスク完了時は、チェックリストにチェックを記載する
- 実施が難しいタスクがある場合は、そのまま続けずに質問する

---

## Documentation

### ドキュメント種別

| 種別 | 場所 | 役割 | 変更ルール |
|------|------|------|------------|
| 永続的ドキュメント | `docs/` | 設計仕様の定義 | 原則不可（要承認） |
| 実装指示書 | `docs/implementation/` | 実装手順の記載 | 設計変更時は修正可（要承認） |
| テスト仕様書 | `docs/testing/` | テストシナリオ・計画の記載 | 設計変更時は修正可（要承認） |

### 実装指示書

実装は以下の順番で進める（`docs/implementation/`配下）：

| 順番 | ファイル | 機能 |
|:----:|----------|------|
| 0 | `00_setup.md` | プロジェクト初期化 |
| 1 | `01_auth.md` | 認証 |
| 2 | `02_project-management.md` | プロジェクト管理 |
| 3 | `03_timer.md` | タイマー・集中モード |
| 4 | `04_history.md` | 履歴管理 |
| 5 | `05_analytics.md` | 集計・グラフ |
| 6 | `06_settings.md` | 設定 |
| 7 | `07_offline-support.md` | オフライン対応 |
| 8 | `08_pomodoro.md` | ポモドーロ |
| 9 | `09_notification.md` | 通知 |
| 10 | `10_session-archive.md` | セッションアーカイブ |


### 設計変更時の対応

- ドキュメントとコードを同時に更新する
- 修正ドキュメントの影響範囲を特定し、関連ドキュメントも更新する
- 図・表を活用し、簡潔に記載する

### サブエージェントレポート

サブエージェントは分析結果をMarkdownレポートとして `docs/reports/` 配下に保存する。親エージェントは必要に応じてこれらのレポートを参照すること。

#### レポート保存先一覧

| エージェント | 保存先 | 内容 |
|-------------|--------|------|
| build-executor | `docs/reports/builds/` | ビルド・lint・型チェック結果 |
| test-runner | `docs/reports/tests/` | テスト実行結果 |
| test-analyzer | `docs/reports/analysis/` | テスト失敗の原因分析・修正提案 |
| code-reviewer | `docs/reports/reviews/` | コード品質・セキュリティレビュー |
| security-checker | `docs/reports/security/` | セキュリティ脆弱性分析 |
| impact-analyzer | `docs/reports/impacts/` | コード変更の影響範囲分析 |
| dependency-checker | `docs/reports/dependencies/` | npm依存関係・脆弱性分析 |
| log-analyzer | `docs/reports/logs/` | ログ分析・エラーパターン検出 |

※ 各ディレクトリの `latest.md` から最新レポートにアクセス可能

#### レポート参照タイミング

| タイミング | 参照レポート | 目的 |
|------------|--------------|------|
| コード変更前 | `impacts/latest.md` | 影響範囲の事前把握 |
| コード変更後 | `reviews/latest.md` | 品質・セキュリティ確認 |
| テスト失敗時 | `analysis/latest.md` | 失敗原因の特定 |
| ビルド失敗時 | `builds/latest.md` | エラー詳細の確認 |
| CI前の確認 | `builds/latest.md`, `tests/latest.md` | CI失敗の未然防止 |
| セキュリティ監査 | `security/latest.md` | 脆弱性の把握 |
| 依存関係更新時 | `dependencies/latest.md` | 脆弱性・outdated確認 |
| 問題調査時 | `logs/latest.md` | エラーパターン分析 |
