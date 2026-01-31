/**
 * プロジェクトカラーパレット
 * 画面仕様書に基づく10色
 */
export const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#EAB308', // yellow
  '#F97316', // orange
  '#EF4444', // red
  '#A855F7', // purple
  '#78716C', // brown
  '#1F2937', // gray-dark
  '#9CA3AF', // gray-light
  '#06B6D4', // cyan
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

/**
 * カラーコードから表示名を取得
 */
export const COLOR_NAMES: Record<ProjectColor, string> = {
  '#3B82F6': '青',
  '#22C55E': '緑',
  '#EAB308': '黄',
  '#F97316': 'オレンジ',
  '#EF4444': '赤',
  '#A855F7': '紫',
  '#78716C': '茶',
  '#1F2937': '黒',
  '#9CA3AF': 'グレー',
  '#06B6D4': 'シアン',
};
