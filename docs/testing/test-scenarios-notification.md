# 通知機能テスト補完ガイド

本ドキュメントは、`test-scenarios.md` の「6. 通知」セクションでSKIPとなっているテスト項目を実行するための補完ガイドです。

---

## 1. 概要

### 1.1 対象テスト項目

| テスト | No | 項目 | SKIP理由 |
|--------|:--:|------|----------|
| 6.1 通知設定 | 3-4 | ブラウザ通知許可リクエスト・許可 | ヘッドレスブラウザ環境制限 |
| 6.3 アプリ内通知バナー | 4 | バナー手動閉じ | 自動消去（5秒）が先に発生 |
| 6.4 ブラウザ通知許可拒否時 | 1-2 | 許可ダイアログ操作 | ヘッドレスブラウザ環境制限 |
| 6.5 通知音の選択 | 4 | 通知音再生確認 | ヘッドレスブラウザ環境制限 |

### 1.2 解決アプローチ

| 制限事項 | 解決方法 |
|----------|----------|
| ブラウザ通知許可ダイアログ | Notification APIモック |
| 通知音再生確認 | Audio.prototype.playモニタリング |
| バナー自動消去 | setTimeoutモック |

---

## 2. 事前準備

### 2.1 Playwright MCP環境

テストは Playwright MCP の `browser_run_code` または `browser_evaluate` を使用して実行します。

### 2.2 テスト用プリセット

時間経過テストには、短縮プリセット（集中1分/休憩1分）を使用します。

---

## 3. テスト実行手順

### 3.1 ブラウザ通知許可テスト（6.1 No.3-4, 6.4 No.1-2）

#### 3.1.1 許可状態のテスト

**目的**: ブラウザ通知が許可された状態でのアプリ動作を確認

**手順**:

1. ページ読み込み後、以下のコードを実行してNotification APIをモック

```javascript
// browser_run_code で実行
(() => {
  // Notification.permissionを'granted'に設定
  Object.defineProperty(Notification, 'permission', {
    get: () => 'granted',
    configurable: true
  });

  // requestPermissionを即座に'granted'を返すようモック
  Notification.requestPermission = async () => {
    console.log('[TEST] Notification.requestPermission called - returning granted');
    return 'granted';
  };

  // Notificationコンストラクタをモック（通知表示を記録）
  window.__notificationsShown = [];
  const OriginalNotification = Notification;
  window.Notification = function(title, options) {
    console.log('[TEST] Notification created:', title, options);
    window.__notificationsShown.push({ title, options, timestamp: Date.now() });
    return new OriginalNotification(title, options);
  };
  window.Notification.permission = 'granted';
  window.Notification.requestPermission = async () => 'granted';

  console.log('[TEST] Notification API mocked as GRANTED');
})();
```

2. 設定画面でブラウザ通知トグルをONに切り替え
3. トグルがONになることを確認（許可ダイアログは表示されない）

**期待結果**:
- トグルがONに変わる
- `window.__notificationsShown` でブラウザ通知の発行を確認可能

---

#### 3.1.2 拒否状態のテスト

**目的**: ブラウザ通知が拒否された状態でのフォールバック動作を確認

**手順**:

1. ページ読み込み後、以下のコードを実行

```javascript
// browser_run_code で実行
(() => {
  // Notification.permissionを'denied'に設定
  Object.defineProperty(Notification, 'permission', {
    get: () => 'denied',
    configurable: true
  });

  // requestPermissionを即座に'denied'を返すようモック
  Notification.requestPermission = async () => {
    console.log('[TEST] Notification.requestPermission called - returning denied');
    return 'denied';
  };

  console.log('[TEST] Notification API mocked as DENIED');
})();
```

2. 設定画面でブラウザ通知トグルをONに切り替え
3. トグルがOFFのままであることを確認
4. ポモドーロを使用し、アプリ内バナーで代替通知が表示されることを確認

**期待結果**:
- トグルがOFFのまま
- ポモドーロ終了時にアプリ内バナーが表示される

---

### 3.2 通知音再生確認テスト（6.5 No.4）

**目的**: 選択した通知音が実際に再生されることを確認

**手順**:

1. ページ読み込み後、以下のコードを実行してAudio APIをモニタリング

```javascript
// browser_run_code で実行
(() => {
  // 再生ログを記録する配列
  window.__audioPlayLog = [];

  // HTMLAudioElement.prototype.playをオーバーライド
  const originalPlay = HTMLAudioElement.prototype.play;
  HTMLAudioElement.prototype.play = function() {
    const logEntry = {
      src: this.src,
      timestamp: Date.now(),
      currentTime: this.currentTime
    };
    window.__audioPlayLog.push(logEntry);
    console.log('[TEST] Audio.play() called:', logEntry);
    return originalPlay.call(this);
  };

  // Audio コンストラクタもモニタリング
  const OriginalAudio = window.Audio;
  window.Audio = function(src) {
    console.log('[TEST] new Audio() created:', src);
    return new OriginalAudio(src);
  };

  console.log('[TEST] Audio API monitoring enabled');
})();
```

2. 設定画面で通知音をONに設定
3. プリセット編集で通知音を選択（例: 集中終了=ベル、休憩終了=チャイム）
4. ポモドーロを開始し、集中時間・休憩時間の終了を待つ
5. 以下のコードで再生ログを確認

```javascript
// browser_run_code で実行
(() => {
  console.log('[TEST] Audio play log:', JSON.stringify(window.__audioPlayLog, null, 2));
  return window.__audioPlayLog;
})();
```

