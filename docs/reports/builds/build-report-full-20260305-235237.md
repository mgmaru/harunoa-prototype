# ビルド実行レポート

## 基本情報

| 項目 | 内容 |
|------|------|
| 実行日時 | 2026-03-05 23:52:37 |
| 実行環境 | Node.js 23.6.1 |
| ブランチ | feat/issue-5 |
| スコープ | full（テスト + ビルド + lint + 型チェック） |

---

## 実行結果サマリー

| ステップ | 結果 | エラー | 警告 |
|----------|:----:|:------:|:----:|
| テスト (vitest) | 失敗 | 5 | - |
| ビルド (next build) | 成功 | 0 | 0 |
| lint (ESLint) | 成功 | 0 | 0 |
| 型チェック (tsc --noEmit) | 失敗 | 7 | - |

## 総合結果: 失敗あり

---

## テスト結果

### ステータス: 失敗

- テストファイル: 3 失敗 / 23 成功（合計 26）
- テスト数: 5 失敗 / 298 成功（合計 303）
- 実行時間: 4.05s

#### 失敗したテストファイル

1. `src/__tests__/integration/edge-cases.test.tsx`
2. `src/__tests__/integration/core-functions.test.tsx`
3. `src/hooks/__tests__/usePresets.test.ts`（エラーあり）

#### 失敗テスト詳細

**[1] EDGE-003: プリセット削除の制約 > 利用中のプリセットは削除できない**

```
expected [Function] to throw error including '利用中のプリセットは削除できません'
but got '[vitest] No "deleteActivePresetAndSetDefault" export is defined on the "@/services/presets" mock.'
```

原因: `@/services/presets` のモック定義に `deleteActivePresetAndSetDefault` エクスポートが不足している。

**[2] INT-005: 計測停止後のデータ保存 > 計測停止後、セッションが保存され履歴画面で確認できる**

```
expected [] to have a length of 1 but got +0
```

**[3] INT-005: 計測停止後のデータ保存 > セッションの開始時刻、終了時刻、作業時間が正しく保存される**

```
Cannot read properties of undefined (reading 'durationMs')
```

**[4][5] (usePresets) エラー**

```
[vitest] No "deleteActivePresetAndSetDefault" export is defined on the "@/services/presets" mock.
```

テストモックの定義不足が原因。テストファイルのモック設定で `deleteActivePresetAndSetDefault` を追加する必要がある。

---

## ビルド結果

### ステータス: 成功

#### ビルド情報

| 項目 | 内容 |
|------|------|
| ビルド時間 | 正常完了 |
| 生成ページ数 | 10 |

#### バンドルサイズ

| ルート | サイズ | First Load JS |
|--------|--------|---------------|
| / | 4.11 kB | 229 kB |
| /_not-found | 873 B | 88.2 kB |
| /analytics | 74.9 kB | 296 kB |
| /archive | 2.16 kB | 227 kB |
| /focus | 3.16 kB | 221 kB |
| /history | 6.28 kB | 231 kB |
| /login | 1.72 kB | 208 kB |
| /presets | 5.3 kB | 220 kB |
| /settings | 6.12 kB | 227 kB |
| /timer | 4.49 kB | 225 kB |
| First Load JS 共通 | - | 87.3 kB |

---

## lint 結果

### ステータス: 成功

ESLint の警告・エラーは 0 件。

---

## 型チェック結果

### ステータス: 失敗

#### エラー詳細

| ファイル | 行 | エラーコード | メッセージ |
|----------|:--:|-------------|-----------|
| `src/__tests__/integration/advanced-features.test.tsx` | 405 | TS2339 | Property 'memo' does not exist on union type (CreateSessionInput ユニオン型に 'memo' プロパティが存在しない) |
| `src/__tests__/integration/advanced-features.test.tsx` | 466 | TS2339 | Property 'memo' does not exist on union type |
| `src/__tests__/integration/advanced-features.test.tsx` | 467 | TS2339 | Property 'memo' does not exist on union type |
| `src/__tests__/integration/advanced-features.test.tsx` | 496 | TS2339 | Property 'data' does not exist on type 'CreateSessionInput' |
| `src/__tests__/integration/advanced-features.test.tsx` | 507 | TS2339 | Property 'sessionId' does not exist on type 'CreateSessionInput' |
| `src/hooks/__tests__/useTimer.test.ts` | 258 | TS2322 | Type '"running"' is not assignable to type '"stopped"' |
| `src/hooks/__tests__/useTimer.test.ts` | 268 | TS2322 | Type '"paused"' is not assignable to type '"stopped"' |

#### エラー概要

**advanced-features.test.tsx (5件)**

`CreateSessionInput` がユニオン型になっており、ユニオン全体に存在しないプロパティ（`memo`, `data`, `sessionId`）へのアクセスで型エラーが発生。テストコードが型に合わない方法でモックデータを参照している。

**useTimer.test.ts (2件)**

タイマーの状態テストで `"stopped"` 型のフィールドに `"running"` や `"paused"` を代入しようとしており、型の不一致エラーが発生。テストコードの型定義見直しが必要。

---

## 実行ログ

<details>
<summary>詳細ログを表示</summary>

### テスト実行ログ（抜粋）

```
Test Files  3 failed | 23 passed (26)
      Tests  5 failed | 298 passed (303)
     Errors  1 error
   Start at  23:52:10
   Duration  4.05s
```

### ビルドログ

```
▲ Next.js 14.2.35
✓ Compiled successfully
✓ Generating static pages (13/13)
```

### lint ログ

```
✔ No ESLint warnings or errors
```

### 型チェックログ（抜粋）

```
src/__tests__/integration/advanced-features.test.tsx(405,29): error TS2339
src/__tests__/integration/advanced-features.test.tsx(466,35): error TS2339
src/__tests__/integration/advanced-features.test.tsx(467,35): error TS2339
src/__tests__/integration/advanced-features.test.tsx(496,29): error TS2339
src/__tests__/integration/advanced-features.test.tsx(507,29): error TS2339
src/hooks/__tests__/useTimer.test.ts(258,7): error TS2322
src/hooks/__tests__/useTimer.test.ts(268,7): error TS2322
```

</details>
