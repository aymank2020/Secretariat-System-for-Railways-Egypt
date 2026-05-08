"use client";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  open, onConfirm, onCancel, title, message, confirmText = "تأكيد", danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            إلغاء
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white font-bold ${danger ? "bg-red-600 hover:bg-red-700" : "bg-[#1a365d] hover:bg-[#2a4a77]"}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
