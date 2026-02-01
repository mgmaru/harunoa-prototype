import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  PomodoroPreset,
  CreatePresetInput,
  UpdatePresetInput,
  NotificationSound,
} from '@/types/preset';

/**
 * Firestoreに保存されるプリセットドキュメントの型
 */
type PresetDocument = {
  userId: string;
  name: string;
  focusDurationMinutes: number;
  breakDurationMinutes: number;
  focusEndSound: NotificationSound;
  breakEndSound: NotificationSound;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const PRESETS_COLLECTION = 'pomodoroPresets';

/**
 * Firestore DocumentからPomodoroPreset型に変換
 */
const toPreset = (id: string, data: PresetDocument): PomodoroPreset => ({
  id,
  userId: data.userId,
  name: data.name,
  focusDurationMinutes: data.focusDurationMinutes,
  breakDurationMinutes: data.breakDurationMinutes,
  focusEndSound: data.focusEndSound,
  breakEndSound: data.breakEndSound,
  isActive: data.isActive,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
});

/**
 * プリセットを作成
 */
export const createPreset = async (
  userId: string,
  input: CreatePresetInput
): Promise<PomodoroPreset> => {
  const docData = {
    userId,
    name: input.name,
    focusDurationMinutes: input.focusDurationMinutes,
    breakDurationMinutes: input.breakDurationMinutes,
    focusEndSound: input.focusEndSound,
    breakEndSound: input.breakEndSound,
    isActive: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PRESETS_COLLECTION), docData);

  const now = new Date();
  return {
    id: docRef.id,
    userId,
    ...input,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * ユーザーのプリセット一覧を取得（作成順）
 */
export const getPresets = async (userId: string): Promise<PomodoroPreset[]> => {
  const q = query(
    collection(db, PRESETS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) =>
    toPreset(docSnap.id, docSnap.data() as PresetDocument)
  );
};

/**
 * プリセットを更新
 */
export const updatePreset = async (
  presetId: string,
  input: UpdatePresetInput
): Promise<void> => {
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  if (input.focusDurationMinutes !== undefined) {
    updateData.focusDurationMinutes = input.focusDurationMinutes;
  }
  if (input.breakDurationMinutes !== undefined) {
    updateData.breakDurationMinutes = input.breakDurationMinutes;
  }
  if (input.focusEndSound !== undefined) {
    updateData.focusEndSound = input.focusEndSound;
  }
  if (input.breakEndSound !== undefined) {
    updateData.breakEndSound = input.breakEndSound;
  }

  await updateDoc(doc(db, PRESETS_COLLECTION, presetId), updateData);
};

/**
 * プリセットを削除
 */
export const deletePreset = async (presetId: string): Promise<void> => {
  await deleteDoc(doc(db, PRESETS_COLLECTION, presetId));
};

/**
 * プリセットをアクティブに設定
 * 他のプリセットは非アクティブになる
 */
export const setActivePreset = async (
  userId: string,
  presetId: string
): Promise<void> => {
  const presets = await getPresets(userId);
  const batch = writeBatch(db);

  for (const preset of presets) {
    if (preset.id === presetId && !preset.isActive) {
      batch.update(doc(db, PRESETS_COLLECTION, preset.id), {
        isActive: true,
        updatedAt: serverTimestamp(),
      });
    } else if (preset.id !== presetId && preset.isActive) {
      batch.update(doc(db, PRESETS_COLLECTION, preset.id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
};

/**
 * アクティブなプリセットを解除
 */
export const clearActivePreset = async (
  userId: string,
  presetId: string
): Promise<void> => {
  await updateDoc(doc(db, PRESETS_COLLECTION, presetId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
};

/**
 * デフォルトプリセットを確保（なければ作成）
 * ユーザー初回ログイン時に呼び出す
 */
export const ensureDefaultPreset = async (userId: string): Promise<void> => {
  const presets = await getPresets(userId);

  if (presets.length === 0) {
    const defaultPreset = await createPreset(userId, {
      name: 'デフォルト',
      focusDurationMinutes: 25,
      breakDurationMinutes: 5,
      focusEndSound: 'bell',
      breakEndSound: 'chime',
    });
    await setActivePreset(userId, defaultPreset.id);
  }
};
