/**
 * REST APIを使用してテストセッションを作成するスクリプト
 * Firebase Emulatorのセキュリティルールをバイパスして直接データを作成
 */

const userId = process.argv[2] || 'rA4hzGqVOcMWyL8weNytvenddfUm';
const projectId = process.argv[3] || 'CRcrODxbsefTPGYsSiBU';

const EMULATOR_HOST = 'localhost:8080';
const FIREBASE_PROJECT = 'harunoa-4cb92';
const DATABASE = '(default)';

// 今日の日付（JSTで0時を設定）
const today = new Date();
// JSTで今日の0時
const todayJST = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

console.log('ユーザーID:', userId);
console.log('プロジェクトID:', projectId);
console.log('日付 (JST):', todayJST.toLocaleDateString('ja-JP'));

async function createSession(index) {
  const startHour = 6 + Math.floor(index / 4);
  const startMinute = (index % 4) * 15;

  const startAt = new Date(todayJST);
  startAt.setHours(startHour, startMinute, 0, 0);

  const durationMinutes = 5 + Math.floor(Math.random() * 10);
  const durationMs = durationMinutes * 60 * 1000;
  const endAt = new Date(startAt.getTime() + durationMs);

  const now = new Date();

  const fields = {
    userId: { stringValue: userId },
    projectId: { stringValue: projectId },
    startAt: { timestampValue: startAt.toISOString() },
    endAt: { timestampValue: endAt.toISOString() },
    durationMs: { integerValue: durationMs.toString() },
    memo: { stringValue: 'テストセッション ' + (index + 1) },
    isArchived: { booleanValue: false },
    archivedAt: { nullValue: null },
    createdAt: { timestampValue: now.toISOString() },
    updatedAt: { timestampValue: now.toISOString() },
  };

  const url = 'http://' + EMULATOR_HOST + '/v1/projects/' + FIREBASE_PROJECT + '/databases/' + DATABASE + '/documents/sessions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error('Failed to create session: ' + response.status + ' ' + error);
  }

  return await response.json();
}

async function main() {
  const sessionsCount = 55;
  console.log(sessionsCount + '件のセッションを作成します...');

  for (let i = 0; i < sessionsCount; i++) {
    try {
      await createSession(i);
      if ((i + 1) % 10 === 0) {
        console.log((i + 1) + '件作成完了...');
      }
    } catch (error) {
      console.error('セッション ' + (i + 1) + ' の作成に失敗:', error.message);
      process.exit(1);
    }
  }

  console.log('\n✅ ' + sessionsCount + '件のセッションを作成しました');
  console.log('📅 日付:', todayJST.toLocaleDateString('ja-JP'));
  console.log('\n履歴画面でページネーションを確認してください。');
  console.log('1ページ目: 50件表示');
  console.log('2ページ目: ' + (sessionsCount - 50) + '件表示');
}

main();
