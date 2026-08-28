import { format } from 'date-fns';

/**
 * 日付を「YYYY/MM/DD」形式でフォーマット
 */
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy/MM/dd');
};

/**
 * 日付を「YYYY/MM/DD HH:mm」形式でフォーマット
 */
export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy/MM/dd HH:mm');
};

/**
 * 分数を「X時間Y分」形式でフォーマット
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return '0分';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}分`;
  }

  if (mins === 0) {
    return `${hours}時間`;
  }

  return `${hours}時間${mins}分`;
};

/**
 * 秒数を「HH:MM:SS」形式でフォーマット
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number): string => n.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

/**
 * ミリ秒を「HH:MM:SS」形式でフォーマット
 */
export const formatTimeMs = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  return formatTime(totalSeconds);
};

/**
 * ミリ秒を「X時間Y分」形式でフォーマット
 */
export const formatDurationMs = (ms: number): string => {
  const minutes = Math.floor(ms / 1000 / 60);
  return formatDuration(minutes);
};

/**
 * 一時停止時間の内訳を表示する下限（1分）
 *
 * 計測時間は分単位で表示するため、これ未満の一時停止は「0分」となり
 * 情報にならない。内訳を出さず計測時間のみを表示する。
 */
export const PAUSED_DISPLAY_THRESHOLD_MS = 60 * 1000;

/**
 * セッションの一時停止時間（ミリ秒）を算出
 *
 * durationMs は一時停止を除いた計測時間のため、経過時間との差分が一時停止時間となる。
 * ポモドーロの休憩中はタイマーが止まらないため、休憩時間は計測時間に含まれる。
 */
export const getPausedMs = (
  startAt: Date,
  endAt: Date,
  durationMs: number
): number => {
  const elapsedMs = endAt.getTime() - startAt.getTime();
  return Math.max(elapsedMs - durationMs, 0);
};

/**
 * セッションの時間表記をフォーマット
 *
 * 一時停止がある場合のみ内訳を表示する。
 *
 * @example
 * // 一時停止なし
 * formatSessionDuration(start, end, 3600000); // => '1時間'
 * // 一時停止あり
 * formatSessionDuration(start, end, 13800000); // => '計測 3時間50分 / 一時停止 10分'
 */
export const formatSessionDuration = (
  startAt: Date,
  endAt: Date,
  durationMs: number
): string => {
  const pausedMs = getPausedMs(startAt, endAt, durationMs);

  if (pausedMs < PAUSED_DISPLAY_THRESHOLD_MS) {
    return formatDurationMs(durationMs);
  }

  return `計測 ${formatDurationMs(durationMs)} / 一時停止 ${formatDurationMs(pausedMs)}`;
};
