"use client";

import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose} />
          
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-[340px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center gap-4 px-6 py-5 rounded-[var(--radius-xl)] border shadow-lg backdrop-blur-2xl bg-background/95 border-border/50">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 shrink-0">
                  <LogOut className="w-5 h-5 text-destructive" strokeWidth={2.5} style={{ marginLeft: "-2px" }} />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-[16px] font-bold text-foreground leading-tight">Sign Out</h3>
                  <p className="text-[13px] text-muted-foreground font-medium leading-tight mt-0.5">
                    You'll need to sign in again.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full mt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-secondary-foreground bg-secondary border border-border hover:bg-secondary/80 transition-all active:scale-[0.98]">
                  Cancel
                </button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-all active:scale-[0.98]">
                  Sign Out
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
