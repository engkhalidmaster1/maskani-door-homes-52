import { useState } from 'react';

interface ConfirmationDialogConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
  onConfirm: () => void;
}

export const useConfirmationDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationDialogConfig | null>(null);

  const openDialog = (dialogConfig: ConfirmationDialogConfig) => {
    setConfig(dialogConfig);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setConfig(null);
  };

  const confirmDialog = () => {
    if (config?.onConfirm) {
      config.onConfirm();
    }
    closeDialog();
  };

  return {
    isOpen,
    config,
    openDialog,
    closeDialog,
    confirmDialog
  };
};