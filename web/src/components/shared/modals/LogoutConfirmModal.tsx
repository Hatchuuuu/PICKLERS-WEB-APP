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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative z-[610] w-full max-w-[340px] flex flex-col items-center"
          >
            <div className="w-full flex flex-col items-center gap-4 px-6 py-6 rounded-3xl border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] bg-surface-overlay dark:bg-[#13223F]">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-400 shrink-0 shadow-sm">
                  <LogOut className="w-6 h-6 stroke-[2.2]" style={{ marginLeft: "-2px" }} />
                </div>
                <div className="flex flex-col text-left">
                  <h3 className="text-base font-bold text-foreground leading-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                    Sign Out
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-tight mt-0.5">
                    You'll need to sign in again.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2.5 w-full mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/15 border border-border dark:border-white/10 transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-500/40 shadow-lg transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider"
                >
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
