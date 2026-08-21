import { createSession } from '@/services/sessions';
import { isOnline } from '@/services/sync';
import { useOfflineStore } from '@/stores/offlineStore';
import type { CreateSessionInput, Session } from '@/types/session';

/**
 * セッションを保存する
 *
 * オンライン時はFirestoreに保存する。オフライン時、および通信エラー時は
 * オフラインキューに追加し、仮のセッションオブジェクトを返す。
 *
 * @param userId 保存対象のユーザーID
 * @param input セッションの入力値
 * @returns 保存されたセッション（オフライン時は仮生成したセッション）
 */
export const saveSession = async (
  userId: string,
  input: CreateSessionInput
): Promise<Session> => {
  const toQueuedSession = (): Session => {
    const { addCreateSession } = useOfflineStore.getState();
    addCreateSession(input);

    return {
      id: `offline-${Date.now()}`,
      userId,
      ...input,
      isArchived: false,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  // オフラインの場合はキューに追加
  if (!isOnline()) {
    return toQueuedSession();
  }

  try {
    return await createSession(userId, input);
  } catch (error) {
    // オンラインだが通信エラーの場合もキューに追加
    console.error('Failed to create session, queuing for later:', error);
    return toQueuedSession();
  }
};
