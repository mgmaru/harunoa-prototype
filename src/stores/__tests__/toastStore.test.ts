import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useToastStore } from '../toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ストアをリセット
    act(() => {
      useToastStore.getState().clearToasts();
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('トーストを追加できる', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'テストメッセージ',
          duration: 5000,
        });
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('テストメッセージ');
      expect(toasts[0].type).toBe('success');
    });

    it('titleを含むトーストを追加できる', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'info',
          title: 'テストタイトル',
          message: 'テストメッセージ',
          duration: 5000,
        });
      });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].title).toBe('テストタイトル');
    });

    it('複数のトーストを追加できる', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'メッセージ1',
          duration: 5000,
        });
        useToastStore.getState().addToast({
          type: 'error',
          message: 'メッセージ2',
          duration: 5000,
        });
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(2);
    });

    it('一意のIDが生成される', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'メッセージ1',
          duration: 5000,
        });
        useToastStore.getState().addToast({
          type: 'success',
          message: 'メッセージ2',
          duration: 5000,
        });
      });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('durationが0より大きい場合は自動で削除される', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'テストメッセージ',
          duration: 3000,
        });
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // 3秒経過
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('durationが0の場合は自動削除されない', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'テストメッセージ',
          duration: 0,
        });
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      // 10秒経過
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // まだ残っている
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('指定したIDのトーストを削除できる', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'メッセージ1',
          duration: 0,
        });
        useToastStore.getState().addToast({
          type: 'error',
          message: 'メッセージ2',
          duration: 0,
        });
      });

      const toastId = useToastStore.getState().toasts[0].id;

      act(() => {
        useToastStore.getState().removeToast(toastId);
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('メッセージ2');
    });

    it('存在しないIDを指定しても何も起こらない', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'テストメッセージ',
          duration: 0,
        });
      });

      act(() => {
        useToastStore.getState().removeToast('non-existent-id');
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('clearToasts', () => {
    it('全てのトーストを削除できる', () => {
      act(() => {
        useToastStore.getState().addToast({
          type: 'success',
          message: 'メッセージ1',
          duration: 0,
        });
        useToastStore.getState().addToast({
          type: 'error',
          message: 'メッセージ2',
          duration: 0,
        });
        useToastStore.getState().addToast({
          type: 'warning',
          message: 'メッセージ3',
          duration: 0,
        });
      });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      act(() => {
        useToastStore.getState().clearToasts();
      });

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
