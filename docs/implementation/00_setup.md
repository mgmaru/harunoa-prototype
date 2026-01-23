# プロジェクトセットアップ実装指示書

関連ドキュメント：01_tech-stack.md

---

## 概要

Next.js + Firebase構成でHaruNoaプロジェクトを初期化する。

---

## 前提条件

- Node.js 18.x 以上
- npm 9.x 以上
- Firebaseプロジェクト作成済み
- Google Cloud ConsoleでOAuth設定済み

---

## 実装手順

### 1. Next.jsプロジェクト作成

```bash
npx create-next-app@14 harunoa --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 2. 依存パッケージインストール

```bash
npm install firebase zustand chart.js react-chartjs-2 react-hook-form date-fns clsx
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 3. 環境変数設定

`.env.local`を作成：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Firebase初期化

`src/lib/firebase/config.ts`を作成：
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 5. ディレクトリ構造作成

```bash
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/features
mkdir -p src/hooks
mkdir -p src/stores
mkdir -p src/services
mkdir -p src/lib/firebase
mkdir -p src/lib/date
mkdir -p src/lib/validation
mkdir -p src/lib/csv
mkdir -p src/constants
mkdir -p src/types
```

### 6. Tailwind設定

`tailwind.config.ts`を更新：
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

### 7. 基本レイアウト作成

`src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

---

## 確認手順

1. `npm run dev` で開発サーバー起動
2. `http://localhost:3000` にアクセス
3. コンソールにエラーがないことを確認

---

## 次のステップ

→ `01_auth.md`（認証機能の実装）
