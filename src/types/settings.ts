/**
 * ユーザー設定の型定義
 */
export type UserSettings = {
  userId: string;
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  activePomodoroPresetId: string | null;
  updatedAt: Date;
};

/**
 * ユーザー設定更新時の入力型
 */
export type UpdateUserSettingsInput = Partial<
  Pick<UserSettings, 'soundEnabled' | 'browserNotificationEnabled' | 'activePomodoroPresetId'>
>;
