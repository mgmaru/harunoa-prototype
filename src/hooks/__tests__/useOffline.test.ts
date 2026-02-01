import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffline } from '../useOffline';

describe('useOffline', () => {
  const originalNavigator = global.navigator;
  const mockAddEventListener = vi.fn();
  const mockRemoveEventListener = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    // navigator.onLine をモック
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });
    // window イベントリスナーをモック
    global.window.addEventListener = mockAddEventListener;
    global.window.removeEventListener = mockRemoveEventListener;
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('オンライン時はisOfflineがfalse', () => {
    Object.defineProperty(global.navigator, 'onLine', { value: true });

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('オフライン時はisOfflineがtrue', () => {
    Object.defineProperty(global.navigator, 'onLine', { value: false });

    const { result } = renderHook(() => useOffline());

    expect(result.current.isOffline).toBe(true);
  });

  it('online/offlineイベントリスナーが登録される', () => {
    renderHook(() => useOffline());

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );
  });

  it('アンマウント時にイベントリスナーが解除される', () => {
    const { unmount } = renderHook(() => useOffline());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );
  });

  it('offlineイベントでisOfflineがtrueになる', () => {
    const { result } = renderHook(() => useOffline());

    // offlineイベントのハンドラを取得して呼び出す
    const offlineHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'offline'
    )?.[1];

    act(() => {
      offlineHandler?.();
    });

    expect(result.current.isOffline).toBe(true);
  });

  it('onlineイベントでisOfflineがfalse、wasOfflineがtrueになる', () => {
    Object.defineProperty(global.navigator, 'onLine', { value: false });
    const { result } = renderHook(() => useOffline());

    // onlineイベントのハンドラを取得して呼び出す
    const onlineHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'online'
    )?.[1];

    act(() => {
      onlineHandler?.();
    });

    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('wasOfflineは5秒後にfalseに戻る', () => {
    const { result } = renderHook(() => useOffline());

    const onlineHandler = mockAddEventListener.mock.calls.find(
      (call) => call[0] === 'online'
    )?.[1];

    act(() => {
      onlineHandler?.();
    });

    expect(result.current.wasOffline).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.wasOffline).toBe(false);
  });
});
