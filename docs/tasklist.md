# HaruNoa 開発チェックリスト

実装からシステムテストまでの進捗管理用チェックリスト。

---

## Phase 1: プロジェクトセットアップ（00_setup.md）

- [ ] Next.jsプロジェクト作成
- [ ] 依存パッケージインストール
- [ ] 環境変数設定（.env.local）
- [ ] Firebase初期化（src/lib/firebase/config.ts）
- [ ] ディレクトリ構造作成
- [ ] Tailwind設定
- [ ] 基本レイアウト作成（src/app/layout.tsx）
- [ ] 動作確認（npm run dev）

---

## Phase 2: 認証機能（01_auth.md）

- [ ] 認証関数の実装（src/services/auth.ts）
- [ ] 認証ストアの実装（src/stores/authStore.ts）
- [ ] 認証フックの実装（src/hooks/useAuth.ts）
- [ ] ログインページの実装（src/app/login/page.tsx）
- [ ] 認証レイアウトの実装（src/app/(auth)/layout.tsx）
- [ ] ホームページプレースホルダー
- [ ] 単体テスト作成（hooks/useAuth）

---

## Phase 3: プロジェクト管理（02_project-management.md）

- [ ] プロジェクトAPI実装（src/services/projects.ts）
- [ ] カラーパレット定義（src/constants/colors.ts）
- [ ] プロジェクトフック（src/hooks/useProjects.ts）
- [ ] プロジェクト一覧画面（src/app/(auth)/page.tsx）
- [ ] プロジェクト作成モーダル
- [ ] プロジェクト編集モーダル
- [ ] アーカイブ一覧画面（src/app/(auth)/archive/page.tsx）
- [ ] 単体テスト作成（hooks/useProjects）

---

## Phase 4: タイマー・集中モード（03_timer.md）

- [ ] タイマーストア（src/stores/timerStore.ts）
- [ ] タイマーフック（src/hooks/useTimer.ts）
- [ ] 時間フォーマット関数（src/lib/date/format.ts）
- [ ] 計測画面（src/app/(auth)/timer/page.tsx）
- [ ] 集中モード画面（src/app/(auth)/focus/page.tsx）
- [ ] メモオーバーレイ
- [ ] 離脱確認モーダル
- [ ] 計測切替警告モーダル
- [ ] 単体テスト作成（lib/date/format, hooks/useTimer）

### 結合テスト①（03_timer完了後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| 認証・ルーティング（INT-001〜002） | 2 | [ ] |
| セッション分離（INT-003） | 1 | [ ] |
| 計測・プロジェクト連携（INT-004） | 1 | [ ] |
| 計測・履歴連携（INT-005〜006） | 2 | [ ] |

---

## Phase 5: 履歴管理（04_history.md）

- [ ] セッションAPI実装（src/services/sessions.ts）
- [ ] 日付跨ぎ按分ロジック（src/lib/date/session-split.ts）
- [ ] 履歴フック（src/hooks/useSessions.ts）
- [ ] 履歴画面（src/app/(auth)/history/page.tsx）
- [ ] セッション一覧コンポーネント
- [ ] セッション編集モーダル
- [ ] 日付フィルタ機能
- [ ] 単体テスト作成（lib/date/session-split, hooks/useSessions）

---

## Phase 6: 集計・グラフ（05_analytics.md）

- [ ] 集計ユーティリティ（src/lib/date/aggregation.ts）
- [ ] 集計フック（src/hooks/useAnalytics.ts）
- [ ] 棒グラフコンポーネント（BarChart）
- [ ] 円グラフコンポーネント（PieChart）
- [ ] 集計画面（src/app/(auth)/analytics/page.tsx）
- [ ] 期間切替機能（日/週/月/年）
- [ ] 単体テスト作成（lib/date/aggregation, hooks/useAnalytics）

---

## Phase 7: 設定（06_settings.md）

- [ ] ユーザー設定API（src/services/settings.ts）
- [ ] プリセットAPI（src/services/presets.ts）
- [ ] アーカイブ済みセッション取得API追加
- [ ] CSVエクスポート（src/lib/csv/export.ts）
- [ ] 設定フック（src/hooks/useSettings.ts）
- [ ] 設定画面（src/app/(auth)/settings/page.tsx）
- [ ] エクスポートモーダル
- [ ] ログアウトモーダル
- [ ] 単体テスト作成（lib/csv/export, hooks/useSettings）

