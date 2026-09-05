"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, LifeBuoy, ChevronDown } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export function SupportContactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitted(true);
    showToast("Support ticket submitted! We will respond within 24 hours.", "success");
    setTimeout(() => {
      setSubmitted(false);
      setMessage("");
      onClose();
    }, 1500);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          {/* Subtle Dim Backdrop — Keeps App Background Visible */}
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
            className="relative w-full max-w-md bg-surface-overlay dark:bg-[#13223F] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-10 border border-border dark:border-white/12 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 px-6 border-b border-border dark:border-white/10 flex justify-between items-center bg-surface-interactive/40 dark:bg-white/[0.03] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm">
                  <LifeBuoy className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>
                    Help & Support
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">Contact PICKLERS Support Team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close support modal"
                className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 dark:bg-white/10 dark:hover:bg-white/20 border border-border dark:border-white/10 active:scale-90 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6">
              {submitted ? (
                <div className="py-8 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground">Ticket Received!</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                    Our support team has logged your inquiry. We'll reply via email (<span className="text-foreground font-semibold">support@picklers.app</span>).
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 pr-10 rounded-2xl text-xs sm:text-sm font-semibold outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground cursor-pointer shadow-sm transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                      >
                        <option value="General Support" className="bg-surface-overlay dark:bg-[#13223F] text-foreground font-medium">General Inquiry</option>
                        <option value="Court Booking Issue" className="bg-surface-overlay dark:bg-[#13223F] text-foreground font-medium">Court Booking & Payment Issue</option>
                        <option value="Account & Login" className="bg-surface-overlay dark:bg-[#13223F] text-foreground font-medium">Account & Login Help</option>
                        <option value="Report Bug" className="bg-surface-overlay dark:bg-[#13223F] text-foreground font-medium">Report a Bug / Glitch</option>
                        <option value="Court Owner Partner" className="bg-surface-overlay dark:bg-[#13223F] text-foreground font-medium">Facility / Owner Inquiry</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5">
                      How can we help?
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      className="w-full p-4 rounded-2xl text-xs sm:text-sm outline-none bg-surface-interactive/70 dark:bg-white/[0.06] border border-border dark:border-white/12 text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none shadow-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer tracking-wider uppercase"
                    >
                      <Send className="w-4 h-4 stroke-[2.5]" />
                      <span>Submit Support Ticket</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
