# 集中モード中にブラウザを閉じるとバックグラウンドで計測が継続される

## バグの概要

集中モード（SCR-005）で計測中にブラウザを閉じた場合、タイマーが停止せず、セッションも確定されない。次回ブラウザを開いた際に、閉じていた間の時間も含めた経過時間が表示され、計測が継続している状態になる。

## 再現手順

1. プロジェクトを選択して計測を開始する
2. 集中モード画面（`/focus`）に遷移する
3. 計測中（または一時停止中）にブラウザを閉じる（タブを閉じる / ブラウザ自体を終了する）
4. 再度ブラウザを開き、アプリにアクセスする
5. タイマーが閉じていた間の時間も含めて計測を継続している

## 期待される動作

ブラウザを閉じた時点で計測が終了し、セッションが確定される。

## 実際の動作

ブラウザを閉じてもタイマーの状態がlocalStorageに保持されたまま残り、次回アクセス時に計測が再開される。閉じていた間の時間も経過時間に加算される。

---

## 原因分析

### 根本原因: ブラウザクローズ時のイベントハンドラが未実装

プロジェクト全体を検索した結果、`beforeunload`・`pagehide`・`unload`・`visibilitychange` のいずれのイベントハンドラも実装されていない。そのため、ブラウザを閉じた際にタイマーを停止してセッションを確定する処理が一切実行されない。

### 詳細なメカニズム

以下の3つの仕組みが組み合わさることで、このバグが発生する。

#### 1. タイマー状態のlocalStorage永続化

`src/stores/timerStore.ts:103-106`

```typescript
persist(
  (set, get) => ({ /* ...アクション定義... */ }),
  { name: 'harunoa-timer' }
)
```

Zustandの`persist`ミドルウェアにより、タイマーの状態（`status`、`startAt`、`pausedAt`等）がlocalStorageに自動保存される。ブラウザを閉じても、この状態は消えない。

#### 2. セッション確定の唯一のトリガーがユーザー操作

セッション（作業記録）が確定されるのは、`useTimer`フックの`handleStop`が呼ばれた時のみ。

`src/hooks/useTimer.ts:59-113`

```typescript
const handleStop = useCallback(async (): Promise<Session | null> => {
  const sessionData = timer.stop();  // ← timerStoreのstop()でセッション情報を取得
  pomodoro.stopWithTimer();
  // ...Firestoreにセッションを保存（オフライン時はキューに追加）
}, [user]);
```

この`handleStop`は、以下のUIボタン操作でしか呼ばれない。

| トリガー | ファイル | 行番号 |
|----------|----------|--------|
| 集中モードの停止ボタン | `src/app/(auth)/focus/page.tsx` | 90-102 |
| 離脱確認モーダルの「停止して戻る」ボタン | `src/app/(auth)/focus/page.tsx` | 75-88 |
| 計測切替時の自動停止 | `src/app/(auth)/timer/page.tsx` | 81-99 |

つまり、**ユーザーが明示的にボタンを押さない限り、セッションは確定されない**。

#### 3. 経過時間の計算方式

`src/hooks/useTimer.ts:24-25`

```typescript
const updateElapsed = () => {
  setElapsedMs(Date.now() - timer.startAt! - timer.totalPausedMs);
};
```

経過時間は「現在時刻 - 開始時刻 - 一時停止累計」で計算される。`startAt`はlocalStorageに保存されているため、ブラウザを閉じて再度開いた際にも、閉じていた期間が経過時間に含まれる。

### バグ発生のフロー図

```
ユーザー操作                   アプリ内部の状態
─────────────────────────────────────────────────────────
計測開始ボタン押下      →  timerStore: status='running', startAt=T1
                           localStorage: { status:'running', startAt:T1 }
        ↓
集中モード画面表示      →  useTimer: elapsedMs = now - T1
        ↓
ブラウザを閉じる        →  ★ beforeunloadハンドラなし
                           ★ timer.stop() は呼ばれない
                           ★ セッションは確定されない
                           localStorage: { status:'running', startAt:T1 }  ← 残ったまま
        ↓
（数時間後）
ブラウザを再度開く      →  Zustand persist: localStorageから状態復元
                           timerStore: status='running', startAt=T1
        ↓
アプリ表示              →  useTimer: elapsedMs = now - T1
                           ★ 閉じていた数時間分が経過時間に加算される
                           ★ 計測が継続している状態として表示される
```

### 補足: 既存の復旧処理

`src/app/(auth)/layout.tsx:20-26` にアプリ起動時の復旧処理が存在するが、これは`isSyncing`フラグのリセットのみであり、タイマー状態のリセットは行わない。

```typescript
useEffect(() => {
  const offlineState = useOfflineStore.getState();
  if (offlineState.isSyncing) {
    offlineState.setSyncing(false);
  }
}, []);
```

---

## 影響範囲

| 対象 | 影響 |
|------|------|
| 集中モード画面（`/focus`） | ブラウザ再起動後も計測中として表示される |
| セッション記録 | ブラウザを閉じた時点のセッションが記録されない |
| 経過時間の正確性 | 閉じていた期間が作業時間に含まれてしまう |
| ポモドーロタイマー | タイマーと連動しているため、状態が不整合になる可能性がある |

## 関連ファイル

| ファイル | 役割 |
|----------|------|
| `src/stores/timerStore.ts` | タイマー状態管理（persist永続化） |
| `src/hooks/useTimer.ts` | タイマー操作・セッション確定ロジック |
| `src/app/(auth)/focus/page.tsx` | 集中モード画面 |
| `src/app/(auth)/layout.tsx` | 認証レイアウト（起動時の復旧処理） |
| `src/stores/pomodoroStore.ts` | ポモドーロ状態管理（persist永続化） |
| `src/hooks/usePomodoro.ts` | ポモドーロ操作 |
| `src/services/sessions.ts` | Firestoreへのセッション保存 |
| `src/stores/offlineStore.ts` | オフラインキュー管理 |

## 関連仕様書

- `docs/screen_specifications/03_timer.md` - タイマー・集中モード画面仕様
- `docs/implementation/03_timer.md` - タイマー実装指示書
