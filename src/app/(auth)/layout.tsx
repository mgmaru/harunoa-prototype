'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { saveRedirectPath } from '@/lib/auth/redirect';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ToastContainer } from '@/components/ui/Toast';
import { useOfflineStore } from '@/stores/offlineStore';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // アプリ起動時にisSyncingフラグをリセット（ページ遷移やクラッシュで残った場合の救済）
  useEffect(() => {
    const offlineState = useOfflineStore.getState();
    if (offlineState.isSyncing) {
      offlineState.setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 現在のパスを保存してからログイン画面へリダイレクト
      saveRedirectPath(pathname);
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

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

  return (
    <>
      <ToastContainer />
      <OfflineBanner />
      {children}
    </>
  );
}
