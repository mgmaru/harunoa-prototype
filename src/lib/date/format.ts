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
