/**
 * ページネーションテスト用の大量セッションデータを作成するスクリプト
 *
 * 使い方: node scripts/create-test-sessions.mjs <userId> <projectId>
 *
 * 前提条件:
 * - Firebase Emulatorが起動していること（localhost:8080）
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

// コマンドライン引数からユーザーIDとプロジェクトIDを取得
const userId = process.argv[2];
const projectId = process.argv[3];

if (!userId || !projectId) {
  console.error('使い方: node scripts/create-test-sessions.mjs <userId> <projectId>');
  console.error('');
  console.error('FirestoreからユーザーIDとプロジェクトIDを取得してください:');
  console.error('curl "http://localhost:8080/v1/projects/harunoa-prototype/databases/(default)/documents/projects" | jq');
  process.exit(1);
}

// Firebase設定（Emulator用）
const firebaseConfig = {
  apiKey: 'test-api-key',
  authDomain: 'localhost',
  projectId: 'harunoa-prototype',
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Emulatorに接続
connectFirestoreEmulator(db, 'localhost', 8080);

async function createTestSessions() {
  try {
    console.log(`ユーザーID: ${userId}`);
    console.log(`プロジェクトID: ${projectId}`);

    // 今日の日付で55件のセッションを作成
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsCount = 55; // 50件を超える数
    console.log(`${sessionsCount}件のセッションを作成します...`);

    for (let i = 0; i < sessionsCount; i++) {
      // 各セッションを1時間ごとに配置（分散させる）
      const startHour = 6 + Math.floor(i / 4); // 6時から開始
      const startMinute = (i % 4) * 15; // 0, 15, 30, 45分

      const startAt = new Date(today);
      startAt.setHours(startHour, startMinute, 0, 0);

      // 5〜15分のランダムな長さのセッション
      const durationMinutes = 5 + Math.floor(Math.random() * 10);
      const durationMs = durationMinutes * 60 * 1000;

      const endAt = new Date(startAt.getTime() + durationMs);

      const sessionData = {
        userId,
        projectId,
        startAt: Timestamp.fromDate(startAt),
        endAt: Timestamp.fromDate(endAt),
        durationMs,
        memo: `テストセッション ${i + 1}`,
        isArchived: false,
        archivedAt: null,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await addDoc(collection(db, 'sessions'), sessionData);

      if ((i + 1) % 10 === 0) {
        console.log(`${i + 1}件作成完了...`);
      }
    }

    console.log(`\n✅ ${sessionsCount}件のセッションを作成しました`);
    console.log(`📅 日付: ${today.toLocaleDateString('ja-JP')}`);
    console.log(`\n履歴画面でページネーションを確認してください。`);
    console.log(`1ページ目: 50件表示`);
    console.log(`2ページ目: ${sessionsCount - 50}件表示`);

    process.exit(0);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

createTestSessions();
