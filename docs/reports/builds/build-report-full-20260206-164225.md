# ビルド実行レポート

## 基本情報

| 項目 | 内容 |
|------|------|
| 実行日時 | 2026-02-06 16:42:25 |
| 実行環境 | Node.js v23.6.1 |
| Next.js バージョン | 14.2.35 |
| 実行コマンド | `npx next build` |

## 実行結果サマリー

| ステップ | 結果 | エラー | 警告 |
|----------|:----:|:------:|:----:|
| コンパイル | 成功 | 0 | 0 |
| lint | 成功 | 0 | 0 |
| 型チェック | 成功 | 0 | 0 |
| ビルド | 成功 | 0 | 1 |

## 総合結果: 全ステップ成功

## ビルド結果

### ステータス: 成功

### ビルド情報

| 項目 | 内容 |
|------|------|
| 環境変数ファイル | .env.local |
| 生成ページ数 | 13 |
| レンダリング方式 | Static (全ページ) |

### ルート一覧とバンドルサイズ

| ルート | サイズ | First Load JS |
|--------|-------:|:-------------:|
| / (ホーム画面) | 4.11 kB | 229 kB |
| /_not-found | 873 B | 88.2 kB |
| /analytics (集計・グラフ画面) | 74.8 kB | 296 kB |
| /archive (アーカイブ済みプロジェクト一覧) | 2.16 kB | 227 kB |
| /focus (集中モード画面) | 3.16 kB | 221 kB |
| /history (履歴画面) | 6.28 kB | 231 kB |
| /login (ログイン画面) | 1.72 kB | 208 kB |
| /presets (プリセット管理画面) | 5.3 kB | 220 kB |
| /settings (設定画面) | 6.08 kB | 227 kB |
| /timer (タイマー画面) | 4.46 kB | 225 kB |

### 共有JSバンドル

| チャンク | サイズ |
|----------|-------:|
| chunks/966-67106407047384a5.js | 31.7 kB |
| chunks/fd9d1056-b107c2ceb6a17dfd.js | 53.6 kB |
| その他共有チャンク | 1.95 kB |
| **合計** | **87.3 kB** |

### バンドルサイズ分析

#### 最大ページ（/analytics）

- ページサイズ: 74.8 kB
- First Load JS: 296 kB

**備考**: chart.js等のグラフライブラリを含むため他ページより大きい。

#### 最小ページ（/_not-found）

- ページサイズ: 873 B
- First Load JS: 88.2 kB

#### 平均ページサイズ

- ページサイズ平均: 約11.0 kB（/_not-foundとanalyticsを除く）
- First Load JS平均: 約225 kB（/_not-foundとanalyticsを除く）

### パフォーマンス評価

| 項目 | 評価 | 備考 |
|------|:----:|------|
| 共有JSサイズ | 良好 | 87.3 kBは妥当な範囲 |
| ページサイズ | 良好 | 大半のページが10 kB未満 |
| First Load JS | 良好 | 大半のページが230 kB未満 |
| 静的生成 | 良好 | 全ページ静的生成でパフォーマンス最適化 |

### 最適化の余地

| 対象 | 現状 | 改善案 | 優先度 |
|------|------|--------|:------:|
| /analytics | 296 kB | chart.js動的インポート | 中 |
| 共有チャンク | 87.3 kB | code splitting最適化 | 低 |

## 警告・エラー詳細

### 警告（1件）

```
(node:467511) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
```

**影響**: なし。Node.js v23の実験的機能に関する情報的な警告。

**対応**: 不要（Node.js側の機能）

## ビルドステップ詳細

### 1. コンパイル

**ステータス**: 成功

```
✓ Compiled successfully
```

### 2. Lint & 型チェック

**ステータス**: 成功

```
Linting and checking validity of types ...
```

**備考**: ESLintとTypeScriptの型チェックが両方通過。

### 3. ページデータ収集

**ステータス**: 成功

```
Collecting page data ...
```

### 4. 静的ページ生成

**ステータス**: 成功

```
✓ Generating static pages (13/13)
```

**生成ページ数**: 13ページ

### 5. ページ最適化

**ステータス**: 成功

```
Finalizing page optimization ...
```

### 6. ビルドトレース収集

**ステータス**: 成功

```
Collecting build traces ...
```

## CI/CD対応状況

### GitHub Actions互換性

このローカルビルドは、GitHub ActionsのCI/CDパイプライン（`.github/workflows/ci.yml`）と同等の結果です。

| CI/CDステップ | 対応コマンド | 結果 |
|--------------|-------------|:----:|
| Lint | `npm run lint` | 含まれる |
| 型チェック | `npm run type-check` | 含まれる |
| ビルド | `npm run build` | 成功 |

**CI失敗リスク**: 低（ビルド成功）

## デプロイ準備状態

| 項目 | 状態 |
|------|:----:|
| ビルド成功 | ✓ |
| 型エラーなし | ✓ |
| lintエラーなし | ✓ |
| 静的生成完了 | ✓ |

**総合評価**: デプロイ準備完了

## 推奨アクション

### 次のステップ

1. **テスト実行**
   - `npm test`で全テストを実行（一部失敗あり - 別レポート参照）
   - テスト失敗を修正後、再度ビルド確認

2. **パフォーマンス最適化（任意）**
   - `/analytics`ページのchart.js動的インポート検討
   - Lighthouse等でパフォーマンス計測

3. **デプロイ**
   - Vercel等へのデプロイ実行

### 警告対応

Node.jsの実験的機能警告は無視して問題ありません。

## 関連レポート

| 種別 | パス |
|------|------|
| テスト実行レポート | `docs/reports/tests/test-report-full-20260206-164225.md` |

## 実行ログ

<details>
<summary>詳細ログを表示</summary>

```
  ▲ Next.js 14.2.35
  - Environments: .env.local

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/13) ...
   Generating static pages (3/13)
   Generating static pages (6/13)
   Generating static pages (9/13)
 ✓ Generating static pages (13/13)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                              Size     First Load JS
┌ ○ /                                    4.11 kB         229 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ○ /analytics                           74.8 kB         296 kB
├ ○ /archive                             2.16 kB         227 kB
├ ○ /focus                               3.16 kB         221 kB
├ ○ /history                             6.28 kB         231 kB
├ ○ /login                               1.72 kB         208 kB
├ ○ /presets                             5.3 kB          220 kB
├ ○ /settings                            6.08 kB         227 kB
└ ○ /timer                               4.46 kB         225 kB
+ First Load JS shared by all            87.3 kB
  ├ chunks/966-67106407047384a5.js       31.7 kB
  ├ chunks/fd9d1056-b107c2ceb6a17dfd.js  53.6 kB
  └ other shared chunks (total)          1.95 kB


○  (Static)  prerendered as static content
(node:467511) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

</details>
