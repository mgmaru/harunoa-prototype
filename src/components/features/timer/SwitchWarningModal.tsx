'use client';

import { Modal } from '@/components/ui/Modal';

type SwitchWarningModalProps = {
  isOpen: boolean;
  currentProjectName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export const SwitchWarningModal = ({
  isOpen,
  currentProjectName,
  onCancel,
  onConfirm,
  isLoading = false,
}: SwitchWarningModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="計測中のプロジェクトがあります">
      <p className="text-gray-600 mb-6">
        現在「{currentProjectName}」を計測中です。
        計測を終了して、新しいプロジェクトの計測を開始しますか？
      </p>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '計測を切り替える'}
        </button>
      </div>
    </Modal>
  );
};
