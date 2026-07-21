import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmModalProps {
  confirmDialog: ConfirmDialogConfig | null;
  onClose: () => void;
}

export default function ConfirmModal({ confirmDialog, onClose }: ConfirmModalProps) {
  if (!confirmDialog) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-850 p-6 shadow-2xl text-right space-y-4 z-10"
        >
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <X size={20} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-black text-slate-100">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{confirmDialog.message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => confirmDialog.onConfirm()}
              className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-2.5 text-xs transition-colors"
            >
              {confirmDialog.confirmText || 'تایید'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 py-2.5 text-xs transition-colors"
            >
              {confirmDialog.cancelText || 'انصراف'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
