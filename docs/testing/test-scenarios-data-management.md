# データ管理機能テスト補完ガイド

本ドキュメントは、`test-scenarios.md` の「7. データ管理」セクションでSKIPとなっているテスト項目を実行するための補完ガイドです。

---

## 1. 概要

### 1.1 対象テスト項目

| テスト | No | 確認項目 | 期待結果 |
|--------|:--:|----------|----------|
| 7.2 セッション自動アーカイブ確認 | 1 | 1年を超えたセッションデータの存在 | 通常の履歴一覧には表示されない |
| 7.2 セッション自動アーカイブ確認 | 2 | 集計・グラフ画面 | 1年を超えたデータは含まれない |

### 1.2 SKIP理由

Firebase Emulator環境において、1年以上前のセッションデータを作成できなかった。

**詳細**:
1. Firebase Admin SDKを使用したデータ直接投入を試みたが、Firestoreセキュリティルールにより権限エラーが発生
2. Emulator REST APIも同様にセキュリティルールが適用され、データ作成が拒否された
3. ブラウザ経由でのデータ作成では、現在日時のセッションしか作成できない

### 1.3 対象コード

| ファイル | 関数・フック | 役割 |
|----------|-------------|------|
| `src/services/sessions.ts` | `archiveOldSessions` | 1年以上前のセッションをアーカイブ |
| `src/hooks/useSessionArchive.ts` | `useSessionArchive` | アーカイブ処理のReactフック |

---

## 2. 推奨方針

### 2.1 最終推奨: 方法A + 方法B の組み合わせ

| 観点 | 方法 | 目的 |
|------|------|------|
| **日付判定ロジックの検証** | 方法A（Vitest `vi.setSystemTime()`） | 1年判定が正しく動作することを確認 |
| **Firestoreとの統合検証** | 方法B（`withSecurityRulesDisabled`） | 実際のFirestoreクエリ動作を検証 |

**推奨理由**:
- 方法Aで日付判定ロジック（`subYears(new Date(), 1)`）を確実にテスト
- 方法BでFirestore Emulatorでの実際のクエリ動作を検証
- 両方合わせることで、単体テスト・統合テストの両面をカバー
- CI/CDで自動実行可能

### 2.2 テスト方法の比較

| 方法 | 難易度 | 信頼性 | 自動化 | 推奨 |
|------|:------:|:------:|:------:|:----:|
| A. Vitest時間モック | ★☆☆ | ★★☆ | ✅ | **◎** |
| B. Admin SDK + ルールバイパス | ★★☆ | ★★★ | ✅ | **◎** |
| C. Playwright Clock API | ★★★ | ★★☆ | ✅ | △ |
| D. テスト専用ルール | ★☆☆ | ★★☆ | ✅ | △ |
| E. ステージング手動 | ★☆☆ | ★★★ | ❌ | △ |

---

## 3. 方法A: Vitest `vi.setSystemTime()` を使用

### 3.1 概要

Vitestの時間モック機能を使用して、サービス層の`archiveOldSessions`関数の日付判定ロジックをテストします。

### 3.2 メリット・デメリット

| メリット | デメリット |
|----------|------------|
| CI/CDで自動実行可能 | Firestore実機との統合は検証できない |
| 確実に日時をコントロール可能 | モック化されたテスト |
| セットアップが簡単 | E2Eテストではない |
| 既存のテスト基盤を活用可能 | |

### 3.3 実装手順

#### 3.3.1 テストファイルの作成

**ファイル**: `src/services/__tests__/sessions.archive.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subYears, addDays, subDays } from 'date-fns';

// Firebase configをモック
vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Firestoreをモック
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn(),
  })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

describe('archiveOldSessions - 日付判定ロジック', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('1年判定の境界値テスト', () => {
    it('1年を超えたセッションはアーカイブ対象', () => {
      // 現在時刻を2026-02-04に設定
      const now = new Date('2026-02-04T10:00:00');
      vi.setSystemTime(now);

      const oneYearAgo = subYears(now, 1); // 2025-02-04
      const targetDate = subDays(oneYearAgo, 1); // 2025-02-03（1年+1日前）

      // この日付はアーカイブ対象となる
      expect(targetDate <= oneYearAgo).toBe(true);
      expect(targetDate.toISOString()).toBe('2025-02-03T10:00:00.000Z');
    });

    it('ちょうど1年前のセッションはアーカイブ対象', () => {
      const now = new Date('2026-02-04T10:00:00');
      vi.setSystemTime(now);

      const oneYearAgo = subYears(now, 1); // 2025-02-04

      // ちょうど1年前はアーカイブ対象（<=条件）
      expect(oneYearAgo <= oneYearAgo).toBe(true);
    });

    it('1年未満のセッションはアーカイブ対象外', () => {
      const now = new Date('2026-02-04T10:00:00');
      vi.setSystemTime(now);

      const oneYearAgo = subYears(now, 1); // 2025-02-04
      const notTargetDate = addDays(oneYearAgo, 1); // 2025-02-05（1年-1日前）

      // この日付はアーカイブ対象外
      expect(notTargetDate > oneYearAgo).toBe(true);
      expect(notTargetDate.toISOString()).toBe('2025-02-05T10:00:00.000Z');
    });
  });

  describe('うるう年の考慮', () => {
    it('うるう年を跨いでも正しく判定される', () => {
      // 2028年はうるう年
      const now = new Date('2029-03-01T10:00:00');
      vi.setSystemTime(now);

      const oneYearAgo = subYears(now, 1); // 2028-03-01

      // 2028-02-29のセッションはアーカイブ対象（1年以上前）
      const leapDaySession = new Date('2028-02-29T10:00:00');
      expect(leapDaySession < oneYearAgo).toBe(true);
    });
  });
});
```

