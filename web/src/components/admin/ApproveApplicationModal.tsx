"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, X } from "lucide-react";

interface ApproveApplicationModalProps {
  isOpen: boolean;
  facilityName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ApproveApplicationModal({
  isOpen,
  facilityName,
  isSubmitting,
  onClose,
  onConfirm,
}: ApproveApplicationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-5 z-[610]"
          >
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Approve Application?
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  This will grant{" "}
                  <span className="font-bold text-foreground">
                    {facilityName}
                  </span>{" "}
                  verified Facility Owner status.
                </p>
              </div>
            </div>

            {/* Detail block */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                What happens on approval
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 mt-1 ml-1">
                <li>• Applicant's account role is upgraded to <span className="font-semibold text-foreground">Facility Owner</span></li>
                <li>• A new facility record is created and made publicly visible</li>
                <li>• The applicant is notified via in-app notification</li>
                <li>• This action is permanently logged in the Audit Trail</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-interactive hover:bg-surface-interactive/80 border border-border text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-400 shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Approving…</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
