import { startOfDay, endOfDay, differenceInMilliseconds, addDays } from 'date-fns';

/**
 * 日付ごとに分割されたセッション情報
 */
export type SplitSession = {
  /** 対象日（その日の00:00:00） */
  date: Date;
  /** その日の作業時間（ミリ秒） */
  durationMs: number;
};

/**
 * セッションを日付ごとに分割する
 *
 * 日付を跨いだセッションを、各日の作業時間に按分する。
 *
 * @example
 * // 23:50 - 00:10 のセッション（20分）
 * splitSessionByDate(
 *   new Date('2026-01-21T23:50:00'),
 *   new Date('2026-01-22T00:10:00')
 * );
 * // => [
 * //   { date: 2026-01-21 00:00, durationMs: 600000 }, // 10分
 * //   { date: 2026-01-22 00:00, durationMs: 600000 }, // 10分
 * // ]
 *
 * @param startAt セッション開始時刻
 * @param endAt セッション終了時刻
 * @returns 日付ごとに分割されたセッション配列
 */
export const splitSessionByDate = (startAt: Date, endAt: Date): SplitSession[] => {
  // バリデーション
  if (startAt >= endAt) {
    return [];
  }

  const result: SplitSession[] = [];
  let current = startAt;

  while (current < endAt) {
    const dayEnd = endOfDay(current);
    // その日の終了時刻（セッション終了かその日の終わりのいずれか早い方）
    const segmentEnd = dayEnd < endAt ? addMillisecond(dayEnd) : endAt;

    const durationMs = differenceInMilliseconds(segmentEnd, current);

    if (durationMs > 0) {
      result.push({
        date: startOfDay(current),
        durationMs: Math.min(durationMs, 24 * 60 * 60 * 1000), // 1日最大24時間
      });
    }

    // 次の日の開始に移動
    current = startOfDay(addDays(current, 1));
  }

  return result;
};

/**
 * 1ミリ秒追加する（日付境界を超えるため）
 */
const addMillisecond = (date: Date): Date => {
  return new Date(date.getTime() + 1);
};

/**
 * セッションが日付を跨いでいるかを判定
 *
 * @param startAt セッション開始時刻
 * @param endAt セッション終了時刻
 * @returns 日付を跨いでいる場合true
 */
export const isSessionSpanningDays = (startAt: Date, endAt: Date): boolean => {
  const startDay = startOfDay(startAt);
  const endDay = startOfDay(endAt);
  return startDay.getTime() !== endDay.getTime();
};

/**
 * 特定の日付に該当するセッションの作業時間を計算
 *
 * @param startAt セッション開始時刻
 * @param endAt セッション終了時刻
 * @param targetDate 対象日
 * @returns その日の作業時間（ミリ秒）。該当しない場合は0
 */
export const getSessionDurationForDate = (
  startAt: Date,
  endAt: Date,
  targetDate: Date
): number => {
  const splits = splitSessionByDate(startAt, endAt);
  const targetDayStart = startOfDay(targetDate).getTime();

  const found = splits.find((s) => s.date.getTime() === targetDayStart);
  return found?.durationMs ?? 0;
};