#### 3.3.2 テストの実行

```bash
npm test -- src/services/__tests__/sessions.archive.test.ts
```

---

## 4. 方法B: Firebase Admin SDK + `withSecurityRulesDisabled`

### 4.1 概要

Firebase Rules Unit Testing ライブラリを使用して、セキュリティルールをバイパスしながらテストデータを投入し、実際のFirestore Emulatorで動作を検証します。

### 4.2 メリット・デメリット

| メリット | デメリット |
|----------|------------|
| 実際のFirestore Emulatorでテスト | セットアップが複雑 |
| ルールをバイパスしてデータ投入可能 | `@firebase/rules-unit-testing`の導入が必要 |
| E2Eに近いテストが可能 | テスト環境の構築に時間がかかる |

### 4.3 事前準備

#### 4.3.1 パッケージのインストール

```bash
npm install --save-dev @firebase/rules-unit-testing
```

#### 4.3.2 Firebase Emulatorの起動

```bash
firebase emulators:start --only firestore,auth
```

### 4.4 実装手順

#### 4.4.1 テストファイルの作成

**ファイル**: `src/__tests__/integration/session-archive.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { subYears, subDays } from 'date-fns';

let testEnv: RulesTestEnvironment;
const TEST_USER_ID = 'test-user-archive';
const TEST_PROJECT_ID = 'test-project-archive';

describe('セッション自動アーカイブ統合テスト', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'harunoa-test-archive',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('7.2 セッションの自動アーカイブ確認', () => {
    it('No.1: 1年を超えたセッションは通常の履歴一覧に表示されない', async () => {
      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const sixMonthsAgo = subDays(now, 180);

      // セキュリティルールをバイパスしてテストデータを投入
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // 2年前のセッション（アーカイブ済み）
        await setDoc(doc(db, 'sessions', 'old-session-1'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoYearsAgo),
          endAt: Timestamp.fromDate(twoYearsAgo),
          durationMs: 3600000,
          memo: '2年前のセッション',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(twoYearsAgo),
          updatedAt: Timestamp.fromDate(twoYearsAgo),
        });

        // 6ヶ月前のセッション（アクティブ）
        await setDoc(doc(db, 'sessions', 'recent-session-1'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(sixMonthsAgo),
          endAt: Timestamp.fromDate(sixMonthsAgo),
          durationMs: 1800000,
          memo: '6ヶ月前のセッション',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(sixMonthsAgo),
          updatedAt: Timestamp.fromDate(sixMonthsAgo),
        });
      });

      // 通常の履歴一覧クエリ（isArchived: falseのみ取得）
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        // 1件のみ取得される（6ヶ月前のセッションのみ）
        expect(snapshot.size).toBe(1);
        expect(snapshot.docs[0].data().memo).toBe('6ヶ月前のセッション');
      });
    });

    it('No.2: 1年を超えたデータは集計に含まれない', async () => {
      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const threeMonthsAgo = subDays(now, 90);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        // アーカイブ済みセッション
        await setDoc(doc(db, 'sessions', 'archived-session'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoYearsAgo),
          endAt: Timestamp.fromDate(twoYearsAgo),
          durationMs: 7200000, // 2時間
          memo: 'アーカイブ済み',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(twoYearsAgo),
          updatedAt: Timestamp.fromDate(twoYearsAgo),
        });

        // アクティブセッション
        await setDoc(doc(db, 'sessions', 'active-session'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(threeMonthsAgo),
          endAt: Timestamp.fromDate(threeMonthsAgo),
          durationMs: 3600000, // 1時間
          memo: 'アクティブ',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(threeMonthsAgo),
          updatedAt: Timestamp.fromDate(threeMonthsAgo),
        });
      });

      // 集計クエリ（アーカイブ除外）
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        // 合計時間を計算
        const totalDurationMs = snapshot.docs.reduce(
          (sum, doc) => sum + doc.data().durationMs,
          0
        );

        // 1時間のみ（アーカイブ済みの2時間は含まれない）
        expect(totalDurationMs).toBe(3600000);
        expect(snapshot.size).toBe(1);
      });
    });
  });
});
```

