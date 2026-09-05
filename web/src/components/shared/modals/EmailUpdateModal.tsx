"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, X } from "lucide-react";

interface EmailUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (email: string) => Promise<void>;
  isProcessing: boolean;
}

export function EmailUpdateModal({ isOpen, onClose, onUpdate, isProcessing }: EmailUpdateModalProps) {
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
    }
  }, [isOpen]);

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
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1 shadow-sm text-emerald-500 dark:text-emerald-400">
                <Mail className="w-6 h-6 stroke-[2.2]" />
              </div>
              
              <div className="flex flex-col items-center text-center w-full">
                <h3 className="text-lg font-bold text-foreground leading-tight mb-1" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  Update Email
                </h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4">
                  We will send a verification link to your new address. <br/><span className="opacity-70 mt-1 block">For security, you must also confirm this change via your current email.</span>
                </p>
                <div className="w-full text-left mb-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">
                  New Email Address
                </div>
                <input
                  autoFocus
                  type="email"
                  placeholder="new@example.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                />
              </div>
              
              <div className="flex gap-2.5 w-full mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/15 border border-border dark:border-white/10 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate(emailInput)}
                  disabled={isProcessing || !emailInput.trim()}
                  className="flex-1 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  {isProcessing ? "Processing..." : "Update"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
