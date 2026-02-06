# バグレポート: ステージング環境システムテスト（2026-02-06）

**発見日**: 2026-02-06
**発見環境**: ステージング（https://harunoa-prototype.vercel.app）
**テストフェーズ**: システムテスト（ステージング環境）
**ステータス**: 修正済み

---

## バグ一覧

| ID | 概要 | 重大度 | 対象画面 |
|:--:|------|:------:|----------|
| BUG-001 | メモ入力の文字が白色で見えない | 中 | 集中モード画面 |
| BUG-002 | 一時停止中にポモドーロのプログレスバーが進む | 中 | 集中モード画面（ポモドーロ） |
| BUG-003 | プログレスバーの時間表記フォーマットが不統一 | 低 | 集中モード画面（ポモドーロ） |

---

## BUG-001: メモ入力の文字が白色で見えない

### 現象

集中モード画面でメモボタンをクリックし、MemoOverlayに文字を入力すると、テキストが白色で表示され、背景も白色のため視認できない。

### 原因

CSS `color` プロパティの継承問題。

集中モード画面の最上位要素に `text-white` が指定されており、MemoOverlay内のtextareaにテキスト色の指定がないため、白色が継承されている。

```
継承チェーン:
  focus/page.tsx:117  <div className="... text-white ...">
    └─ MemoOverlay.tsx:39  <div className="bg-white ...">  ← モーダル背景は白
        └─ MemoOverlay.tsx:52  <textarea className="...">  ← text色の指定なし → 白が継承
```

### 修正対象

**ファイル**: `src/components/features/timer/MemoOverlay.tsx`
**行番号**: 52-56行目

```tsx
// 現在のコード（52-56行目）
<textarea
  value={memo}
  onChange={(e) => setMemo(e.target.value)}
  placeholder="やったこと、詰まった点など"
  className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
/>
```

### 修正方針

textareaのclassNameに `text-gray-900` を追加する。

```tsx
// 修正後
className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
```

### 関連テストシナリオ

- 2.4 作業メモの入力・保存（test-scenarios.md）

---

## BUG-002: 一時停止中にポモドーロのプログレスバーが進む

### 現象

ポモドーロタイマーを使用した集中モード画面で、タイマーを一時停止しても、画面下部のプログレスバーが進み続ける。

### 原因

`usePomodoro` フックのtick処理が、タイマー本体の一時停止状態（`status === 'paused'`）を参照していない。

**原因箇所1**: `src/hooks/usePomodoro.ts` 14-27行目

```tsx
// tick処理のuseEffect
useEffect(() => {
  if (pomodoro.phase === 'idle' || !pomodoro.isEnabled) return;

  const interval = setInterval(() => {
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;
    pomodoro.tick(delta);  // ← 一時停止中も実行される
  }, 100);

  return () => clearInterval(interval);
}, [pomodoro.phase, pomodoro.isEnabled]);
// ↑ タイマーのstatus（running/paused）が依存配列にない
```

**原因箇所2**: `src/stores/pomodoroStore.ts` 97-103行目

```tsx
tick: (deltaMs) => {
  const { remainingMs, phase } = get();
  if (phase === 'idle') return;  // ← phaseのみチェック。paused状態を考慮していない

  const newRemaining = Math.max(0, remainingMs - deltaMs);
  set({ remainingMs: newRemaining });
},
```

### 設計上の問題点

ポモドーロストア（`pomodoroStore`）とタイマーストア（`timerStore`）が独立して動作しており、タイマーの一時停止状態がポモドーロ側に伝搬しない。

```
timerStore   : status = 'paused' → 経過時間は停止 ✅
pomodoroStore: phase = 'focus'   → tick処理は継続 ❌
```

### 修正対象

**ファイル**: `src/hooks/usePomodoro.ts`
**行番号**: 14-27行目

### 修正方針

タイマーの一時停止状態をtick処理の制御に反映する。以下のいずれかの方法で対応可能。

