import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserSettings, UpdateUserSettingsInput } from '@/types/settings';

/**
 * Firestoreに保存されるユーザー設定ドキュメントの型
 */
type UserSettingsDocument = {
  userId: string;
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  activePomodoroPresetId: string | null;
  updatedAt: Timestamp;
};

const USER_SETTINGS_COLLECTION = 'userSettings';

/**
 * デフォルトのユーザー設定
 */
const getDefaultSettings = (userId: string): Omit<UserSettings, 'updatedAt'> => ({
  userId,
  soundEnabled: false, // デフォルトOFF
  browserNotificationEnabled: true, // デフォルトON
  activePomodoroPresetId: null,
});

/**
 * ユーザー設定を取得
 * 存在しない場合はデフォルト設定を作成して返す
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    const defaults = getDefaultSettings(userId);
    await setDoc(docRef, { ...defaults, updatedAt: serverTimestamp() });
    return { ...defaults, updatedAt: new Date() };
  }

  const data = snapshot.data() as UserSettingsDocument;
  return {
    userId: data.userId,
    soundEnabled: data.soundEnabled,
    browserNotificationEnabled: data.browserNotificationEnabled,
    activePomodoroPresetId: data.activePomodoroPresetId,
    updatedAt: data.updatedAt.toDate(),
  };
};

/**
 * ユーザー設定を更新
 */
export const updateUserSettings = async (
  userId: string,
  input: UpdateUserSettingsInput
): Promise<void> => {
  const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  await setDoc(
    docRef,
    { ...input, updatedAt: serverTimestamp() },
    { merge: true }
  );
};
