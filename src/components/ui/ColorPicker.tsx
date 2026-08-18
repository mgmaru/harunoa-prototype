'use client';

import clsx from 'clsx';
import { COLOR_NAMES, PROJECT_COLORS } from '@/constants/colors';

type ColorPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  showAutoOption?: boolean;
  /** 他のプロジェクトが既に使用している色。マークを表示するのみで選択は制限しない */
  usedColors?: string[];
};

/**
 * 使用済みを示すチェックマーク
 * 色の明度に依存せず判別できるよう、白い円の中に濃いチェックを描画する
 */
const UsedMark = () => (
  <span
    className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white ring-1 ring-gray-300"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 12 12"
      className="w-2.5 h-2.5 text-gray-900"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 6.5L5 9l4.5-5.5" />
    </svg>
  </span>
);

export const ColorPicker = ({
  value,
  onChange,
  showAutoOption = false,
  usedColors = [],
}: ColorPickerProps) => {
  const isAutoSelected = value === null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((color) => {
          const isUsed = usedColors.includes(color);
          const colorName = COLOR_NAMES[color];

          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={clsx(
                'relative w-8 h-8 rounded-full border-2 transition-all',
                value === color
                  ? 'border-gray-900 scale-110'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: color }}
              aria-label={
                isUsed ? `色を${colorName}に設定（使用中）` : `色を${colorName}に設定`
              }
            >
              {isUsed && <UsedMark />}
            </button>
          );
        })}
      </div>

      {showAutoOption && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAutoSelected}
            onChange={(e) => onChange(e.target.checked ? null : PROJECT_COLORS[0])}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">自動割当</span>
        </label>
      )}
    </div>
  );
};

/**
 * カラー表示用のドット
 */
export const ColorDot = ({
  color,
  size = 'md',
}: {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={clsx('inline-block rounded-full', sizeClasses[size])}
      style={{ backgroundColor: color }}
    />
  );
};
