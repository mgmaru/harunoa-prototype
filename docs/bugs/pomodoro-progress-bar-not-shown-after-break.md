# 休憩モード終了後、再度集中モードに入った際にポモドーロ進捗バーが表示されない

## 🐛 バグの概要

ポモドーロタイマーを使用中、最初の集中フェーズ→休憩フェーズまでは画面下部のポモドーロ進捗バーが正しく表示されるが、休憩が終了して2回目の集中フェーズに入ると進捗バーが表示されなくなる。

## 再現手順

1. プロジェクトを選択する
2. ポモドーロタイマー付きのプリセットを選択して計測を開始する
3. 集中モードに遷移する → ✅ 画面下部に進捗バーが表示される
4. 集中時間が終了し、休憩モードに入る → ✅ 進捗バーが休憩モードとして表示される
5. 休憩時間が終了し、再度集中モードに入る → ❌ **進捗バーが表示されない**

## 期待される動作

休憩終了後に2回目の集中フェーズが始まった際も、画面下部にポモドーロ進捗バーが表示される。

## 実際の動作

休憩時間が終了すると進捗バーが消え、その後は再表示されない。

## 原因分析

**`src/hooks/usePomodoro.ts` (L48-54)**

休憩フェーズの `remainingMs` が `0` になった際に、`pomodoro.stop()` が呼ばれてフェーズが `idle` にリセットされる。

```typescript
} else if (pomodoro.phase === 'break') {
  notify({
    title: '休憩終了',
    message: '次の集中を開始できます',
    sound: 'break',
  });
  pomodoro.stop();  // ← ここでphaseが'idle'になる
}
```

**`src/app/(auth)/focus/page.tsx` (L209)**

進捗バーの表示条件に `!timer.pomodoro.isIdle` が含まれているため、フェーズが `idle` になると進捗バーが非表示になる。

```tsx
{timer.pomodoro.isEnabled && !timer.pomodoro.isIdle && (
  <PomodoroProgress ... />
)}
```

**根本原因**: 休憩終了時に `pomodoro.stop()` で `idle` にリセットされた後、次の集中フェーズ（`startFocus()`）が自動的に開始されないため、タイマーが動作中でもポモドーロはアイドル状態のままになる。

## 影響範囲

- 集中画面 (`/focus`)
- ポモドーロタイマー利用時のみ

## 関連ファイル

- `src/hooks/usePomodoro.ts`
- `src/stores/pomodoroStore.ts`
- `src/app/(auth)/focus/page.tsx`
- `src/components/features/focus/PomodoroProgress.tsx`
