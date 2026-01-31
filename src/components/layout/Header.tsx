'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'ホーム', icon: '🏠' },
  { href: '/timer', label: '計測', icon: '▶️' },
  { href: '/history', label: '履歴', icon: '📋' },
  { href: '/analytics', label: '集計', icon: '📊' },
  { href: '/settings', label: '設定', icon: '⚙️' },
];

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold text-primary-600">
            HaruNoa
          </Link>

          {/* PC用ナビゲーション */}
          <ul className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

/**
 * スマホ用タブバー（画面下部に固定）
 */
export const TabBar = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <ul className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors',
                pathname === item.href
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
