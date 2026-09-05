"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, ShieldCheck, Lock, Eye, FileText, Database } from "lucide-react";

export function PrivacyPolicyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          {/* Subtle Dim Backdrop — Keeps App Visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50 z-0"
          />

          {/* Elevated Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-xl max-h-[82vh] bg-surface-overlay dark:bg-[#13223F] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-10 border border-border dark:border-white/12 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 px-6 border-b border-border dark:border-white/10 flex justify-between items-center bg-surface-interactive/40 dark:bg-white/[0.03] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                    Privacy Policy
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Effective Date: August 2026</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close privacy policy modal"
                className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/20 border border-border dark:border-white/10 active:scale-90 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Scrollable Body with Clean Custom Scrollbar */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed flex-1 min-h-0 pb-10 [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-500/40 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-start gap-3 shadow-sm">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>PICKLERS respects your privacy. We store your data securely and never sell your personal information to third parties.</span>
              </div>

              <section className="p-4 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.03] border border-border dark:border-white/8 space-y-2">
                <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" /> 1. Information We Collect
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  We collect information you provide directly to us when creating an account, booking pickleball courts, participating in open play matches, or communicating with other players. This includes your name, email address, phone number, and optional avatar image.
                </p>
              </section>

              <section className="p-4 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.03] border border-border dark:border-white/8 space-y-2">
                <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-500" /> 2. How We Use Information
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  We use collected information to process court reservations, coordinate open play games, deliver notification alerts, verify player identities, and improve overall app functionality.
                </p>
              </section>

              <section className="p-4 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.03] border border-border dark:border-white/8 space-y-2">
                <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> 3. Data Storage & Security
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  Your data is protected using enterprise-grade Row Level Security (RLS) via Supabase infrastructure with TLS encryption in transit and AES-256 encryption at rest.
                </p>
              </section>

              <section className="p-4 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.03] border border-border dark:border-white/8 space-y-2">
                <h4 className="font-bold text-red-500 text-sm sm:text-base flex items-center gap-2">
                  4. Account & Data Deletion
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  You hold full control over your data. You may request full account and data erasure anytime using the "Delete My Account" option under Settings.
                </p>
              </section>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 px-6 border-t border-border dark:border-white/10 bg-surface-interactive/40 dark:bg-white/[0.03] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-lg active:scale-[0.98] transition-all cursor-pointer tracking-wider uppercase"
              >
                Close & Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
