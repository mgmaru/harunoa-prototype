/**
 * プロジェクトカラーパレットのユニットテスト
 *
 * 関連Issue: #12 カラーパレットの拡充
 */
import { describe, it, expect } from 'vitest';
import { COLOR_NAMES, PROJECT_COLORS } from '@/constants/colors';

describe('PROJECT_COLORS', () => {
  it('24色が定義されている', () => {
    expect(PROJECT_COLORS).toHaveLength(24);
  });

  it('色の重複がない', () => {
    expect(new Set(PROJECT_COLORS).size).toBe(PROJECT_COLORS.length);
  });

  it('すべて6桁の大文字16進カラーコードである', () => {
    for (const color of PROJECT_COLORS) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('既存の16色が先頭に同じ順序で維持されている', () => {
    // 保存済みプロジェクトの色がパレット外にならないことを保証する
    expect(PROJECT_COLORS.slice(0, 16)).toEqual([
      '#3B82F6',
      '#22C55E',
      '#EAB308',
      '#F97316',
      '#EF4444',
      '#A855F7',
      '#78716C',
      '#1F2937',
      '#9CA3AF',
      '#06B6D4',
      '#EC4899',
      '#84CC16',
      '#6366F1',
      '#14B8A6',
      '#F59E0B',
      '#F43F5E',
    ]);
  });
});

describe('COLOR_NAMES', () => {
  it('すべての色に表示名が定義されている', () => {
    for (const color of PROJECT_COLORS) {
      expect(COLOR_NAMES[color]).toBeTruthy();
    }
  });

  it('パレットに存在しないキーを含まない', () => {
    expect(Object.keys(COLOR_NAMES).sort()).toEqual([...PROJECT_COLORS].sort());
  });

  it('表示名の重複がない', () => {
    const names = Object.values(COLOR_NAMES);
    expect(new Set(names).size).toBe(names.length);
  });
});
