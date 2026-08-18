/**
 * プロジェクトカラーパレット
 * 画面仕様書に基づく24色
 *
 * 基本16色に加え、色相の隙間を埋める色と明度で差別化した暗色を追加している。
 * 自動割当はこの配列順に走査するため、隣接する色が判別しやすい並びを維持すること。
 * 既存プロジェクトの色が選択できなくなるため、定義済みの色の削除・変更は行わない。
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
  '#EC4899', // pink
  '#84CC16', // lime
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F59E0B', // amber
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#9F1239', // wine
  '#10B981', // emerald
  '#6B21A8', // purple-dark
  '#B45309', // bronze
  '#D946EF', // fuchsia
  '#1E3A8A', // navy
  '#15803D', // green-dark
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
  '#EC4899': 'ピンク',
  '#84CC16': 'ライム',
  '#6366F1': 'インディゴ',
  '#14B8A6': 'ティール',
  '#F59E0B': 'アンバー',
  '#F43F5E': 'ローズ',
  '#0EA5E9': 'スカイ',
  '#9F1239': 'ワイン',
  '#10B981': 'エメラルド',
  '#6B21A8': '濃紫',
  '#B45309': 'ブロンズ',
  '#D946EF': 'フューシャ',
  '#1E3A8A': 'ネイビー',
  '#15803D': '深緑',
};
