'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, TabBar } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { ExportModal } from '@/components/features/settings/ExportModal';
import { LogoutModal } from '@/components/features/settings/LogoutModal';

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { settings, update, isLoading } = useSettings();
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSoundToggle = async () => {
    if (!settings || isUpdating) return;
    setIsUpdating(true);
    try {
      await update({ soundEnabled: !settings.soundEnabled });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!settings || isUpdating) return;

    setIsUpdating(true);
    try {
      if (!settings.browserNotificationEnabled) {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await update({ browserNotificationEnabled: true });
          }
        }
      } else {
        await update({ browserNotificationEnabled: false });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <span className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
          </div>
        </main>
        <TabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">設定</h1>

        {/* 通知設定 */}
        <section className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="font-semibold mb-4">通知設定</h2>

          <div className="flex justify-between items-center min-h-[44px] py-2">
            <span className="text-gray-700">通知音</span>
            <button
              type="button"
              onClick={handleSoundToggle}
              disabled={isUpdating}
              className={`flex items-center min-h-[44px] ${isUpdating ? 'opacity-50' : ''}`}
              aria-label={`通知音を${settings?.soundEnabled ? 'オフ' : 'オン'}にする`}
            >
              <span
                className={`w-12 h-6 rounded-full relative transition-colors inline-block ${
                  settings?.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.soundEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="flex justify-between items-center min-h-[44px] py-2">
            <div>
              <span className="text-gray-700">ブラウザ通知</span>
              <p className="text-sm text-gray-500">ブラウザの許可が必要です</p>
            </div>
            <button
              type="button"
              onClick={handleNotificationToggle}
              disabled={isUpdating}
              className={`flex items-center min-h-[44px] ${isUpdating ? 'opacity-50' : ''}`}
              aria-label={`ブラウザ通知を${settings?.browserNotificationEnabled ? 'オフ' : 'オン'}にする`}
            >
              <span
                className={`w-12 h-6 rounded-full relative transition-colors inline-block ${
                  settings?.browserNotificationEnabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.browserNotificationEnabled ? 'translate-x-6' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </section>

        {/* ポモドーロ */}
        <section className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="font-semibold mb-4">ポモドーロ</h2>
          <Link
            href="/presets"
            className="text-primary-600 hover:underline inline-flex items-center gap-1 min-h-[44px]"
          >
            プリセット管理
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* データ管理 */}
        <section className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="font-semibold mb-4">データ管理</h2>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="text-primary-600 hover:underline inline-flex items-center min-h-[44px]"
          >
            CSVエクスポート
          </button>
        </section>

        {/* アカウント */}
        <section className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h2 className="font-semibold mb-4">アカウント</h2>
          <p className="text-gray-600 mb-2">ログイン中: {user?.email}</p>
          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="text-red-600 hover:underline inline-flex items-center min-h-[44px]"
          >
            ログアウト
          </button>
        </section>

        {/* アプリ情報 */}
        <section className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-4">アプリ情報</h2>
          <p className="text-gray-600">バージョン: 2.0.0</p>
        </section>
      </main>

      <TabBar />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
