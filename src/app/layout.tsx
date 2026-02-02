import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HaruNoa - 作業時間可視化ツール',
  description: 'プロジェクト単位で作業時間を記録・可視化するツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans">{children}</body>
    </html>
  );
}
