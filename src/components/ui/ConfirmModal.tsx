import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isDanger = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => !isLoading && onCancel()}
      ></div>
      <div className="relative bg-white dark:bg-[#111318] w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#222] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${
            isDanger ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500'
          }`}>
            <i className={`las text-2xl ${isDanger ? 'la-exclamation-triangle' : 'la-info-circle'}`}></i>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-primary mb-2">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 dark:bg-[#1a1d24] dark:hover:bg-[#222630] rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            {isLoading ? <LoadingSpinner className="w-4 h-4 border-[2px]" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
