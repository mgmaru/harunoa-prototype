import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidRedirectPath,
  saveRedirectPath,
  getAndClearRedirectPath,
} from '../redirect';

describe('redirect utilities', () => {
  beforeEach(() => {
    // sessionStorageをクリア
    sessionStorage.clear();
  });

  describe('isValidRedirectPath', () => {
    it('ホームパスを許可する', () => {
      expect(isValidRedirectPath('/')).toBe(true);
    });

    it('許可されたパスを許可する', () => {
      expect(isValidRedirectPath('/timer')).toBe(true);
      expect(isValidRedirectPath('/focus')).toBe(true);
      expect(isValidRedirectPath('/archive')).toBe(true);
      expect(isValidRedirectPath('/history')).toBe(true);
      expect(isValidRedirectPath('/analytics')).toBe(true);
      expect(isValidRedirectPath('/settings')).toBe(true);
      expect(isValidRedirectPath('/presets')).toBe(true);
    });

    it('クエリパラメータ付きの許可パスを許可する', () => {
      expect(isValidRedirectPath('/timer?project=123')).toBe(true);
      expect(isValidRedirectPath('/history?date=2026-01-01')).toBe(true);
    });

    it('/loginパスを拒否する', () => {
      expect(isValidRedirectPath('/login')).toBe(false);
      expect(isValidRedirectPath('/login?redirect=/')).toBe(false);
      expect(isValidRedirectPath('/login/')).toBe(false);
    });

    it('外部URLを拒否する', () => {
      expect(isValidRedirectPath('https://example.com')).toBe(false);
      expect(isValidRedirectPath('http://example.com')).toBe(false);
      expect(isValidRedirectPath('//example.com')).toBe(false);
    });

    it('許可されていないパスを拒否する', () => {
      expect(isValidRedirectPath('/admin')).toBe(false);
      expect(isValidRedirectPath('/api/secret')).toBe(false);
      expect(isValidRedirectPath('/unknown')).toBe(false);
    });
  });

  describe('saveRedirectPath', () => {
    it('有効なパスをsessionStorageに保存する', () => {
      saveRedirectPath('/timer');
      expect(sessionStorage.getItem('harunoa-redirect-after-login')).toBe(
        '/timer'
      );
    });

    it('無効なパスは保存しない', () => {
      saveRedirectPath('https://example.com');
      expect(sessionStorage.getItem('harunoa-redirect-after-login')).toBeNull();
    });

    it('/loginパスは保存しない', () => {
      saveRedirectPath('/login');
      expect(sessionStorage.getItem('harunoa-redirect-after-login')).toBeNull();
    });
  });

  describe('getAndClearRedirectPath', () => {
    it('保存されたパスを取得してクリアする', () => {
      sessionStorage.setItem('harunoa-redirect-after-login', '/timer');

      const result = getAndClearRedirectPath('/');

      expect(result).toBe('/timer');
      expect(sessionStorage.getItem('harunoa-redirect-after-login')).toBeNull();
    });

    it('保存されていない場合はデフォルトパスを返す', () => {
      const result = getAndClearRedirectPath('/');
      expect(result).toBe('/');
    });

    it('無効なパスが保存されている場合はデフォルトパスを返す', () => {
      sessionStorage.setItem(
        'harunoa-redirect-after-login',
        'https://example.com'
      );

      const result = getAndClearRedirectPath('/');

      expect(result).toBe('/');
      expect(sessionStorage.getItem('harunoa-redirect-after-login')).toBeNull();
    });

    it('カスタムデフォルトパスを使用できる', () => {
      const result = getAndClearRedirectPath('/home');
      expect(result).toBe('/home');
    });
  });
});
