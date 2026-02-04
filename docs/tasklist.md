# HaruNoa 開発チェックリスト

実装からシステムテストまでの進捗管理用チェックリスト。

---

## Phase 1: プロジェクトセットアップ（00_setup.md）

- [x] Next.jsプロジェクト作成
- [x] 依存パッケージインストール
- [x] 環境変数設定（.env.local）
- [x] Firebase初期化（src/lib/firebase/config.ts）
- [x] ディレクトリ構造作成
- [x] Tailwind設定
- [x] 基本レイアウト作成（src/app/layout.tsx）
- [x] 動作確認（npm run dev）

---

## Phase 2: 認証機能（01_auth.md）

- [x] 認証関数の実装（src/services/auth.ts）
- [x] 認証ストアの実装（src/stores/authStore.ts）
- [x] 認証フックの実装（src/hooks/useAuth.ts）
- [x] ログインページの実装（src/app/login/page.tsx）
- [x] 認証レイアウトの実装（src/app/(auth)/layout.tsx）
- [x] ホームページプレースホルダー
- [x] 単体テスト作成（hooks/useAuth）

---

## Phase 3: プロジェクト管理（02_project-management.md）

- [x] プロジェクトAPI実装（src/services/projects.ts）
- [x] カラーパレット定義（src/constants/colors.ts）
- [x] プロジェクトフック（src/hooks/useProjects.ts）
- [x] プロジェクト一覧画面（src/app/(auth)/page.tsx）
- [x] プロジェクト作成モーダル
- [x] プロジェクト編集モーダル
- [x] アーカイブ一覧画面（src/app/(auth)/archive/page.tsx）
- [x] 単体テスト作成（hooks/useProjects）

---

## Phase 4: タイマー・集中モード（03_timer.md）

- [x] タイマーストア（src/stores/timerStore.ts）
- [x] タイマーフック（src/hooks/useTimer.ts）
- [x] 時間フォーマット関数（src/lib/date/format.ts）
- [x] 計測画面（src/app/(auth)/timer/page.tsx）
- [x] 集中モード画面（src/app/(auth)/focus/page.tsx）
- [x] メモオーバーレイ
- [x] 離脱確認モーダル
- [x] 計測切替警告モーダル
- [x] 単体テスト作成（lib/date/format, hooks/useTimer）

### 結合テスト①（03_timer完了後）

| カテゴリ | 件数 | チェック | 備考 |
|---------|:----:|:--------:|------|
| 認証・ルーティング（INT-001〜002） | 2 | [x] | INT-002完全実装済み（直前ページリダイレクト対応） |
| セッション分離（INT-003） | 1 | [x] | サービス層確認済み＋Firestoreルール作成済み |
| 計測・プロジェクト連携（INT-004） | 1 | [x] | 4件のテストでパス |
| 計測・履歴連携（INT-005〜006） | 2 | [x] | 5件のテストでパス（履歴画面Phase 5実装完了） |

**テスト実施日**: 2026-02-01
**テストファイル**: `src/__tests__/integration/core-functions.test.tsx`

---

## Phase 5: 履歴管理（04_history.md）

- [x] セッションAPI実装（src/services/sessions.ts）
- [x] 日付跨ぎ按分ロジック（src/lib/date/session-split.ts）
- [x] 履歴フック（src/hooks/useSessions.ts）
- [x] 履歴画面（src/app/(auth)/history/page.tsx）
- [x] セッション一覧コンポーネント
- [x] セッション編集モーダル
- [x] 日付フィルタ機能
- [x] 単体テスト作成（lib/date/session-split, hooks/useSessions）

---

## Phase 6: 集計・グラフ（05_analytics.md）

- [x] 集計ユーティリティ（src/lib/date/aggregation.ts）
- [x] 集計フック（src/hooks/useAnalytics.ts）
- [x] 棒グラフコンポーネント（BarChart）
- [x] 円グラフコンポーネント（PieChart）
- [x] 集計画面（src/app/(auth)/analytics/page.tsx）
- [x] 期間切替機能（日/週/月/年）
- [x] 単体テスト作成（lib/date/aggregation, hooks/useAnalytics）

---

## Phase 7: 設定（06_settings.md）

- [x] ユーザー設定API（src/services/settings.ts）
- [x] プリセットAPI（src/services/presets.ts）
- [x] アーカイブ済みセッション取得API追加
- [x] CSVエクスポート（src/lib/csv/export.ts）
- [x] 設定フック（src/hooks/useSettings.ts）
- [x] 設定画面（src/app/(auth)/settings/page.tsx）
- [x] エクスポートモーダル
- [x] ログアウトモーダル
- [x] 単体テスト作成（lib/csv/export, hooks/useSettings）

### 結合テスト②（06_settings完了後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| 履歴・集計連携（INT-011〜012） | 2 | [x] |
| プロジェクト・集計連携（INT-013） | 1 | [x] |
| CSV内容確認（INT-014） | 1 | [x] |
| ログアウト時データクリア（INT-015） | 1 | [x] |

**テスト実施日**: 2026-02-01
**テストファイル**: `src/__tests__/integration/data-integrity.test.tsx`

---

## Phase 8: オフライン対応（07_offline-support.md）

- [x] オフライン検知フック（src/hooks/useOffline.ts）
- [x] オフラインキューストア（src/stores/offlineStore.ts）
- [x] 同期サービス（src/services/sync.ts）
- [x] useTimerフックのオフライン対応更新
- [x] 同期トリガーフック（src/hooks/useSync.ts）
- [x] オフラインバナーコンポーネント
- [x] レイアウトへの組み込み
- [x] 単体テスト作成（hooks/useOffline, hooks/useSync, stores/offlineStore）

---

