import { describe, it, expect } from 'vitest';
import {
  splitSessionByDate,
  isSessionSpanningDays,
  getSessionDurationForDate,
} from '../session-split';

describe('splitSessionByDate', () => {
  it('同じ日のセッションは1つの結果を返す', () => {
    const startAt = new Date('2026-01-21T10:00:00');
    const endAt = new Date('2026-01-21T11:30:00');

    const result = splitSessionByDate(startAt, endAt);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2026-01-21T00:00:00'));
    expect(result[0].durationMs).toBe(90 * 60 * 1000); // 90分
  });

  it('日付を跨ぐセッションは複数の結果を返す', () => {
    // 23:50 - 00:10 (20分)
    const startAt = new Date('2026-01-21T23:50:00');
    const endAt = new Date('2026-01-22T00:10:00');

    const result = splitSessionByDate(startAt, endAt);

    expect(result).toHaveLength(2);
    // 1日目: 23:50 - 24:00 (10分)
    expect(result[0].date).toEqual(new Date('2026-01-21T00:00:00'));
    expect(result[0].durationMs).toBe(10 * 60 * 1000);
    // 2日目: 00:00 - 00:10 (10分)
    expect(result[1].date).toEqual(new Date('2026-01-22T00:00:00'));
    expect(result[1].durationMs).toBe(10 * 60 * 1000);
  });

  it('複数日を跨ぐセッションは各日の結果を返す', () => {
    // 3日間にまたがるセッション
    const startAt = new Date('2026-01-20T22:00:00');
    const endAt = new Date('2026-01-22T02:00:00');

    const result = splitSessionByDate(startAt, endAt);

    expect(result).toHaveLength(3);
    // 1日目: 22:00 - 24:00 (2時間)
    expect(result[0].date).toEqual(new Date('2026-01-20T00:00:00'));
    expect(result[0].durationMs).toBe(2 * 60 * 60 * 1000);
    // 2日目: 00:00 - 24:00 (24時間)
    expect(result[1].date).toEqual(new Date('2026-01-21T00:00:00'));
    expect(result[1].durationMs).toBe(24 * 60 * 60 * 1000);
    // 3日目: 00:00 - 02:00 (2時間)
    expect(result[2].date).toEqual(new Date('2026-01-22T00:00:00'));
    expect(result[2].durationMs).toBe(2 * 60 * 60 * 1000);
  });

  it('開始時刻が終了時刻以上の場合は空配列を返す', () => {
    const sameTime = new Date('2026-01-21T10:00:00');
    expect(splitSessionByDate(sameTime, sameTime)).toEqual([]);

    const startAt = new Date('2026-01-21T12:00:00');
    const endAt = new Date('2026-01-21T10:00:00');
    expect(splitSessionByDate(startAt, endAt)).toEqual([]);
  });

  it('actualDurationMsが指定された場合、按分して返す', () => {
    const startAt = new Date('2026-01-21T10:00:00');
    const endAt = new Date('2026-01-21T11:00:00');
    // 60分経過、実作業30分（30分一時停止）
    const result = splitSessionByDate(startAt, endAt, 30 * 60 * 1000);

    expect(result).toHaveLength(1);
    expect(result[0].durationMs).toBe(30 * 60 * 1000);
  });

  it('日付跨ぎ+actualDurationMsで比率按分する', () => {
    // 23:00 - 01:00 (2時間経過、実作業1時間)
    const startAt = new Date('2026-01-21T23:00:00');
    const endAt = new Date('2026-01-22T01:00:00');
    const actualDurationMs = 60 * 60 * 1000; // 1時間

    const result = splitSessionByDate(startAt, endAt, actualDurationMs);

    expect(result).toHaveLength(2);
    // 1日目: 23:00-00:00 = 1時間/2時間 = 50% → 30分
    expect(result[0].durationMs).toBe(30 * 60 * 1000);
    // 2日目: 00:00-01:00 = 1時間/2時間 = 50% → 30分
    expect(result[1].durationMs).toBe(30 * 60 * 1000);
  });

  it('actualDurationMs按分の丸め誤差を最後のセグメントで補正する', () => {
    // 3日間にまたがるセッション（22:00 - 02:00翌々日 = 28時間経過、実作業10時間）
    const startAt = new Date('2026-01-20T22:00:00');
    const endAt = new Date('2026-01-22T02:00:00');
    const actualDurationMs = 10 * 60 * 60 * 1000; // 10時間

    const result = splitSessionByDate(startAt, endAt, actualDurationMs);

    expect(result).toHaveLength(3);
    // 合計が正確にactualDurationMsと一致すること
    const totalMs = result.reduce((sum, s) => sum + s.durationMs, 0);
    expect(totalMs).toBe(actualDurationMs);
  });

  it('日の境界ぴったりのセッションを正しく処理する', () => {
    // 00:00 - 00:00 (24時間)
    const startAt = new Date('2026-01-21T00:00:00');
    const endAt = new Date('2026-01-22T00:00:00');

    const result = splitSessionByDate(startAt, endAt);

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2026-01-21T00:00:00'));
    expect(result[0].durationMs).toBe(24 * 60 * 60 * 1000);
  });
});

describe('isSessionSpanningDays', () => {
  it('同じ日のセッションはfalseを返す', () => {
    const startAt = new Date('2026-01-21T10:00:00');
    const endAt = new Date('2026-01-21T23:59:59');

    expect(isSessionSpanningDays(startAt, endAt)).toBe(false);
  });

  it('日付を跨ぐセッションはtrueを返す', () => {
    const startAt = new Date('2026-01-21T23:50:00');
    const endAt = new Date('2026-01-22T00:10:00');

    expect(isSessionSpanningDays(startAt, endAt)).toBe(true);
  });

  it('複数日を跨ぐセッションはtrueを返す', () => {
    const startAt = new Date('2026-01-20T10:00:00');
    const endAt = new Date('2026-01-25T10:00:00');

    expect(isSessionSpanningDays(startAt, endAt)).toBe(true);
  });
});

describe('getSessionDurationForDate', () => {
  it('同じ日のセッションの作業時間を返す', () => {
    const startAt = new Date('2026-01-21T10:00:00');
    const endAt = new Date('2026-01-21T11:30:00');
    const targetDate = new Date('2026-01-21T15:00:00'); // 時刻は無視される

    const result = getSessionDurationForDate(startAt, endAt, targetDate);

    expect(result).toBe(90 * 60 * 1000); // 90分
  });

  it('日付を跨ぐセッションの特定日の作業時間を返す', () => {
    const startAt = new Date('2026-01-21T23:50:00');
    const endAt = new Date('2026-01-22T00:10:00');

    // 1日目
    expect(getSessionDurationForDate(startAt, endAt, new Date('2026-01-21'))).toBe(
      10 * 60 * 1000
    );
    // 2日目
    expect(getSessionDurationForDate(startAt, endAt, new Date('2026-01-22'))).toBe(
      10 * 60 * 1000
    );
  });

  it('該当しない日付の場合は0を返す', () => {
    const startAt = new Date('2026-01-21T10:00:00');
    const endAt = new Date('2026-01-21T11:00:00');
    const targetDate = new Date('2026-01-25');

    const result = getSessionDurationForDate(startAt, endAt, targetDate);

    expect(result).toBe(0);
  });
});
