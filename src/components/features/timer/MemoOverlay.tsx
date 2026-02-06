'use client';

import { useState, useEffect } from 'react';

type MemoOverlayProps = {
  isOpen: boolean;
  value: string;
  onSave: (memo: string) => void;
  onClose: () => void;
};

export const MemoOverlay = ({
  isOpen,
  value,
  onSave,
  onClose,
}: MemoOverlayProps) => {
  const [memo, setMemo] = useState(value);

  // 外部から value が変更されたら同期
  useEffect(() => {
    setMemo(value);
  }, [value]);

  const handleSave = () => {
    onSave(memo);
    onClose();
  };

  const handleCancel = () => {
    setMemo(value); // 元の値に戻す
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">メモ</h2>
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="やったこと、詰まった点など"
            className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
          />
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