## Phase 9: ポモドーロ（08_pomodoro.md）

- [x] ポモドーロストア（src/stores/pomodoroStore.ts）
- [x] ポモドーロフック（src/hooks/usePomodoro.ts）
- [x] タイマーフックとの統合
- [x] 集中モード画面の更新
- [x] ポモドーロ進捗コンポーネント
- [x] プリセット選択連携
- [x] プリセットフック（src/hooks/usePresets.ts）
- [x] デフォルトプリセット初期化
- [x] プリセット管理画面（src/app/(auth)/presets/page.tsx）
- [x] 単体テスト作成（hooks/usePomodoro, hooks/usePresets）

---

## Phase 10: 通知機能（09_notification.md）

- [x] 通知フック（src/hooks/useNotification.ts）※Phase 9で簡易版を先行実装済み → 本格実装に更新
- [x] トーストストア（src/stores/toastStore.ts）
- [x] トーストコンポーネント（src/components/ui/Toast.tsx）
- [x] 通知バナーコンポーネント（src/components/features/focus/NotificationBanner.tsx）
- [x] 通知設定コンポーネント（src/components/features/settings/NotificationSettings.tsx）
- [x] 通知音ファイル配置（public/sounds/）※プレースホルダー＋README作成
- [x] レイアウトへの組み込み（ToastContainer追加）
- [x] アニメーション追加（globals.css）
- [x] 単体テスト作成（hooks/useNotification, stores/toastStore）

---

## Phase 11: セッション自動アーカイブ（10_session-archive.md）

- [x] アーカイブ実行API追加（src/services/sessions.ts）
- [x] アーカイブ実行フック（src/hooks/useSessionArchive.ts）
- [x] ログイン時の自動アーカイブ実行
- [x] 集計画面でのアーカイブ実行
- [x] 単体テスト作成（hooks/useSessionArchive）

### 結合テスト③（全機能完了後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| ポモドーロ・タイマー連携（INT-021） | 1 | [x] |
| 通知・設定連携（INT-022〜023） | 2 | [x] |
| オフライン計測・同期（INT-024〜025） | 2 | [x] |
| 自動アーカイブ（INT-026〜027） | 2 | [x] |
| 複数端末競合（EDGE-001） | 1 | [x] |
| ブラウザクラッシュ復帰（EDGE-002） | 1 | [x] |
| プリセット削除制約（EDGE-003） | 1 | [x] |
| リトライ上限後動作（EDGE-004） | 1 | [x] |

**テスト実施日**: 2026-02-02
**テストファイル**:
- `src/__tests__/integration/advanced-features.test.tsx` (18件)
- `src/__tests__/integration/edge-cases.test.tsx` (13件)

---

## ステージング環境デプロイ

**デプロイ日**: 2026-02-04
**Production URL**: https://harunoa-prototype.vercel.app
**詳細レポート**: `_local/docs/deployment-report/2026-02-04_staging-deployment.md`

### デプロイ作業

| 作業項目 | チェック |
|---------|:--------:|
| Firebase ルール・インデックスデプロイ | [x] |
| Vercel プロジェクト作成 | [x] |
| GitHub連携設定 | [x] |
| 環境変数設定（7項目） | [x] |
| Firebase認証済みドメイン追加 | [x] |

### 基本動作確認

| No | 確認項目 | チェック |
|----|---------|:--------:|
| 1 | ページ表示（ログイン画面） | [x] |
| 2 | Googleでログイン | [x] |
| 3 | プロジェクト作成 | [x] |
| 4 | 計測機能（開始・停止） | [x] |
| 5 | データ保存（リロード後の保持） | [x] |

---

## システムテスト（全結合テスト合格後）

### ローカル環境（L）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| プロジェクト管理（1.1〜1.8） | 8 | [x] |
| 計測機能（2.1〜2.6） | 6 | [x] |
| 履歴管理（3.1〜3.11） | 11 | [x] |
| 集計・グラフ（4.1〜4.4） | 4 | [x] |
| ポモドーロ（5.1〜5.9） | 9 | [x] |
| 通知（6.1〜6.5） | 5 | [x] |
| データ管理（7.1〜7.4） | 4 | [x] |
| 認証（8.1〜8.5） | 5 | [x] |
| 複数端末（9.1〜9.2） | 2 | [ ] |
| オフライン対応（10.1〜10.4） | 4 | [ ] |
| 非機能要件（11.1〜11.2） | 2 | [ ] |
| レスポンシブ対応（12.1〜12.2） | 2 | [ ] |

### ステージング環境（S）

**実施日**: 2026-02-04
**環境**: https://harunoa-prototype.vercel.app

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| プロジェクト管理（1.1〜1.8） | 8 | [x] |
| 計測機能（2.1〜2.6） | 6 | [x] |
| 履歴管理（3.1〜3.11） | 11 | [x] |
| 集計・グラフ（4.1〜4.4） | 4 | [x] |
| ポモドーロ（5.1〜5.9） | 9 | [x] |
| 通知（6.1〜6.5） | 5 | [x] |
| データ管理（7.1〜7.4） | 4 | [ ] |
| 認証（8.1〜8.5） | 5 | [ ] |
| 複数端末（9.1〜9.2） | 2 | [ ] |
| オフライン対応（10.1〜10.4） | 4 | [ ] |
| 非機能要件（11.1〜11.2） | 2 | [ ] |
| レスポンシブ対応（12.1〜12.2） | 2 | [ ] |

---

## 完了条件

- [x] 全Phase（1〜11）の実装完了
- [ ] 単体テスト：Utils/Hooks カバレッジ80%以上
- [ ] 結合テスト：全22件合格
- [ ] システムテスト：全62件合格
- [ ] ステージング環境デプロイ・基本動作確認