**方法A**: usePomodoro内でtimerStoreのstatusを参照し、`running`でない場合はtickしない

```tsx
// usePomodoro.ts
import { useTimerStore } from '@/stores/timerStore';

useEffect(() => {
  if (pomodoro.phase === 'idle' || !pomodoro.isEnabled) return;

  const interval = setInterval(() => {
    const timerStatus = useTimerStore.getState().status;
    if (timerStatus !== 'running') {
      lastTickRef.current = Date.now(); // 時間のズレを防止
      return;
    }
    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;
    pomodoro.tick(delta);
  }, 100);

  return () => clearInterval(interval);
}, [pomodoro.phase, pomodoro.isEnabled]);
```

**方法B**: pomodoroStoreのtickにisRunningパラメータを追加する

※ 方法Aが既存の変更範囲が最も小さくシンプル。

### 関連テストシナリオ

- 5.1〜5.9 ポモドーロ（test-scenarios.md）

---

## BUG-003: プログレスバーの時間表記フォーマットが不統一

### 現象

ポモドーロの時間バーに「集中: 01:39:56 / 100:00」のように表示される。左側（残り時間）は `HH:MM:SS` 形式、右側（総時間）は `MM:SS` 形式となっており、フォーマットが不統一。

### 原因

`PomodoroProgress.tsx` で、残り時間と総時間で異なるフォーマット方法を使用している。

**原因箇所**: `src/components/features/focus/PomodoroProgress.tsx`

```tsx
// 37-38行目: 総時間をハードコード文字列で生成
const totalMinutes = phase === 'focus' ? focusDurationMinutes : breakDurationMinutes;
const totalFormatted = `${totalMinutes}:00`;  // ← 例: "100:00"（MM:SS形式）

// 57行目: 残り時間はformatTimeMsを使用
{formatTimeMs(remainingMs)} / {totalFormatted}
// ↑ "01:39:56"（HH:MM:SS形式） / "100:00"（MM:SS形式）
```

`formatTimeMs()` は `src/lib/date/format.ts:55-58` で定義されており、常に `HH:MM:SS` 形式を返す。

### 修正対象

**ファイル**: `src/components/features/focus/PomodoroProgress.tsx`
**行番号**: 37-38行目

### 修正方針

総時間も `formatTimeMs()` を使用してフォーマットを統一する。

```tsx
// 現在のコード（37-38行目）
const totalMinutes = phase === 'focus' ? focusDurationMinutes : breakDurationMinutes;
const totalFormatted = `${totalMinutes}:00`;

// 修正後
const totalMinutes = phase === 'focus' ? focusDurationMinutes : breakDurationMinutes;
const totalFormatted = formatTimeMs(totalMinutes * 60 * 1000);
```

これにより `100:00` → `01:40:00` に修正され、残り時間と同じ `HH:MM:SS` 形式で統一される。

### 関連テストシナリオ

- 5.1〜5.9 ポモドーロ（test-scenarios.md）

---

## 修正時の確認事項

### 修正後の再テスト対象

| バグID | 再テスト対象シナリオ |
|:------:|---------------------|
| BUG-001 | 2.4 作業メモの入力・保存 |
| BUG-002 | 5.1〜5.9 ポモドーロ全般 |
| BUG-003 | 5.1〜5.9 ポモドーロ全般 |

### 影響範囲

- BUG-001: `MemoOverlay.tsx` のみ。影響は局所的
- BUG-002: `usePomodoro.ts` のtick制御。タイマー本体（`useTimer.ts`）には影響しない
- BUG-003: `PomodoroProgress.tsx` の表示ロジックのみ。影響は局所的

### リグレッションリスク

- BUG-001: 低（CSSクラス追加のみ）
- BUG-002: 中（tick処理の制御変更のため、ポモドーロの正常動作を再確認すること）
- BUG-003: 低（表示フォーマット変更のみ）
