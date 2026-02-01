/**
 * 通知音の種類
 */
export type NotificationSound = 'none' | 'bell' | 'chime';

/**
 * ポモドーロプリセットの型定義
 */
export type PomodoroPreset = {
  id: string;
  userId: string;
  name: string;
  focusDurationMinutes: number; // 集中時間（分）
  breakDurationMinutes: number; // 休憩時間（分）
  focusEndSound: NotificationSound; // 集中終了時の通知音
  breakEndSound: NotificationSound; // 休憩終了時の通知音
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * プリセット作成時の入力型
 */
export type CreatePresetInput = {
  name: string;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  focusEndSound: NotificationSound;
  breakEndSound: NotificationSound;
};

/**
 * プリセット更新時の入力型
 */
export type UpdatePresetInput = Partial<CreatePresetInput>;
