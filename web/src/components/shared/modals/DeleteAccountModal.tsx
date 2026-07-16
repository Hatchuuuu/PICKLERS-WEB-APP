"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TriangleAlert, X } from "lucide-react";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  isProcessing: boolean;
}

export function DeleteAccountModal({ isOpen, onClose, onDelete, isProcessing }: DeleteAccountModalProps) {
  const [deleteInput, setDeleteInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDeleteInput("");
    }
  }, [isOpen]);

  const isValid = deleteInput === "DELETE";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-[var(--radius-xl)] border shadow-lg backdrop-blur-2xl bg-background/95 border-border/50 relative">
              <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-1 shadow-[0_10px_40px_rgba(239,68,68,0.15)]">
                <TriangleAlert className="w-6 h-6 text-destructive" />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <h3 className="text-[18px] font-bold text-foreground leading-tight mb-2">Delete Account</h3>
                <p className="text-[13px] text-destructive/90 font-medium leading-relaxed mb-4">
                  This action cannot be undone. All your data will be permanently erased.
                </p>
                <div className="w-full text-left mb-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Type DELETE to confirm</div>
                <input
                  autoFocus
                  type="text"
                  placeholder="DELETE"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] text-[14px] font-bold text-center outline-none bg-secondary border border-border text-foreground focus:border-destructive/50 focus:bg-destructive/5 transition-all disabled:opacity-50"
                />
              </div>
              
              <div className="flex gap-2 w-full mt-2">
                <button onClick={onClose} disabled={isProcessing} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-secondary-foreground bg-secondary border border-border hover:bg-secondary/80 transition-all active:scale-[0.98] disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={onDelete} disabled={!isValid || isProcessing} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessing ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
