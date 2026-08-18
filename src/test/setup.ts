import '@testing-library/jest-dom';

/**
 * localStorageのフォールバック
 *
 * Node 22以降はWeb Storage APIのグローバルlocalStorageを持つが、
 * 起動時に --localstorage-file を指定しないと利用不可の状態になる。
 * vitestのjsdom環境では window === globalThis のため、
 * jsdomが提供するlocalStorageも参照できなくなり、
 * persistミドルウェアを使うstoreの初期化が失敗する。
 *
 * 実行するNodeのバージョンに依存しないよう、
 * localStorageが利用できない場合のみテスト用の実装を割り当てる。
 * localStorageが存在する環境（Node 20等）では何もしない。
 */
if (typeof globalThis.localStorage === 'undefined') {
  const createMemoryStorage = (): Storage => {
    let store = new Map<string, string>();

    return {
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store = new Map<string, string>();
      },
    };
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}
