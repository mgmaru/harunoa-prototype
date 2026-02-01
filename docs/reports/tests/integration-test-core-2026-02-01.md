# 結合テスト実施レポート: コア機能連携テスト

**実施日**: 2026-02-01
**対象**: セクション1「コア機能連携テスト (Auth, Project, Timer)」
**テストファイル**: `src/__tests__/integration/core-functions.test.tsx`

---

## 実行結果サマリー

| 項目 | 値 |
|------|------|
| 総テスト数 | 15件 |
| パス | 13件 |
| スキップ | 2件 |
| 失敗 | 0件 |
| 実行時間 | 149ms |

---

## テスト項目別結果

### INT-001: 未認証でのアクセス制限

| テストケース | 結果 |
|-------------|:----:|
| 未認証状態ではisAuthenticatedがfalseになる | ✅ |
| 認証レイアウトは未認証ユーザーをログイン画面にリダイレクトする | ✅ |
| 認証済みユーザーは保護されたページにアクセスできる | ✅ |

**総合判定**: ✅ PASS

---

### INT-002: ログイン後の遷移

| テストケース | 結果 |
|-------------|:----:|
| ログイン成功後、ホーム画面に遷移する | ✅ |
| ログイン失敗時はエラーが発生する | ✅ |

**総合判定**: ⚠️ PARTIAL

**注記**:
- ホームへの遷移は正常に動作
- 「直前にアクセスしようとしたページへのリダイレクト」は未実装
- 将来的なUX改善項目として推奨

---

### INT-003: 複数ユーザー間のデータ分離

| テストケース | 結果 |
|-------------|:----:|
| ユーザーAはユーザーAのプロジェクトのみ取得できる | ✅ |
| ユーザーBはユーザーBのプロジェクトのみ取得できる | ✅ |
| サービス層でuserIdによるフィルタリングが行われる | ✅ |

**総合判定**: ✅ PASS

**注記**:
- サービス層（`src/services/projects.ts`, `src/services/sessions.ts`）でuserIdフィルタリング確認済み
- Firestoreセキュリティルールは本テストの範囲外（別途セキュリティレビューで確認推奨）

---

### INT-004: プロジェクト切替時の計測継続

| テストケース | 結果 |
|-------------|:----:|
| 計測中に別プロジェクトを選択すると警告状態になる | ✅ |
| 計測切替承認後、旧計測が停止・保存され新計測が開始される | ✅ |
| 同じプロジェクトを選択した場合は警告なしで集中モードへ遷移 | ✅ |
| 一時停止中に別プロジェクトを選択しても警告が表示される | ✅ |

**総合判定**: ✅ PASS

---

### INT-005: 計測停止後のデータ保存

**結果**: ⏸️ SKIP

**理由**: 履歴画面（Phase 5: `04_history.md`）が未実装のため、テスト実行不可

---

### INT-006: 長時間計測の保存

**結果**: ⏸️ SKIP

**理由**:
- 日付跨ぎ按分ロジック（`src/lib/date/session-split.ts`）未実装
- 履歴画面（Phase 5: `04_history.md`）未実装

---

### 追加テスト: タイマー状態の永続化

| テストケース | 結果 |
|-------------|:----:|
| 計測状態がlocalStorageに保存される | ✅ |

**総合判定**: ✅ PASS

---

## 発見事項・改善提案

### 1. INT-002の完全実装

現状、ログイン後は常にホーム（`/`）へリダイレクトされます。
ユーザビリティ向上のため、「直前のアクセス先へのリダイレクト」機能の追加を推奨します。

**実装案**:
```typescript
// src/app/(auth)/layout.tsx
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    router.push('/login');
  }
}, [isAuthenticated, isLoading, router]);

// src/app/login/page.tsx
const handleLogin = async () => {
  await signIn();
  const redirect = sessionStorage.getItem('redirectAfterLogin') || '/';
  sessionStorage.removeItem('redirectAfterLogin');
  router.push(redirect);
};
```

### 2. Firestoreセキュリティルールの追加

データ分離テスト（INT-003）はサービス層での検証のみです。
本番環境でのセキュリティ確保のため、Firestoreセキュリティルールの作成を推奨します。

```javascript
// firestore.rules (推奨)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 次のステップ

1. **Phase 5（履歴管理）実装後**: INT-005, INT-006のテストを有効化して実行
2. **Firestoreセキュリティルール**: 本番デプロイ前にセキュリティルールを作成・テスト
3. **INT-002改善**: ユーザビリティ向上のため、直前ページリダイレクト機能を検討

---

## 関連ファイル

- テストファイル: `src/__tests__/integration/core-functions.test.tsx`
- テスト計画書: `docs/testing/integration-test-plan.md`
- タスクリスト: `docs/tasklist.md`
