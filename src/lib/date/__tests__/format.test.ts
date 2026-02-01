import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatTimeMs,
  formatDuration,
  formatDurationMs,
} from '../format';

describe('formatTime', () => {
  it('0秒を00:00:00に変換する', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });

  it('59秒を00:00:59に変換する', () => {
    expect(formatTime(59)).toBe('00:00:59');
  });

  it('60秒を00:01:00に変換する', () => {
    expect(formatTime(60)).toBe('00:01:00');
  });

  it('3661秒を01:01:01に変換する', () => {
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('36000秒を10:00:00に変換する', () => {
    expect(formatTime(36000)).toBe('10:00:00');
  });
});

describe('formatTimeMs', () => {
  it('0ミリ秒を00:00:00に変換する', () => {
    expect(formatTimeMs(0)).toBe('00:00:00');
  });

  it('1000ミリ秒を00:00:01に変換する', () => {
    expect(formatTimeMs(1000)).toBe('00:00:01');
  });

  it('60000ミリ秒を00:01:00に変換する', () => {
    expect(formatTimeMs(60000)).toBe('00:01:00');
  });

  it('3661000ミリ秒を01:01:01に変換する', () => {
    expect(formatTimeMs(3661000)).toBe('01:01:01');
  });

  it('端数は切り捨てられる', () => {
    expect(formatTimeMs(1500)).toBe('00:00:01');
    expect(formatTimeMs(1999)).toBe('00:00:01');
  });
});

describe('formatDuration', () => {
  it('0分を0分に変換する', () => {
    expect(formatDuration(0)).toBe('0分');
  });

  it('30分を30分に変換する', () => {
    expect(formatDuration(30)).toBe('30分');
  });

  it('60分を1時間に変換する', () => {
    expect(formatDuration(60)).toBe('1時間');
  });

  it('90分を1時間30分に変換する', () => {
    expect(formatDuration(90)).toBe('1時間30分');
  });

  it('120分を2時間に変換する', () => {
    expect(formatDuration(120)).toBe('2時間');
  });

  it('125分を2時間5分に変換する', () => {
    expect(formatDuration(125)).toBe('2時間5分');
  });
});

describe('formatDurationMs', () => {
  it('0ミリ秒を0分に変換する', () => {
    expect(formatDurationMs(0)).toBe('0分');
  });

  it('60000ミリ秒（1分）を1分に変換する', () => {
    expect(formatDurationMs(60000)).toBe('1分');
  });

  it('3600000ミリ秒（1時間）を1時間に変換する', () => {
    expect(formatDurationMs(3600000)).toBe('1時間');
  });

  it('5400000ミリ秒（90分）を1時間30分に変換する', () => {
    expect(formatDurationMs(5400000)).toBe('1時間30分');
  });

  it('端数は切り捨てられる', () => {
    expect(formatDurationMs(90000)).toBe('1分'); // 90秒 = 1分30秒 → 1分
  });
});