#### 4.4.2 テストの実行

```bash
# Firebase Emulatorを起動した状態で
npm test -- src/__tests__/integration/session-archive.integration.test.ts
```

---

## 5. 方法C: Playwright Clock API（参考）

### 5.1 概要

Playwrightの時計モック機能を使用して、ブラウザの日時をモックしながらE2Eテストを実行します。

### 5.2 メリット・デメリット

| メリット | デメリット |
|----------|------------|
| 完全なE2Eテスト | セットアップが最も複雑 |
| UIレベルでの検証が可能 | Firestoreサーバー時刻との不整合の可能性 |
| 実際のユーザー操作をシミュレート | 時計モックとFirestoreのTimestampの同期が難しい |

### 5.3 実装例（参考）

```typescript
// Playwright test
import { test, expect } from '@playwright/test';

test('1年以上前のセッションは履歴に表示されない', async ({ page }) => {
  // ブラウザの時計を2027年に設定
  await page.clock.install({ time: new Date('2027-02-04T10:00:00') });

  // テストデータを準備（2026年のセッション）
  // ※Firestoreのサーバー時刻はモックされないため注意

  await page.goto('/history');

  // アーカイブ処理実行
  await page.click('[data-testid="run-archive"]');

  // 履歴に1年以上前のデータが表示されないことを確認
  const sessions = await page.locator('[data-testid="session-item"]').count();
  expect(sessions).toBe(0); // または期待される件数
});
```

**注意**: FirestoreのTimestampはサーバー時刻を使用するため、ブラウザの時計をモックしても完全なテストにはなりません。方法A・Bとの併用を推奨します。

---

## 6. 方法D: テスト専用Firestoreルールファイル（参考）

### 6.1 概要

テスト環境でのみ使用する緩和されたルールファイルを用意し、Admin SDKからのデータ投入を許可します。

### 6.2 実装手順

#### 6.2.1 テスト用ルールファイルの作成

**ファイル**: `firestore.test.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // テスト環境では全てのアクセスを許可
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### 6.2.2 Emulator起動コマンド

```bash
firebase emulators:start --only firestore,auth --rules=firestore.test.rules
```

**注意**: 本番環境に誤って適用しないよう、ファイル管理に注意してください。

---

## 7. テスト結果記録テンプレート

### 7.1 方法A: Vitest時間モックテスト

| テスト | 結果 | 備考 |
|--------|:----:|------|
| 1年を超えたセッションはアーカイブ対象 | | |
| ちょうど1年前のセッションはアーカイブ対象 | | |
| 1年未満のセッションはアーカイブ対象外 | | |
| うるう年を跨いでも正しく判定される | | |

### 7.2 方法B: Firestore統合テスト

| テスト | 結果 | 備考 |
|--------|:----:|------|
| No.1: 1年を超えたセッションは履歴に非表示 | | |
| No.2: 1年を超えたデータは集計に含まれない | | |

---

## 8. 既知の制限事項

### 8.1 Firestore Emulatorのセキュリティルール

Firebase Emulatorは本番と同じセキュリティルールを適用します。テストデータの投入には `withSecurityRulesDisabled` を使用するか、テスト専用ルールを適用する必要があります。

### 8.2 サーバー時刻とクライアント時刻

Firestoreの `serverTimestamp()` や `Timestamp.now()` はサーバー（Emulator）の時刻を使用します。Vitest の `vi.setSystemTime()` でクライアント側の時刻をモックしても、Firestore側の時刻には影響しません。

**回避策**: テストデータの日付は `Timestamp.fromDate()` で明示的に指定してください。

### 8.3 うるう年・タイムゾーン

日付計算には `date-fns` の `subYears` 関数を使用しています。うるう年やタイムゾーンを跨ぐケースでは、境界値テストを追加することを推奨します。

---

## 9. 参考資料

- [Vitest Mocking Dates](https://vitest.dev/guide/mocking/dates)
- [Vi API - Vitest](https://vitest.dev/api/vi.html)
- [Firebase Test Rules with Emulator](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Firebase Build Unit Tests](https://firebase.google.com/docs/rules/unit-tests)
- [Playwright Clock API](https://playwright.dev/docs/clock)
- [date-fns subYears](https://date-fns.org/docs/subYears)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-02-04 | 初版作成 |
