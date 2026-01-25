# 通知機能 実装指示書

関連ドキュメント：requirements.md 5.7節、screen_specifications.md 7.1節

---

## 概要

ポモドーロの「集中終了」「休憩終了」を通知する機能を実装する。
通知手段は**通知音**と**ブラウザ通知**の2種類を提供する。

---

## 前提条件

- `08_pomodoro.md`が完了していること
- `06_settings.md`のユーザー設定APIが完了していること

---

## 基本仕様

### 通知の種類

| 通知タイミング | 内容 |
|----------------|------|
| 集中終了 | 「集中時間終了 - 休憩を取りましょう」 |
| 休憩終了 | 「休憩終了 - 次の集中を開始できます」 |

### 通知手段

| 手段 | デフォルト | 備考 |
|------|-----------|------|
| 通知音 | **OFF** | 集中を妨げないため |
| ブラウザ通知 | **ON** | 許可が必要 |

### アプリ内通知（フォールバック）

- ブラウザ通知が許可されていない場合、**画面上部にバナー形式で表示**
- バナーは**5秒後に自動消去**（または手動で閉じる）

---

## 通知音ファイル

### ファイル配置

```
public/
└── sounds/
    ├── bell.mp3       # ベル音
    ├── chime.mp3      # チャイム音
    └── ding.mp3       # ディング音
```

### 音声ファイル仕様

| 項目 | 仕様 |
|------|------|
| 形式 | MP3（ブラウザ互換性のため） |
| 長さ | 1〜3秒 |
| 音量 | 適度な音量（端末側で調整） |

### NotificationSound型（既存）

```typescript
// types/preset.ts
export type NotificationSound = 'none' | 'bell' | 'chime' | 'ding';
```

---

## 実装手順

### 1. 通知フック

`src/hooks/useNotification.ts`:
```typescript
'use client';

import { useCallback, useRef } from 'react';
import { useSettings } from './useSettings';
import { useToastStore } from '@/stores/toastStore';

interface NotifyOptions {
  title: string;
  message: string;
  sound?: 'focus' | 'break' | null;
}

export function useNotification() {
  const { settings } = useSettings();
  const { addToast } = useToastStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 通知音を再生
  const playSound = useCallback((soundType: 'focus' | 'break') => {
    if (!settings?.soundEnabled) return;

    // プリセットの設定から音を取得（簡易実装）
    // 実際にはアクティブなプリセットの focusSound / breakSound を使用
    const soundFile = soundType === 'focus' ? 'bell.mp3' : 'chime.mp3';

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(`/sounds/${soundFile}`);
    audioRef.current.play().catch((e) => {
      console.warn('Audio playback failed:', e);
    });
  }, [settings?.soundEnabled]);

  // ブラウザ通知を送信
  const sendBrowserNotification = useCallback((title: string, message: string) => {
    if (!settings?.browserNotificationEnabled) return;

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icons/icon-192.png',
        tag: 'harunoa-pomodoro',
      });
    } else if (Notification.permission === 'default') {
      // 許可をリクエスト
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/icons/icon-192.png',
            tag: 'harunoa-pomodoro',
          });
        }
      });
    }
  }, [settings?.browserNotificationEnabled]);

  // アプリ内通知（フォールバック）
  const showInAppNotification = useCallback((title: string, message: string) => {
    addToast({
      type: 'info',
      title,
      message,
      duration: 5000,
    });
  }, [addToast]);

  // 統合通知関数
  const notify = useCallback(({ title, message, sound }: NotifyOptions) => {
    // 通知音
    if (sound) {
      playSound(sound);
    }

    // ブラウザ通知
    if (settings?.browserNotificationEnabled) {
      if (Notification.permission === 'granted') {
        sendBrowserNotification(title, message);
      } else {
        // ブラウザ通知が使えない場合はアプリ内通知
        showInAppNotification(title, message);
      }
    } else {
      // ブラウザ通知がOFFの場合もアプリ内通知
      showInAppNotification(title, message);
    }
  }, [settings?.browserNotificationEnabled, playSound, sendBrowserNotification, showInAppNotification]);

  return {
    notify,
    playSound,
    sendBrowserNotification,
    showInAppNotification,
  };
}
```

### 2. トーストストア

`src/stores/toastStore.ts`:
```typescript
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // 自動削除
    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),
}));
```

### 3. トーストコンポーネント

`src/components/ui/Toast.tsx`:
```typescript
'use client';

import { useToastStore } from '@/stores/toastStore';
import { clsx } from 'clsx';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
  };
  onClose: () => void;
}

function Toast({ toast, onClose }: ToastProps) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[toast.type];

  return (
    <div
      className={clsx(
        'min-w-[300px] max-w-[400px] rounded-lg shadow-lg text-white p-4',
        bgColor
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          {toast.title && (
            <p className="font-semibold mb-1">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white/80 hover:text-white"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

### 4. 通知バナーコンポーネント（集中モード用）

`src/components/features/focus/NotificationBanner.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface Props {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'focus' | 'break';
  onClose: () => void;
}

