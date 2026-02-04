/**
 * ステージング環境用テストセッション作成スクリプト
 *
 * ページネーションテスト（3.2）のために51件以上のセッションを作成します。
 *
 * 使い方:
 *   node scripts/create-test-sessions-staging.mjs <userId> <projectId>
 *
 * 引数:
 *   userId    - FirestoreのユーザーID（Firebase AuthのUID）
 *   projectId - テスト対象のプロジェクトID
 *
 * 前提条件:
 *   - _local/firebase-service-account.json にサービスアカウントキーを配置
 *   - npm install 済み（firebase-admin が必要）
 *
 * サービスアカウントキーの取得方法:
 *   1. Firebase Console (https://console.firebase.google.com) にアクセス
 *   2. プロジェクト「harunoa-4cb92」を選択
 *   3. 歯車アイコン → プロジェクトの設定
 *   4. サービスアカウント タブ
 *   5. 「新しい秘密鍵の生成」をクリック
 *   6. ダウンロードしたJSONを _local/firebase-service-account.json に配置
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// スクリプトのディレクトリを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// サービスアカウントキーのパス
const SERVICE_ACCOUNT_PATH = join(projectRoot, '_local', 'firebase-service-account.json');

// 作成するセッション数（ページネーションテストには51件以上必要）
const SESSIONS_COUNT = 55;

// テストセッションを識別するためのプレフィックス
const TEST_MEMO_PREFIX = '[PAGINATION_TEST]';

// コマンドライン引数を取得
const userId = process.argv[2];
const projectId = process.argv[3];

// 使い方を表示
function showUsage() {
  console.log(`
使い方: node scripts/create-test-sessions-staging.mjs <userId> <projectId>

引数:
  userId    - FirestoreのユーザーID（Firebase AuthのUID）
  projectId - テスト対象のプロジェクトID

ユーザーIDの確認方法:
  1. ステージング環境（https://harunoa-prototype.vercel.app）にログイン
  2. ブラウザの開発者ツール → Application → IndexedDB → firebaseLocalStorageDb
  3. または Firebase Console → Authentication → Users からUIDを確認

プロジェクトIDの確認方法:
  1. Firebase Console → Firestore Database → projects コレクション
  2. 該当ユーザーのプロジェクトドキュメントIDをコピー
`);
}

// メイン処理
async function main() {
  // 引数チェック
  if (!userId || !projectId) {
    console.error('エラー: userId と projectId は必須です。\n');
    showUsage();
    process.exit(1);
  }

  // サービスアカウントキーの存在チェック
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`エラー: サービスアカウントキーが見つかりません。`);
    console.error(`パス: ${SERVICE_ACCOUNT_PATH}\n`);
    console.error('サービスアカウントキーの取得方法:');
    console.error('  1. Firebase Console (https://console.firebase.google.com) にアクセス');
    console.error('  2. プロジェクト「harunoa-4cb92」を選択');
    console.error('  3. 歯車アイコン → プロジェクトの設定');
    console.error('  4. サービスアカウント タブ');
    console.error('  5. 「新しい秘密鍵の生成」をクリック');
    console.error('  6. ダウンロードしたJSONを _local/firebase-service-account.json に配置');
    process.exit(1);
  }

  // サービスアカウントキーを読み込み
  let serviceAccount;
  try {
    const keyContent = readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8');
    serviceAccount = JSON.parse(keyContent);
  } catch (error) {
    console.error('エラー: サービスアカウントキーの読み込みに失敗しました。');
    console.error(error.message);
    process.exit(1);
  }

  // Firebase Admin SDK を初期化
  initializeApp({
    credential: cert(serviceAccount),
  });

  const db = getFirestore();

  console.log('========================================');
  console.log('ステージング環境テストデータ作成スクリプト');
  console.log('========================================');
  console.log(`ユーザーID: ${userId}`);
  console.log(`プロジェクトID: ${projectId}`);
  console.log(`作成件数: ${SESSIONS_COUNT}件`);
  console.log('');

  // 今日の日付（JST 0時）
  const today = new Date();
  const todayJST = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

  console.log(`対象日付: ${todayJST.toLocaleDateString('ja-JP')}`);
  console.log('');
  console.log('セッションを作成中...');

  const batch = db.batch();
  const sessionsRef = db.collection('sessions');
  const createdIds = [];

  for (let i = 0; i < SESSIONS_COUNT; i++) {
    // 各セッションを15分間隔で配置（6時から開始）
    const startHour = 6 + Math.floor(i / 4);
    const startMinute = (i % 4) * 15;

    const startAt = new Date(todayJST);
    startAt.setHours(startHour, startMinute, 0, 0);

    // 5〜15分のランダムな長さ
    const durationMinutes = 5 + Math.floor(Math.random() * 10);
    const durationMs = durationMinutes * 60 * 1000;
    const endAt = new Date(startAt.getTime() + durationMs);

    const now = new Date();

    const sessionData = {
      userId,
      projectId,
      startAt: Timestamp.fromDate(startAt),
      endAt: Timestamp.fromDate(endAt),
      durationMs,
      memo: `${TEST_MEMO_PREFIX} テストセッション ${i + 1}`,
      isArchived: false,
      archivedAt: null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const newDocRef = sessionsRef.doc();
    batch.set(newDocRef, sessionData);
    createdIds.push(newDocRef.id);

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${SESSIONS_COUNT}件 準備完了...`);
    }
  }

  // バッチコミット
  try {
    await batch.commit();
    console.log('');
    console.log('========================================');
    console.log('✅ 作成完了');
    console.log('========================================');
    console.log(`作成件数: ${SESSIONS_COUNT}件`);
    console.log(`対象日付: ${todayJST.toLocaleDateString('ja-JP')}`);
    console.log('');
    console.log('【テスト手順】');
    console.log('1. ステージング環境にログイン');
    console.log('2. 履歴画面を開く');
    console.log('3. 「今日」フィルタを選択');
    console.log('4. 1ページ目に50件表示されることを確認');
    console.log('5. 「次へ」ボタンをクリック');
    console.log('6. 2ページ目に5件表示されることを確認');
    console.log('7. 「前へ」ボタンをクリック');
    console.log('8. 1ページ目に戻ることを確認');
    console.log('');
    console.log('【テストデータの削除】');
    console.log('テスト完了後、以下のコマンドでテストデータを削除できます:');
    console.log(`  node scripts/delete-test-sessions-staging.mjs ${userId}`);
    console.log('');
  } catch (error) {
    console.error('エラー: セッションの作成に失敗しました。');
    console.error(error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
