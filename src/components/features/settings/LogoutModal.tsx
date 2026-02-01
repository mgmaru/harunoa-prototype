'use client';

import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/Modal';

type LogoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export const LogoutModal = ({
  isOpen,
  onClose,
  onConfirm,
}: LogoutModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="ログアウト"
      message="ログアウトしますか？"
      confirmLabel="ログアウト"
      cancelLabel="キャンセル"
      isDestructive={true}
      isLoading={isLoading}
    />
  );
};
