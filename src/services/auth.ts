import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

/**
 * Googleアカウントでサインイン
 * @throws FirebaseError 認証失敗時
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);

  // ユーザー情報をFirestoreに保存
  // merge: trueにより、既存ユーザーのcreatedAtは上書きされない
  await setDoc(
    doc(db, 'users', result.user.uid),
    {
      email: result.user.email,
      displayName: result.user.displayName,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return result.user;
}

/**
 * サインアウト
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * 認証状態の変更を監視
 * @param callback 認証状態変更時に呼ばれるコールバック
 * @returns 購読解除関数
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
