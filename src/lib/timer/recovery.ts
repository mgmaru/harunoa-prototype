import { useTimerStore } from '@/stores/timerStore';
import { usePomodoroStore } from '@/stores/pomodoroStore';
import { saveSession } from './saveSession';

/**
 * 最終アクティブ時刻からこの時間以上経過していた場合、
 * ブラウザが閉じられていたとみなす（ミリ秒）
 *
 * バックグラウンドタブでは`setInterval`が最大1分間隔まで間引かれるため、
 * ハートビート間隔ではなく1分＋余裕を基準にする。
 */
export const STALE_THRESHOLD_MS = 120_000;

/**
 * 起動時リカバリの結果
 *
 * - `none`: 計測中ではないため何もしなかった
 * - `continued`: 直近までアプリが動作していたため計測を継続した
 * - `saved`: ブラウザクローズを検知し、セッションを確定して保存した
 * - `discarded`: ブラウザクローズを検知したが、作業時間が0のため破棄した
 */
export type TimerRecoveryResult = 'none' | 'continued' | 'saved' | 'discarded';

type RecoverOptions = {
  /**
   * 判定に使う最終アクティブ時刻（Unix timestamp (ms)）
   *
   * ハートビートによって上書きされる前の値を渡すために指定する。
   * 省略時はストアの現在値を使う。
   */
  lastActiveAt?: number | null;
  /** 現在時刻（Unix timestamp (ms)）。テスト用に注入可能。 */
  now?: number;
};

/**
 * ブラウザクローズによって中断された計測を復旧する
 *
 * localStorageに計測中の状態が残っている場合、最終アクティブ時刻を確認し、
 * 閾値を超えていればその時刻でセッションを確定してタイマーをリセットする。
 * 閾値以内であれば（リロード等とみなして）計測をそのまま継続する。
 *
 * @param userId セッションの保存先ユーザーID
 * @param options 判定に使う時刻の上書き
 * @returns リカバリ結果
 */
export const recoverTimerSession = async (
  userId: string,
  options: RecoverOptions = {}
): Promise<TimerRecoveryResult> => {
  const timer = useTimerStore.getState();
  const now = options.now ?? Date.now();
  const lastActiveAt =
    options.lastActiveAt !== undefined ? options.lastActiveAt : timer.lastActiveAt;

  if (timer.status === 'stopped') {
    return 'none';
  }

  // 最終アクティブ時刻が未記録の場合（旧バージョンで開始された計測）は
  // 判定できないため、現在時刻を記録して計測を継続する
  if (!lastActiveAt) {
    timer.heartbeat();
    return 'continued';
  }

  // 閾値以内であればアプリは直前まで動作していた（リロード等）とみなす
  if (now - lastActiveAt <= STALE_THRESHOLD_MS) {
    return 'continued';
  }

  // ブラウザを閉じた時点（＝最終アクティブ時刻）で計測を終了する
  const sessionData = timer.stop(lastActiveAt);
  usePomodoroStore.getState().stop();

  if (!sessionData || sessionData.durationMs <= 0) {
    return 'discarded';
  }

  await saveSession(userId, {
    projectId: sessionData.projectId,
    startAt: sessionData.startAt,
    endAt: sessionData.endAt,
    durationMs: sessionData.durationMs,
    memo: sessionData.memo,
  });

  return 'saved';
};
