/**
 * 認証リダイレクト関連のユーティリティ
 */

/** sessionStorageのキー */
const REDIRECT_KEY = 'harunoa-redirect-after-login';

/** リダイレクトを許可するパスのプレフィックス */
const ALLOWED_PATHS = ['/', '/timer', '/focus', '/archive', '/history', '/analytics', '/settings', '/presets'];

/**
 * リダイレクト先が有効かどうかを検証
 * - アプリ内のパスのみ許可
 * - 外部URLは許可しない
 * - /login は許可しない
 */
export const isValidRedirectPath = (path: string): boolean => {
  // 外部URLやプロトコル付きURLは拒否
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return false;
  }

  // /login へのリダイレクトは拒否
  if (path === '/login' || path.startsWith('/login?') || path.startsWith('/login/')) {
    return false;
  }

  // 許可されたパスかチェック
  return ALLOWED_PATHS.some((allowed) => path === allowed || path.startsWith(`${allowed}/`) || path.startsWith(`${allowed}?`));
};

/**
 * ログイン後のリダイレクト先を保存
 */
export const saveRedirectPath = (path: string): void => {
  if (typeof window === 'undefined') return;

  if (isValidRedirectPath(path)) {
    sessionStorage.setItem(REDIRECT_KEY, path);
  }
};

/**
 * 保存されたリダイレクト先を取得してクリア
 * 無効なパスや保存されていない場合はデフォルトパスを返す
 */
export const getAndClearRedirectPath = (defaultPath = '/'): string => {
  if (typeof window === 'undefined') return defaultPath;

  const savedPath = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);

  if (savedPath && isValidRedirectPath(savedPath)) {
    return savedPath;
  }

  return defaultPath;
};
