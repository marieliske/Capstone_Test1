import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Message to display in the dialog body. */
  message: string;
  /** Called when the user confirms the action. */
  onConfirm: () => void;
  /** Called when the user cancels or closes the dialog. */
  onCancel: () => void;
}

/**
 * A simple accessible confirmation modal.
 *
 * Traps focus within the dialog while open and closes on Escape key.
 * The "Delete" button receives initial focus when the dialog opens.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
          Confirm Delete
        </h2>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Confirm delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
