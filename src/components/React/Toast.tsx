import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Clapperboard } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: Toast | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 20, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-8 right-8 z-[1000]"
        >
          <div className={`px-6 py-4 rounded-[1.5rem] shadow-2xl backdrop-blur-xl border ${
            toast.type === 'success' 
              ? 'bg-emerald-500/90 text-white border-emerald-400 shadow-emerald-500/10' 
              : toast.type === 'error'
                ? 'bg-[#E22A1D]/90 text-white border-[#E22A1D]/30 shadow-[#E22A1D]/10'
                : 'bg-[#11202C]/90 text-white border-[#11202C]/30 shadow-[#11202C]/10'
          } flex items-center gap-4 min-w-[320px]`}>
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <AlertCircle size={20} />}
              {toast.type === 'info' && <Clapperboard size={20} />}
            </div>
            
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 leading-none mb-1.5">
                {toast.type === 'success' ? 'Action Successful' : toast.type === 'error' ? 'System Error' : 'Notification'}
              </p>
              <p className="text-sm font-bold leading-tight">{toast.message}</p>
            </div>

            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
