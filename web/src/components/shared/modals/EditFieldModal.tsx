"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";

interface EditFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newValue: string) => Promise<void>;
  title: string;
  description?: string;
  initialValue: string;
  isSaving: boolean;
}

export function EditFieldModal({ isOpen, onClose, onSave, title, description, initialValue, isSaving }: EditFieldModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative z-[610] w-full max-w-[360px] flex flex-col items-center"
          >
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-3xl border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] bg-surface-overlay dark:bg-[#13223F] relative">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              <div className="flex flex-col items-center text-center w-full">
                <h3 className="text-lg font-bold text-foreground leading-tight mb-1" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  Edit {title}
                </h3>
                {description && <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4">{description}</p>}
                
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium text-left outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                />
              </div>
              
              <div className="flex gap-2.5 w-full mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/15 border border-border dark:border-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onSave(value)}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
