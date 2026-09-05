"use client";

import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2 } from "lucide-react";

/**
 * SubmitConfirmModal — final confirmation dialog before the owner
 * application is sent for review. F-203c: extracted from page.tsx.
 *
 * The parent owns the form-submit handler, so we just receive an
 * `onConfirm` callback. While `isSubmitting` is true, both buttons
 * disable and the confirm label shows a spinner.
 */
export function SubmitConfirmModal({
  open,
  isSubmitting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-confirm-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
            onClick={() => !isSubmitting && onClose()}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm flex flex-col gap-2 z-[610]"
          >
            <div className="w-full max-w-sm bg-surface-overlay dark:bg-[#13223F] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12">
              <div className="p-6 text-center pb-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500 dark:text-emerald-400">
                  <Send className="w-6 h-6" style={{ marginLeft: "2px" }} aria-hidden="true" />
                </div>
                <h3 id="submit-confirm-title" className="text-lg font-bold text-foreground tracking-tight">
                  Submit Application?
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Your facility details and documents will be sent for review. This process takes 24-48 hours.
                </p>
              </div>
              <div className="flex flex-col p-5 pt-0 gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onConfirm}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Submitting...
                    </>
                  ) : (
                    "Submit for Review"
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all cursor-pointer"
                >
                  Review Details
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
