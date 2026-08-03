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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-45%", x: "-50%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-xl max-h-[85vh] bg-background/95 dark:bg-[#0d1527]/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] z-[140] border border-white/20 dark:border-white/[0.15] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 px-6 border-b border-border-subtle dark:border-white/[0.1] flex justify-between items-center bg-surface-interactive/30 dark:bg-white/[0.04] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>Privacy Policy</h3>
                  <p className="text-[11px] font-bold text-muted-foreground">Effective Date: August 2026</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 active:scale-90 transition-all text-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 pb-8 overflow-y-auto space-y-6 text-sm leading-relaxed hide-scrollbar">
              <div className="p-3.5 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.08] text-foreground/90 text-xs font-medium flex items-start gap-2.5 shadow-sm">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>PICKLERS respects your privacy. We store your data securely and never sell your personal information to third parties.</span>
              </div>

              <section className="space-y-2">
                <h4 className="font-extrabold text-foreground text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  <Eye className="w-4 h-4 text-emerald-400" /> 1. Information We Collect
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  We collect information you provide directly to us when creating an account, booking pickleball courts, participating in open play matches, or communicating with other players. This includes your name, email address, phone number, and optional avatar image.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-foreground text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  <Database className="w-4 h-4 text-cyan-400" /> 2. How We Use Information
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  We use collected information to process court reservations, coordinate open play games, deliver notification alerts, verify player identities, and improve overall app functionality.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-foreground text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  <FileText className="w-4 h-4 text-indigo-400" /> 3. Data Storage & Security
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  Your data is protected using enterprise-grade Row Level Security (RLS) via Supabase infrastructure with TLS encryption in transit and AES-256 encryption at rest.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-extrabold text-red-400 text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                  4. Account & Data Deletion
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                  You hold full control over your data. You may request full account and data erasure anytime using the "Delete My Account" option under Settings.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border-subtle dark:border-white/[0.1] bg-surface-interactive/40 dark:bg-white/[0.03] backdrop-blur-md shrink-0">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-extrabold text-xs sm:text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 border border-emerald-400/40 shadow-[0_0_20px_rgba(0,217,139,0.3)] active:scale-[0.98] transition-all cursor-pointer tracking-wider uppercase"
                style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
              >
                Close & Understand
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
