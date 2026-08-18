/**
 * プロジェクト色の自動割当ロジックのユニットテスト
 *
 * 関連Issue: #12 色重複を回避する自動割当の改善
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PROJECT_COLORS } from '@/constants/colors';

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

type MockProjectDoc = {
  id: string;
  data: () => Record<string, unknown>;
};

let mockDocs: MockProjectDoc[] = [];

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-project-id' })),
  updateDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: mockDocs })),
  query: vi.fn(),
  where: vi.fn((field: string, op: string, value: unknown) => ({
    field,
    op,
    value,
  })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  Timestamp: class {},
}));

import { createProject } from '../projects';
import { addDoc, where } from 'firebase/firestore';

const timestamp = (date: Date) => ({ toDate: () => date });

/**
 * アクティブなプロジェクトのモックドキュメントを生成
 */
const setActiveProjects = (colors: string[]) => {
  mockDocs = colors.map((color, index) => ({
    id: `project-${index}`,
    data: () => ({
      userId: 'test-uid',
      name: `プロジェクト${index}`,
      color,
      isArchived: false,
      archivedAt: null,
      createdAt: timestamp(new Date('2026-01-01')),
      updatedAt: timestamp(new Date('2026-01-01')),
    }),
  }));
};

/**
 * 自動割当された色を取得（色未指定でプロジェクトを作成）
 */
const createWithAutoColor = async (): Promise<string> => {
  const project = await createProject('test-uid', { name: '新規プロジェクト' });
  return project.color;
};

describe('プロジェクト色の自動割当', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs = [];
  });

  it('プロジェクトが1件もない場合はパレットの先頭色を割り当てる', async () => {
    setActiveProjects([]);

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[0]);
  });

  it('未使用の色をパレット順に優先して割り当てる', async () => {
    setActiveProjects([PROJECT_COLORS[0], PROJECT_COLORS[1], PROJECT_COLORS[2]]);

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[3]);
  });

  it('パレット途中の色が空いていればその色を割り当てる', async () => {
    // 先頭色以外をすべて使用済みにする
    setActiveProjects(PROJECT_COLORS.filter((c) => c !== PROJECT_COLORS[5]));

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[5]);
  });

  it('集計対象をアクティブなプロジェクトのみに限定している', async () => {
    setActiveProjects([]);

    await createWithAutoColor();

    expect(where).toHaveBeenCalledWith('isArchived', '==', false);
  });

  it('全色使用済みの場合は最も使用数が少ない色を割り当てる', async () => {
    // 全色を2回ずつ使用し、1色だけ1回に減らす
    const colors = [...PROJECT_COLORS, ...PROJECT_COLORS].filter(
      (c, i, arr) => !(c === PROJECT_COLORS[7] && i !== arr.indexOf(c))
    );
    setActiveProjects(colors);

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[7]);
  });

  it('全色の使用数が同数の場合はパレット順で先頭の色を割り当てる', async () => {
    setActiveProjects([...PROJECT_COLORS]);

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[0]);
  });

  it('パレットに存在しない色は集計対象外として扱う', async () => {
    setActiveProjects(['#123456', '#ABCDEF', PROJECT_COLORS[0]]);

    await expect(createWithAutoColor()).resolves.toBe(PROJECT_COLORS[1]);
  });

  it('色が明示指定された場合は自動割当を行わない', async () => {
    setActiveProjects([PROJECT_COLORS[3]]);

    const project = await createProject('test-uid', {
      name: '新規プロジェクト',
      color: PROJECT_COLORS[3],
    });

    expect(project.color).toBe(PROJECT_COLORS[3]);
    expect(addDoc).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ color: PROJECT_COLORS[3] })
    );
  });
});
