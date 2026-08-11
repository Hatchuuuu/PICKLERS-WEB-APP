"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Check } from "lucide-react";

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
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-surface-base border border-border rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-raised text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-foreground focus:outline-none focus:border-rose-500/50"
              >
                {PRESET_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Detailed Feedback for Applicant
              </label>
              <textarea
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Specify exact details so the applicant can correct their application..."
                className="w-full p-3 rounded-xl border border-border bg-surface-raised text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose-500/50 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Reject</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
