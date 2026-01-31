'use client';

import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        ようこそ、{user?.displayName ?? 'ゲスト'}さん
      </h1>
      <button
        onClick={signOut}
        className="text-red-600 hover:underline"
      >
        ログアウト
      </button>
    </div>
  );
}
