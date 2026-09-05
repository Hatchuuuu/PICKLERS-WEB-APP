"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";

interface RejectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  facilityName: string;
}

const PRESET_REASONS = [
  "Incomplete Documents (Unclear identity photo or missing license)",
  "Invalid Business License / Registration",
  "Unverified Property Ownership / Lease Contract",
  "Duplicate Facility Listing",
  "Address or Geolocation Mismatch",
  "Other / Custom Reason",
];

export function RejectApplicationModal({
  isOpen,
  onClose,
  onConfirm,
  facilityName,
}: RejectApplicationModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedPreset.startsWith("Other") || customNote.trim()
        ? `${selectedPreset}: ${customNote.trim()}`
        : selectedPreset;

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
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
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col gap-4 z-[610]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Reject Application</h3>
              <p className="text-xs text-muted-foreground font-medium">
                Rejecting application for <span className="text-foreground font-bold">{facilityName}</span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Reason Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Rejection Reason
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground focus:outline-none focus:border-red-500"
              >
                {PRESET_REASONS.map((r) => (
                  <option key={r} value={r} className="bg-surface-overlay text-foreground">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom note textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Additional Notes / Feedback for Applicant
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Provide specific feedback so the applicant knows what to fix before reapplying…"
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-interactive hover:bg-surface-interactive/80 border border-border text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Rejecting…</span>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
