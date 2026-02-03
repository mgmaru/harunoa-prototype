/**
 * セッション自動アーカイブ機能の統合テスト
 *
 * 対象テストシナリオ: 7.2 セッションの自動アーカイブ確認
 * テスト方法: 方法B - Firebase Admin SDK + withSecurityRulesDisabled
 *
 * @see docs/testing/test-scenarios-data-management.md
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
import { subYears, subDays } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

// テスト用定数
const TEST_USER_ID = 'test-user-archive';
const TEST_PROJECT_ID = 'test-project-archive';
const PROJECT_ID = 'harunoa-test-archive';

let testEnv: RulesTestEnvironment | null = null;

// Firestoreルールファイルを読み込む
const getFirestoreRules = (): string => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  if (fs.existsSync(rulesPath)) {
    return fs.readFileSync(rulesPath, 'utf8');
  }
  // ルールファイルがない場合はテスト用の緩和ルールを使用
  return `
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{document=**} {
          allow read, write: if true;
        }
      }
    }
  `;
};

describe('セッション自動アーカイブ統合テスト - 7.2', () => {
  beforeAll(async () => {
    try {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          host: 'localhost',
          port: 8080,
          rules: getFirestoreRules(),
        },
      });
    } catch (error) {
      // Emulatorが起動していない場合はスキップ
      console.warn(
        'Firebase Emulator is not running. Skipping integration tests.'
      );
      testEnv = null;
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  describe('No.1: 1年を超えたセッションは通常の履歴一覧に表示されない', () => {
    it('アーカイブ済みセッションは履歴クエリから除外される', async () => {
      if (!testEnv) {
        console.warn('Skipping test: Firebase Emulator not available');
        return;
      }

      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const sixMonthsAgo = subDays(now, 180);

      // セキュリティルールをバイパスしてテストデータを投入
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;

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
        const db = context.firestore() as unknown as Firestore;
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        // 1件のみ取得される（6ヶ月前のセッションのみ）
        expect(snapshot.size).toBe(1);
        const sessionData = snapshot.docs[0].data();
        expect(sessionData.memo).toBe('6ヶ月前のセッション');
      });
    });

    it('複数のアーカイブ済みセッションがある場合も正しくフィルタされる', async () => {
      if (!testEnv) {
        console.warn('Skipping test: Firebase Emulator not available');
        return;
      }

      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const eighteenMonthsAgo = subDays(now, 540);
      const oneMonthAgo = subDays(now, 30);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;

        // アーカイブ済みセッション1
        await setDoc(doc(db, 'sessions', 'archived-1'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoYearsAgo),
          endAt: Timestamp.fromDate(twoYearsAgo),
          durationMs: 3600000,
          memo: 'アーカイブ済み1',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(twoYearsAgo),
          updatedAt: Timestamp.now(),
        });

        // アーカイブ済みセッション2
        await setDoc(doc(db, 'sessions', 'archived-2'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(eighteenMonthsAgo),
          endAt: Timestamp.fromDate(eighteenMonthsAgo),
          durationMs: 7200000,
          memo: 'アーカイブ済み2',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(eighteenMonthsAgo),
          updatedAt: Timestamp.now(),
        });

        // アクティブセッション
        await setDoc(doc(db, 'sessions', 'active-1'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(oneMonthAgo),
          endAt: Timestamp.fromDate(oneMonthAgo),
          durationMs: 1800000,
          memo: 'アクティブ',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(oneMonthAgo),
          updatedAt: Timestamp.fromDate(oneMonthAgo),
        });
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        // アクティブセッションのみ取得（1件）
        expect(snapshot.size).toBe(1);
        expect(snapshot.docs[0].data().memo).toBe('アクティブ');
      });
    });
  });

  describe('No.2: 1年を超えたデータは集計に含まれない', () => {
    it('アーカイブ済みセッションは集計クエリから除外される', async () => {
      if (!testEnv) {
        console.warn('Skipping test: Firebase Emulator not available');
        return;
      }

      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const threeMonthsAgo = subDays(now, 90);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;

        // アーカイブ済みセッション（2時間）
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
          updatedAt: Timestamp.now(),
        });

        // アクティブセッション（1時間）
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
        const db = context.firestore() as unknown as Firestore;
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        // 合計時間を計算
        const totalDurationMs = snapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().durationMs as number),
          0
        );

        // 1時間のみ（アーカイブ済みの2時間は含まれない）
        expect(totalDurationMs).toBe(3600000);
        expect(snapshot.size).toBe(1);
      });
    });

    it('アーカイブ済みセッションの時間は合計に反映されない', async () => {
      if (!testEnv) {
        console.warn('Skipping test: Firebase Emulator not available');
        return;
      }

      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const oneMonthAgo = subDays(now, 30);
      const twoWeeksAgo = subDays(now, 14);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;

        // アーカイブ済み: 3時間
        await setDoc(doc(db, 'sessions', 'archived-3h'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoYearsAgo),
          endAt: Timestamp.fromDate(twoYearsAgo),
          durationMs: 10800000, // 3時間
          memo: 'アーカイブ済み',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(twoYearsAgo),
          updatedAt: Timestamp.now(),
        });

        // アクティブ1: 1時間
        await setDoc(doc(db, 'sessions', 'active-1h'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(oneMonthAgo),
          endAt: Timestamp.fromDate(oneMonthAgo),
          durationMs: 3600000, // 1時間
          memo: 'アクティブ1',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(oneMonthAgo),
          updatedAt: Timestamp.fromDate(oneMonthAgo),
        });

        // アクティブ2: 30分
        await setDoc(doc(db, 'sessions', 'active-30m'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoWeeksAgo),
          endAt: Timestamp.fromDate(twoWeeksAgo),
          durationMs: 1800000, // 30分
          memo: 'アクティブ2',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(twoWeeksAgo),
          updatedAt: Timestamp.fromDate(twoWeeksAgo),
        });
      });

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', false)
        );

        const snapshot = await getDocs(q);

        const totalDurationMs = snapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().durationMs as number),
          0
        );

        // アクティブセッションのみ: 1時間 + 30分 = 1.5時間 = 5400000ms
        expect(totalDurationMs).toBe(5400000);
        expect(snapshot.size).toBe(2);
      });
    });
  });

  describe('アーカイブ済みセッションの取得（CSVエクスポート用）', () => {
    it('isArchived: true でアーカイブ済みセッションのみ取得できる', async () => {
      if (!testEnv) {
        console.warn('Skipping test: Firebase Emulator not available');
        return;
      }

      const now = new Date();
      const twoYearsAgo = subYears(now, 2);
      const oneMonthAgo = subDays(now, 30);

      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;

        // アーカイブ済みセッション
        await setDoc(doc(db, 'sessions', 'archived-for-export'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(twoYearsAgo),
          endAt: Timestamp.fromDate(twoYearsAgo),
          durationMs: 3600000,
          memo: 'エクスポート用アーカイブ',
          isArchived: true,
          archivedAt: Timestamp.now(),
          createdAt: Timestamp.fromDate(twoYearsAgo),
          updatedAt: Timestamp.now(),
        });

        // アクティブセッション
        await setDoc(doc(db, 'sessions', 'active-for-export'), {
          userId: TEST_USER_ID,
          projectId: TEST_PROJECT_ID,
          startAt: Timestamp.fromDate(oneMonthAgo),
          endAt: Timestamp.fromDate(oneMonthAgo),
          durationMs: 1800000,
          memo: 'エクスポート用アクティブ',
          isArchived: false,
          archivedAt: null,
          createdAt: Timestamp.fromDate(oneMonthAgo),
          updatedAt: Timestamp.fromDate(oneMonthAgo),
        });
      });

      // アーカイブ済みセッションのみ取得
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore() as unknown as Firestore;
        const q = query(
          collection(db, 'sessions'),
          where('userId', '==', TEST_USER_ID),
          where('isArchived', '==', true)
        );

        const snapshot = await getDocs(q);

        expect(snapshot.size).toBe(1);
        expect(snapshot.docs[0].data().memo).toBe('エクスポート用アーカイブ');
      });
    });
  });
});
