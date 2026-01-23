# コンポーネント構造設計書（HaruNoa）

作成日：2026-01-22
関連ドキュメント：screen_specifications.md, 01_tech-stack.md

---

## 1. 概要

本ドキュメントは、HaruNoaのフロントエンドコンポーネント構造を定義する。

---

## 2. ページ構成

| パス | 画面ID | コンポーネント | 認証 |
|------|--------|---------------|:----:|
| `/login` | SCR-001 | `LoginPage` | 不要 |
| `/` | SCR-002 | `HomePage` | 必要 |
| `/archive` | SCR-003 | `ArchivePage` | 必要 |
| `/timer` | SCR-004 | `TimerPage` | 必要 |
| `/focus` | SCR-005 | `FocusPage` | 必要 |
| `/history` | SCR-006 | `HistoryPage` | 必要 |
| `/analytics` | SCR-007 | `AnalyticsPage` | 必要 |
| `/settings` | SCR-008 | `SettingsPage` | 必要 |
| `/presets` | SCR-009 | `PresetsPage` | 必要 |

---

## 3. レイアウトコンポーネント

### 3.1 構成

```
src/components/layout/
├── RootLayout.tsx          # 全体レイアウト
├── AuthLayout.tsx          # 認証必要ページ用
├── Header.tsx              # PCヘッダー
├── TabBar.tsx              # スマホ下部タブ
└── Navigation.tsx          # ナビゲーション項目
```

### 3.2 RootLayout

```tsx
// 責務: 認証状態管理、グローバル状態初期化

interface RootLayoutProps {
  children: React.ReactNode;
}
```

### 3.3 AuthLayout

```tsx
// 責務: 認証チェック、未認証時リダイレクト

interface AuthLayoutProps {
  children: React.ReactNode;
}
```

---

## 4. 共通UIコンポーネント

### 4.1 一覧

```
src/components/ui/
├── Button.tsx
├── IconButton.tsx
├── Input.tsx
├── TextArea.tsx
├── Select.tsx
├── Toggle.tsx
├── Checkbox.tsx
├── RadioGroup.tsx
├── Modal.tsx
├── Overlay.tsx
├── Toast.tsx
├── Badge.tsx
├── Card.tsx
├── Spinner.tsx
├── Pagination.tsx
├── SegmentControl.tsx
├── ColorPicker.tsx
├── DatePicker.tsx
└── ConfirmDialog.tsx
```

### 4.2 主要コンポーネント仕様

#### Button

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

#### Modal

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### Toast

```tsx
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // デフォルト5000ms
}
```

---

## 5. 機能別コンポーネント

### 5.1 プロジェクト関連

```
src/components/features/project/
├── ProjectList.tsx           # プロジェクト一覧
├── ProjectCard.tsx           # プロジェクトカード
├── ProjectCreateModal.tsx    # 作成モーダル
├── ProjectEditModal.tsx      # 編集モーダル
├── ArchiveList.tsx           # アーカイブ一覧
└── ArchiveItem.tsx           # アーカイブ項目
```

### 5.2 タイマー関連

```
src/components/features/timer/
├── TimerSetup.tsx            # 計測設定画面
├── ProjectSelect.tsx         # プロジェクト選択
├── PresetSelect.tsx          # プリセット選択
├── StartButton.tsx           # 計測開始ボタン
└── SwitchWarningModal.tsx    # 計測切替警告
```

### 5.3 集中モード関連

```
src/components/features/focus/
├── FocusScreen.tsx           # 集中モード画面
├── TimerDisplay.tsx          # 経過時間表示
├── TimerControls.tsx         # 操作ボタン群
├── PomodoroProgress.tsx      # ポモドーロ進捗
├── MemoOverlay.tsx           # メモ入力
├── ExitConfirmModal.tsx      # 離脱確認
├── NotificationBanner.tsx    # 通知バナー
└── OfflineBanner.tsx         # オフライン表示
```

### 5.4 履歴関連

