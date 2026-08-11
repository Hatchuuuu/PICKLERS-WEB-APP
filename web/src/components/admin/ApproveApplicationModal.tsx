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
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface-base border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-5"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-raised text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
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
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
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
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
