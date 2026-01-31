'use client';

import clsx from 'clsx';
import { PROJECT_COLORS } from '@/constants/colors';

type ColorPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  showAutoOption?: boolean;
};

export const ColorPicker = ({
  value,
  onChange,
  showAutoOption = false,
}: ColorPickerProps) => {
  const isAutoSelected = value === null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PROJECT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={clsx(
              'w-8 h-8 rounded-full border-2 transition-all',
              value === color
                ? 'border-gray-900 scale-110'
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color }}
            aria-label={`色を${color}に設定`}
          />
        ))}
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