export function NotificationBanner({ isVisible, title, message, type, onClose }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // 5秒後に自動で閉じる
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!show) return null;

  const bgColor = type === 'focus' ? 'bg-green-600' : 'bg-blue-600';

  return (
    <div
      className={clsx(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50',
        'min-w-[300px] rounded-lg shadow-lg text-white p-4',
        bgColor,
        'animate-slide-down'
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className="ml-4 text-white/80 hover:text-white text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

### 5. 通知設定の実装

`src/components/features/settings/NotificationSettings.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

export function NotificationSettings() {
  const { settings, update, isLoading } = useSettings();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleSoundToggle = async () => {
    await update({ soundEnabled: !settings?.soundEnabled });
  };

  const handleNotificationToggle = async () => {
    if (!settings?.browserNotificationEnabled) {
      // ONにする場合は許可をリクエスト
      if (notificationPermission === 'default') {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          await update({ browserNotificationEnabled: true });
        }
      } else if (notificationPermission === 'granted') {
        await update({ browserNotificationEnabled: true });
      }
    } else {
      // OFFにする
      await update({ browserNotificationEnabled: false });
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div className="space-y-4">
      {/* 通知音 */}
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">通知音</span>
          <p className="text-sm text-gray-500">
            ポモドーロ終了時に音で通知します
          </p>
        </div>
        <Toggle
          checked={settings?.soundEnabled || false}
          onChange={handleSoundToggle}
        />
      </div>

      {/* ブラウザ通知 */}
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">ブラウザ通知</span>
          <p className="text-sm text-gray-500">
            {notificationPermission === 'denied'
              ? 'ブラウザで通知がブロックされています'
              : notificationPermission === 'granted'
              ? '通知が許可されています'
              : 'ブラウザの許可が必要です'}
          </p>
        </div>
        <Toggle
          checked={settings?.browserNotificationEnabled || false}
          onChange={handleNotificationToggle}
          disabled={notificationPermission === 'denied'}
        />
      </div>

      {/* ブロック時の案内 */}
      {notificationPermission === 'denied' && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
          ブラウザの設定から通知を許可してください。
          許可後、ページを再読み込みしてください。
        </p>
      )}
    </div>
  );
}

// トグルコンポーネント
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        'w-12 h-6 rounded-full relative transition-colors',
        checked ? 'bg-primary-600' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform',
          checked ? 'translate-x-6' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}
```

### 6. 通知音付きプリセット対応

`src/hooks/useNotification.ts`を更新して、プリセットの通知音設定を使用:

```typescript
import { usePresets } from './usePresets';

export function useNotification() {
  const { settings } = useSettings();
  const { activePreset } = usePresets();
  // ...

  const playSound = useCallback((soundType: 'focus' | 'break') => {
    if (!settings?.soundEnabled) return;

    // アクティブなプリセットから音を取得
    const soundName = soundType === 'focus'
      ? activePreset?.focusSound
      : activePreset?.breakSound;

    if (!soundName || soundName === 'none') return;

    const soundFile = `${soundName}.mp3`;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(`/sounds/${soundFile}`);
    audioRef.current.play().catch((e) => {
      console.warn('Audio playback failed:', e);
    });
  }, [settings?.soundEnabled, activePreset]);

  // ...
}
```

### 7. レイアウトへの組み込み

`src/app/(auth)/layout.tsx`:
```typescript
import { ToastContainer } from '@/components/ui/Toast';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // ...
  return (
    <>
      <ToastContainer />
      {/* 既存のコンテンツ */}
      {children}
    </>
  );
}
```

---

## アニメーション

`src/app/globals.css`に追加:
```css
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
```

---

## ユーザー設定のデフォルト値

| 設定項目 | デフォルト | 理由 |
|----------|-----------|------|
| soundEnabled | false | 集中を妨げないため |
| browserNotificationEnabled | true | 画面から離れていても気づけるように |

---

## 注意事項

### ブラウザの通知許可

- ユーザー操作（ボタンクリックなど）から呼び出さないと許可ダイアログが表示されない
- 一度「ブロック」されると、ブラウザ設定からしか変更できない

### 音声再生の制限

- モバイルブラウザではユーザー操作後でないと音声再生ができない場合がある
- 計測開始（ユーザー操作）後であれば再生可能

### 通知音ファイル

- ファイルサイズを小さく保つ（100KB以下推奨）
- 著作権フリーの音源を使用すること

---

## 完了

これでポモドーロ機能と通知機能の実装指示書が完成しました。
