/**
 * ステージング環境用テストセッション削除スクリプト
 *
 * ページネーションテスト（3.2）用に作成したテストデータを削除します。
 * [PAGINATION_TEST] プレフィックスが付いたセッションのみを削除します。
 *
 * 使い方:
 *   node scripts/delete-test-sessions-staging.mjs <userId>
 *
 * 引数:
 *   userId - FirestoreのユーザーID（Firebase AuthのUID）
 *
 * 前提条件:
 *   - _local/firebase-service-account.json にサービスアカウントキーを配置
 *   - npm install 済み（firebase-admin が必要）
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// スクリプトのディレクトリを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// サービスアカウントキーのパス
const SERVICE_ACCOUNT_PATH = join(projectRoot, '_local', 'firebase-service-account.json');

// テストセッションを識別するためのプレフィックス
const TEST_MEMO_PREFIX = '[PAGINATION_TEST]';

// コマンドライン引数を取得
const userId = process.argv[2];

// 使い方を表示
function showUsage() {
  console.log(`
使い方: node scripts/delete-test-sessions-staging.mjs <userId>

引数:
  userId - FirestoreのユーザーID（Firebase AuthのUID）

注意:
  このスクリプトは [PAGINATION_TEST] プレフィックスが付いた
  セッションのみを削除します。通常のセッションは削除されません。
`);
}

// メイン処理
async function main() {
  // 引数チェック
  if (!userId) {
    console.error('エラー: userId は必須です。\n');
    showUsage();
    process.exit(1);
  }

  // サービスアカウントキーの存在チェック
  if (!existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`エラー: サービスアカウントキーが見つかりません。`);
    console.error(`パス: ${SERVICE_ACCOUNT_PATH}`);
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
  console.log('テストデータ削除スクリプト');
  console.log('========================================');
  console.log(`ユーザーID: ${userId}`);
  console.log(`削除対象: メモに「${TEST_MEMO_PREFIX}」を含むセッション`);
  console.log('');

  // テストセッションを検索
  console.log('テストセッションを検索中...');

  const sessionsRef = db.collection('sessions');
  const snapshot = await sessionsRef
    .where('userId', '==', userId)
    .get();

  // [PAGINATION_TEST] プレフィックスを含むセッションをフィルタ
  const testSessions = snapshot.docs.filter(doc => {
    const data = doc.data();
    return data.memo && data.memo.startsWith(TEST_MEMO_PREFIX);
  });

  if (testSessions.length === 0) {
    console.log('');
    console.log('削除対象のテストセッションが見つかりませんでした。');
    process.exit(0);
  }

  console.log(`見つかったテストセッション: ${testSessions.length}件`);
  console.log('');
  console.log('削除を開始します...');

  // バッチ削除（Firestoreは1バッチ500件まで）
  const batchSize = 500;
  let deletedCount = 0;

  for (let i = 0; i < testSessions.length; i += batchSize) {
    const batch = db.batch();
    const chunk = testSessions.slice(i, i + batchSize);

    for (const doc of chunk) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deletedCount += chunk.length;
    console.log(`  ${deletedCount}/${testSessions.length}件 削除完了...`);
  }

  console.log('');
  console.log('========================================');
  console.log('✅ 削除完了');
  console.log('========================================');
  console.log(`削除件数: ${deletedCount}件`);
  console.log('');

  process.exit(0);
}

main();
