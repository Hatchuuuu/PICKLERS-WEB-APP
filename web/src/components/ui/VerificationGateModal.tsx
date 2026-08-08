"use client";

import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface VerificationGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureLabel?: string;
}

export function VerificationGateModal({ isOpen, onClose, featureLabel }: VerificationGateModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md overflow-hidden bg-background pointer-events-auto rounded-3xl"
              style={{
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Header Illustration Area */}
              <div className="relative h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center overflow-hidden">
                {/* Decorative background circles */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <ShieldAlert className="w-8 h-8 text-white" />
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-ink-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 text-center">
                <h2 className="text-xl md:text-2xl font-black text-foreground mb-3 tracking-tight">
                  Verification Required
                </h2>
                <p className="text-sm md:text-[15px] text-ink-muted mb-8 leading-relaxed">
                  {featureLabel
                    ? `You need to verify your identity to ${featureLabel}. It only takes 2 minutes.`
                    : "You need to verify your identity first to unlock full player features like community feeds, open play, messaging, and quick bookings."}
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/app/settings"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-accent-primary text-white font-bold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,217,139,0.3)]"
                  >
                    Verify Identity
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full h-12 rounded-xl font-bold text-[15px] text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
