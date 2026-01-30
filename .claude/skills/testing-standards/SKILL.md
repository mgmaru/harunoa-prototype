---
name: testing-standards
description: |
  HaruNoaプロジェクトのテスト規約（Vitest/Testing Library）を提供する。
  Use when: (1) テストファイル（*.test.ts, *.test.tsx）を作成・編集する時、(2) TDD（テスト駆動開発）で実装する時、(3) モックやスタブを作成する時、(4) コンポーネント・Hook・services層のテストを書く時、(5) npm testを実行する時。
---

# testing-standards Skill

HaruNoaプロジェクトのテスト規約とパターンを提供する。

---

## 基本ルール

| 項目 | 規約 |
|------|------|
| フレームワーク | Vitest + Testing Library |
| 配置場所 | ソースと同階層（`*.test.ts`, `*.test.tsx`） |
| 命名規則 | `{対象ファイル名}.test.ts` |
| 実行コマンド | `npm test` |

---

## TDDサイクル（RED-GREEN-REFACTOR）

### 1. RED: 失敗するテストを先に書く

```typescript
// src/hooks/use-timer.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useTimer } from './use-timer'

describe('useTimer', () => {
  it('should start timer and increment elapsed time', () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start()
    })

    // テストが失敗することを確認してから実装に進む
    expect(result.current.isRunning).toBe(true)
  })
})
```

### 2. GREEN: 最小限の実装でテストを通す

- テストを通すために必要な最小限のコードのみ書く
- 余計な機能や最適化は行わない
- `npm test` で全テストがパスすることを確認

### 3. REFACTOR: コードを改善

- テストが通った状態を維持しながらリファクタリング
- CLAUDE.mdのコードスタイルルールを適用
- テストが引き続きパスすることを確認

---

## テストパターン

### コンポーネントテスト（Testing Library）

```typescript
// src/components/features/project/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProjectCard } from './ProjectCard'

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    color: '#3B82F6',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
  }

  it('should render project name', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<ProjectCard project={mockProject} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledWith(mockProject)
  })
})
```

### Hookテスト

```typescript
// src/hooks/use-projects.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjects } from './use-projects'
import * as projectService from '@/services/projects'

// services層をモック
vi.mock('@/services/projects')

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch projects on mount', async () => {
    const mockProjects = [{ id: '1', name: 'Project 1' }]
    vi.mocked(projectService.getProjects).mockResolvedValue(mockProjects)

    const { result } = renderHook(() => useProjects('user-1'))

    await waitFor(() => {
      expect(result.current.projects).toEqual(mockProjects)
    })
  })

  it('should handle error state', async () => {
    vi.mocked(projectService.getProjects).mockRejectedValue(new Error('Failed'))

    const { result } = renderHook(() => useProjects('user-1'))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
  })
})
```

### services層テスト

```typescript
// src/services/projects.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProjects, createProject } from './projects'

// Firebase SDKをモック
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
}))

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}))

describe('projects service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch projects with limit', async () => {
    // テスト実装
  })
})
```

---

## モック戦略

### Firebase/Firestoreのモック

```typescript
// tests/mocks/firebase.ts
import { vi } from 'vitest'

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ toDate: () => new Date() })),
}

// vitest.setup.ts で使用
vi.mock('firebase/firestore', () => mockFirestore)
```

### Zustand Storeのモック

```typescript
import { vi } from 'vitest'
import { useAuthStore } from '@/stores/auth-store'

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
  })),
}))
```

---

## AAA（Arrange-Act-Assert）パターン

```typescript
it('should update project name', async () => {
  // Arrange: テストデータとモックを準備
  const project = { id: '1', name: 'Old Name' }
  vi.mocked(updateProject).mockResolvedValue({ ...project, name: 'New Name' })

  // Act: テスト対象の処理を実行
  const result = await updateProject(project.id, { name: 'New Name' })

  // Assert: 期待する結果を検証
  expect(result.name).toBe('New Name')
  expect(updateProject).toHaveBeenCalledWith('1', { name: 'New Name' })
})
```

---

## テストコマンド

| コマンド | 用途 |
|---------|------|
| `npm test` | 全テスト実行 |
| `npm test -- --watch` | ウォッチモード |
| `npm test -- --coverage` | カバレッジ計測 |
| `npm test -- path/to/file.test.ts` | 特定ファイルのみ |
| `npm test -- -t "test name"` | 特定テスト名のみ |

---

## チェックリスト

テスト作成時に確認すること：

- [ ] テストファイルはソースと同階層に配置したか
- [ ] `describe`でテスト対象をグループ化したか
- [ ] `it`の説明は「should + 期待する動作」形式か
- [ ] AAAパターン（Arrange-Act-Assert）に従っているか
- [ ] 外部依存（Firebase, API）は適切にモックしたか
- [ ] エラーケースもテストしたか
- [ ] 非同期処理は`waitFor`または`await`で待機したか

---

## 禁止事項

| 禁止 | 理由 |
|------|------|
| 実際のFirebaseへの接続 | テストの独立性が失われる |
| `any`型の使用 | 型安全性が失われる |
| テスト内での`console.log` | コミット前に削除すること |
| 実装の詳細に依存したテスト | リファクタリング耐性が低下 |