**期待結果**:
- `__audioPlayLog` に以下のようなエントリが含まれる
  - 集中終了時: `src` に `bell.mp3` を含む
  - 休憩終了時: `src` に `chime.mp3` を含む

**検証コード例**:

```javascript
// 検証用
const hasExpectedSounds = () => {
  const log = window.__audioPlayLog;
  const hasBell = log.some(entry => entry.src.includes('bell'));
  const hasChime = log.some(entry => entry.src.includes('chime'));
  return { hasBell, hasChime, totalPlays: log.length };
};
```

---

### 3.3 バナー手動閉じテスト（6.3 No.4）

**目的**: 通知バナーの×ボタンで手動閉じができることを確認

**手順**:

1. ページ読み込み後、以下のコードを実行してsetTimeoutを制御

```javascript
// browser_run_code で実行
(() => {
  // オリジナルのsetTimeoutを保存
  window.__originalSetTimeout = window.setTimeout;
  window.__pendingTimeouts = [];
  window.__blockedTimeouts = [];

  // setTimeoutをラップ
  window.setTimeout = function(fn, delay, ...args) {
    const id = window.__originalSetTimeout(fn, delay, ...args);
    const entry = { id, delay, timestamp: Date.now() };
    window.__pendingTimeouts.push(entry);

    // 5秒以上のタイムアウトをログ（バナー自動消去の候補）
    if (delay >= 5000) {
      console.log('[TEST] Long timeout registered:', entry);
    }

    return id;
  };

  // 特定のタイムアウトをキャンセルする関数
  window.__cancelLongTimeouts = () => {
    window.__pendingTimeouts
      .filter(t => t.delay >= 4000)
      .forEach(t => {
        clearTimeout(t.id);
        window.__blockedTimeouts.push(t);
        console.log('[TEST] Cancelled timeout:', t);
      });
  };

  console.log('[TEST] setTimeout monitoring enabled');
})();
```

2. ブラウザ通知をOFF、通知音をONに設定
3. ポモドーロを開始
4. 集中時間終了時、バナーが表示されたら即座に以下を実行

```javascript
// バナー表示直後に実行 - 自動消去をキャンセル
window.__cancelLongTimeouts();
```

5. ×ボタン（閉じるボタン）をクリック
6. バナーが閉じることを確認

**期待結果**:
- バナーが手動で閉じられる
- 自動消去より前に閉じ操作が可能

**代替手順（手動クリックが間に合わない場合）**:

```javascript
// バナー表示を待ってから即座にクリック
const banner = document.querySelector('[data-testid="notification-banner"]')
  || document.querySelector('.notification-banner');
if (banner) {
  const closeBtn = banner.querySelector('button')
    || banner.querySelector('[aria-label="閉じる"]');
  if (closeBtn) {
    closeBtn.click();
    console.log('[TEST] Banner close button clicked');
  }
}
```

---

## 4. テスト結果記録テンプレート

### 4.1 ブラウザ通知許可テスト

| No | 操作 | 期待結果 | 結果 | 備考 |
|:--:|------|----------|:----:|------|
| 3 | トグルON（許可モック済み） | 許可リクエストなしでONになる | | |
| 4 | ポモドーロ終了 | ブラウザ通知が発行される | | `__notificationsShown`で確認 |

### 4.2 ブラウザ通知拒否テスト

| No | 操作 | 期待結果 | 結果 | 備考 |
|:--:|------|----------|:----:|------|
| 1 | トグルON（拒否モック済み） | リクエスト→拒否（OFFのまま） | | |
| 2 | ポモドーロ使用 | アプリ内バナーで代替 | | |

### 4.3 通知音再生テスト

| No | 操作 | 期待結果 | 結果 | 備考 |
|:--:|------|----------|:----:|------|
| 4 | ポモドーロ終了 | 選択した通知音が再生される | | `__audioPlayLog`で確認 |

### 4.4 バナー手動閉じテスト

| No | 操作 | 期待結果 | 結果 | 備考 |
|:--:|------|----------|:----:|------|
| 4 | ×ボタンクリック | バナーが閉じる | | タイムアウトキャンセル後 |

---

## 5. 既知の制限事項

### 5.1 Playwrightの通知パーミッション問題

[GitHub Issue #23954](https://github.com/microsoft/playwright/issues/23954) によると、`context.grantPermissions(['notifications'])` を使用しても `Notification.permission` が `denied` を返す既知の問題があります。

**回避策**: 本ガイドで示したJavaScriptモックを使用してください。

### 5.2 音声再生の直接確認

ヘッドレスブラウザでは実際に音が出力されることを確認できません。本ガイドでは `Audio.prototype.play()` の呼び出しを検出することで、再生処理が正しく実行されたことを間接的に確認します。

### 5.3 タイミング依存のテスト

バナーの自動消去テストは、タイミングに依存するため、ネットワーク遅延や処理負荷により結果が変わる可能性があります。

---

## 6. 参考資料

- [Playwright Emulation - Permissions](https://playwright.dev/docs/emulation#permissions)
- [Playwright BrowserContext](https://playwright.dev/docs/api/class-browsercontext)
- [Web Notifications API - MDN](https://developer.mozilla.org/ja/docs/Web/API/Notifications_API)
- [HTMLAudioElement - MDN](https://developer.mozilla.org/ja/docs/Web/API/HTMLAudioElement)

---

## 変更履歴

| 日付 | 変更内容 |
|------|----------|
| 2026-02-04 | 初版作成 |
