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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-[var(--radius-xl)] border shadow-lg backdrop-blur-2xl bg-background/95 border-border/50 relative">
              <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>

              <div className="flex flex-col items-center text-center w-full">
                <h3 className="text-[18px] font-bold text-foreground leading-tight mb-2">Edit {title}</h3>
                {description && <p className="text-[13px] text-muted-foreground font-medium leading-relaxed mb-4">{description}</p>}
                
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-medium text-left outline-none bg-secondary border border-border text-foreground focus:border-primary/50 focus:bg-primary/5 transition-all disabled:opacity-50"
                />
              </div>
              
              <div className="flex gap-2 w-full mt-2">
                <button onClick={onClose} disabled={isSaving} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-secondary-foreground bg-secondary border border-border hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={() => onSave(value)} disabled={isSaving} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
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
