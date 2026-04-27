import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, BrainCircuit, Lightbulb, Trash2, X } from 'lucide-react';

const ICON_MAP = {
  mindmap: BrainCircuit,
  quiz: Lightbulb,
  delete_media: Trash2,
  default: AlertCircle,
};

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  variant = 'default', // 'default' | 'danger'
}) => {
  const Icon = ICON_MAP[type] || ICON_MAP.default;
  const isDanger = variant === 'danger' || type === 'delete_media';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="relative w-full max-w-md bg-[#111113] border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden z-10"
          >
            {/* Subtle gradient top accent */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${isDanger ? 'bg-gradient-to-r from-red-600/60 via-red-400/60 to-transparent' : 'bg-gradient-to-r from-purple-600/60 via-purple-400/40 to-transparent'}`} />

            <div className="p-6 pt-7">
              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDanger ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-white leading-tight">{title}</h3>
              </div>

              <p className="text-neutral-400 text-sm leading-relaxed mb-7 pl-14">
                {message}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-300 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg ${
                    isDanger
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                      : 'bg-white hover:bg-neutral-100 text-black shadow-white/5'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-neutral-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