### 結合テスト②（06_settings完了後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| 履歴・集計連携（INT-011〜012） | 2 | [ ] |
| プロジェクト・集計連携（INT-013） | 1 | [ ] |
| CSV内容確認（INT-014） | 1 | [ ] |
| ログアウト時データクリア（INT-015） | 1 | [ ] |

---

## Phase 8: オフライン対応（07_offline-support.md）

- [ ] オフライン検知フック（src/hooks/useOffline.ts）
- [ ] オフラインキューストア（src/stores/offlineStore.ts）
- [ ] 同期サービス（src/services/sync.ts）
- [ ] タイマーストアのオフライン対応更新
- [ ] 同期トリガーフック（src/hooks/useSync.ts）
- [ ] オフラインバナーコンポーネント
- [ ] レイアウトへの組み込み
- [ ] 単体テスト作成（hooks/useOffline, hooks/useSync）

---

## Phase 9: ポモドーロ（08_pomodoro.md）

- [ ] ポモドーロストア（src/stores/pomodoroStore.ts）
- [ ] ポモドーロフック（src/hooks/usePomodoro.ts）
- [ ] タイマーフックとの統合
- [ ] 集中モード画面の更新
- [ ] ポモドーロ進捗コンポーネント
- [ ] プリセット選択連携
- [ ] プリセットフック（src/hooks/usePresets.ts）
- [ ] デフォルトプリセット初期化
- [ ] プリセット管理画面（src/app/(auth)/presets/page.tsx）
- [ ] 単体テスト作成（hooks/usePomodoro, hooks/usePresets）

---

## Phase 10: 通知機能（09_notification.md）

- [ ] 通知フック（src/hooks/useNotification.ts）
- [ ] トーストストア（src/stores/toastStore.ts）
- [ ] トーストコンポーネント（src/components/ui/Toast.tsx）
- [ ] 通知バナーコンポーネント
- [ ] 通知設定コンポーネント
- [ ] 通知音ファイル配置（public/sounds/）
- [ ] レイアウトへの組み込み
- [ ] アニメーション追加（globals.css）
- [ ] 単体テスト作成（hooks/useNotification）

---

## Phase 11: セッション自動アーカイブ（10_session-archive.md）

- [ ] アーカイブ実行API追加（src/services/sessions.ts）
- [ ] アーカイブ実行フック（src/hooks/useSessionArchive.ts）
- [ ] ログイン時の自動アーカイブ実行
- [ ] 集計画面でのアーカイブ実行
- [ ] 単体テスト作成（hooks/useSessionArchive）

### 結合テスト③（全機能完了後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| ポモドーロ・タイマー連携（INT-021） | 1 | [ ] |
| 通知・設定連携（INT-022〜023） | 2 | [ ] |
| オフライン計測・同期（INT-024〜025） | 2 | [ ] |
| 自動アーカイブ（INT-026〜027） | 2 | [ ] |
| 複数端末競合（EDGE-001） | 1 | [ ] |
| ブラウザクラッシュ復帰（EDGE-002） | 1 | [ ] |
| プリセット削除制約（EDGE-003） | 1 | [ ] |
| リトライ上限後動作（EDGE-004） | 1 | [ ] |

---

## システムテスト（全結合テスト合格後）

| カテゴリ | 件数 | チェック |
|---------|:----:|:--------:|
| プロジェクト管理（1.1〜1.6） | 6 | [ ] |
| 計測機能（2.1〜2.6） | 6 | [ ] |
| 履歴管理（3.1〜3.8） | 8 | [ ] |
| 集計・グラフ（4.1〜4.2） | 2 | [ ] |
| ポモドーロ（5.1〜5.7） | 7 | [ ] |
| 通知（6.1〜6.5） | 5 | [ ] |
| データ管理（7.1〜7.3） | 3 | [ ] |
| 認証（8.1〜8.4） | 4 | [ ] |
| 複数端末（9.1〜9.2） | 2 | [ ] |
| オフライン対応（10.1〜10.4） | 4 | [ ] |
| 非機能要件（11.1〜11.2） | 2 | [ ] |

---

## 完了条件

- [ ] 全Phase（1〜11）の実装完了
- [ ] 単体テスト：Utils/Hooks カバレッジ80%以上
- [ ] 結合テスト：全22件合格
- [ ] システムテスト：全49件合格
