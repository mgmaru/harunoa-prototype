'use client';

import { Modal } from '@/components/ui/Modal';

type ExitConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onStop: () => void;
  isLoading?: boolean;
};

export const ExitConfirmModal = ({
  isOpen,
  onClose,
  onContinue,
  onStop,
  isLoading = false,
}: ExitConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="計測中です">
      <p className="text-gray-600 mb-6">
        計測中の画面から離れます。どうしますか？
      </p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          計測を継続して戻る
        </button>
        <button
          type="button"
          onClick={onStop}
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '計測を停止して戻る'}
        </button>
      </div>
    </Modal>
  );
};
