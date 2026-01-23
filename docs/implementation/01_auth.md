# 認証機能 実装指示書

対象画面：SCR-001（ログイン画面）
関連ドキュメント：screen_specifications.md 6.1節

---

## 概要

Google OAuth認証を実装し、認証状態に基づいてルーティングを制御する。

---

## 前提条件

- `00_setup.md`が完了していること
- Firebase ConsoleでGoogle認証が有効化されていること

---

## 実装手順

### 1. 認証関数の実装

`src/services/auth.ts`:
```typescript
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  
  // ユーザー情報をFirestoreに保存
  await setDoc(doc(db, 'users', result.user.uid), {
    email: result.user.email,
    displayName: result.user.displayName,
    lastLoginAt: serverTimestamp(),
  }, { merge: true });
  
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  return firebaseOnAuthStateChanged(auth, callback);
}
```

### 2. 認証ストアの実装

`src/stores/authStore.ts`:
```typescript
import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### 3. 認証フックの実装

`src/hooks/useAuth.ts`:
```typescript
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { onAuthStateChanged, signInWithGoogle, signOut } from '@/services/auth';

export function useAuth() {
  const { user, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, [setUser]);

  return {
    user,
    isLoading,
    signIn: signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}
```

### 4. ログインページの実装

`src/app/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      router.push('/');
    } catch (e) {
      setError('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">HaruNoa</h1>
          <p className="text-gray-600">作業時間を記録・可視化するツール</p>
        </div>
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoading ? (
            <span>ログイン中...</span>
          ) : (
            <>
              <GoogleIcon />
              <span>Googleでログイン</span>
            </>
          )}
        </button>
        
        {error && (
          <p className="mt-4 text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      {/* Google icon SVG path */}
    </svg>
  );
}
```

### 5. 認証レイアウトの実装

`src/app/(auth)/layout.tsx`:
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 6. ホームページプレースホルダー

`src/app/(auth)/page.tsx`:
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ようこそ、{user?.displayName}さん</h1>
      <button
        onClick={signOut}
        className="text-red-600 hover:underline"
      >
        ログアウト
      </button>
    </div>
  );
}
```

---

## バリデーション

| 条件 | エラーメッセージ |
|------|------------------|
| Google認証失敗 | 「ログインに失敗しました。もう一度お試しください。」 |
| 通信エラー | 「通信エラーが発生しました。ネットワーク接続を確認してください。」 |

---

## テスト観点

- [ ] Googleログインボタンが表示される
- [ ] ログイン成功でホーム画面に遷移する
- [ ] ログイン失敗でエラーメッセージが表示される
- [ ] 未認証でホームにアクセスするとログインに遷移
- [ ] ログアウトでログイン画面に遷移
- [ ] 通信エラー時に「通信エラーが発生しました。ネットワーク接続を確認してください。」と表示される
- [ ] 未認証で /timer, /history, /analytics, /settings 等に直接アクセスするとログイン画面に遷移する

### セキュリティ

- [ ] 他ユーザーのプロジェクトデータにアクセスできない
- [ ] 他ユーザーのセッションデータにアクセスできない
- [ ] Firestoreセキュリティルールが正しく動作する（不正なリクエストを拒否）

---

## 次のステップ

→ `02_project-management.md`（プロジェクト管理の実装）