```
src/components/features/history/
├── SessionList.tsx           # セッション一覧
├── SessionItem.tsx           # セッション項目
├── SessionEditModal.tsx      # 編集モーダル
├── SessionDeleteModal.tsx    # 削除確認
├── DateFilter.tsx            # 日付フィルター
└── CalendarPicker.tsx        # カレンダー選択
```

### 5.5 集計関連

```
src/components/features/analytics/
├── AnalyticsDashboard.tsx    # 集計ダッシュボード
├── PeriodSelector.tsx        # 期間選択
├── BarChart.tsx              # 棒グラフ
├── PieChart.tsx              # 円グラフ
└── SummaryTable.tsx          # 合計時間表
```

### 5.6 設定関連

```
src/components/features/settings/
├── SettingsList.tsx          # 設定一覧
├── NotificationSettings.tsx  # 通知設定
├── ExportModal.tsx           # CSVエクスポート
└── LogoutModal.tsx           # ログアウト確認
```

### 5.7 プリセット関連

```
src/components/features/preset/
├── PresetList.tsx            # プリセット一覧
├── PresetItem.tsx            # プリセット項目
├── PresetCreateModal.tsx     # 作成モーダル
├── PresetEditModal.tsx       # 編集モーダル
└── PresetDeleteModal.tsx     # 削除確認
```

---

## 6. カスタムフック

```
src/hooks/
├── useAuth.ts                # 認証状態
├── useProjects.ts            # プロジェクトCRUD
├── useSessions.ts            # セッションCRUD
├── usePresets.ts             # プリセットCRUD
├── useSettings.ts            # 設定CRUD
├── useTimer.ts               # タイマーロジック
├── usePomodoro.ts            # ポモドーロロジック
├── useAnalytics.ts           # 集計データ
├── useNotification.ts        # 通知
├── useOffline.ts             # オフライン検知
├── useToast.ts               # トースト表示
└── useResponsive.ts          # レスポンシブ判定
```

---

## 7. 状態管理（Zustand）

```
src/stores/
├── index.ts                  # 統合エクスポート
├── authStore.ts              # 認証状態
├── timerStore.ts             # タイマー状態
├── pomodoroStore.ts          # ポモドーロ状態
├── toastStore.ts             # トースト管理
└── offlineStore.ts           # オフライン状態・キュー
```

### 7.1 タイマーストア

```typescript
interface TimerState {
  status: 'stopped' | 'running' | 'paused';
  projectId: string | null;
  startAt: Date | null;
  pausedAt: Date | null;
  elapsedMs: number;
  memo: string;
}

interface TimerActions {
  start: (projectId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<Session>;
  setMemo: (memo: string) => void;
  reset: () => void;
}
```

### 7.2 ポモドーロストア

```typescript
interface PomodoroState {
  phase: 'focus' | 'break' | 'idle';
  remainingMs: number;
  presetId: string | null;
}

interface PomodoroActions {
  startFocus: () => void;
  startBreak: () => void;
  skip: () => void;
  tick: () => void;
  reset: () => void;
}
```

---

## 8. レスポンシブ対応

### 8.1 ブレークポイント

```typescript
// tailwind.config.js で定義
const breakpoints = {
  sm: '640px',   // スマホ横
  md: '768px',   // タブレット
  lg: '1024px',  // PC
  xl: '1280px',  // 大画面PC
};
```

### 8.2 対応方針

| 画面 | PC | スマホ |
|------|-----|--------|
| ナビゲーション | ヘッダー（上部） | タブバー（下部固定） |
| プロジェクト一覧 | 2列グリッド | 1列リスト |
| 操作ボタン | 常時表示 | スワイプ/メニュー |
| モーダル | 中央表示 | 下からスライド |

---

## 9. 変更履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| v0 | 2026-01-22 | 初版作成 |
| v1 | 2026-01-23 | 01_tech-stack.mdとの整合性を確保 |

### v1での主な変更点

| カテゴリ | 変更内容 |
|----------|----------|
| 関連ドキュメント | 01_tech-stack.md を追加 |
| stores/ | index.ts（統合エクスポート）を追加 |
