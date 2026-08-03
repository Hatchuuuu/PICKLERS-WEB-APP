"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, LifeBuoy } from "lucide-react";
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
            className="fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md bg-background/95 dark:bg-[#0d1527]/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7)] z-[140] border border-white/20 dark:border-white/[0.15] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 px-6 border-b border-border-subtle dark:border-white/[0.1] flex justify-between items-center bg-surface-interactive/30 dark:bg-white/[0.04] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <LifeBuoy className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground" style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}>Help & Support</h3>
                  <p className="text-[11px] font-bold text-muted-foreground">Contact PICKLERS Support Team</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/20 active:scale-90 transition-all text-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {submitted ? (
                <div className="py-8 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-black text-foreground">Message Received!</h4>
                  <p className="text-xs text-muted-foreground">Our support team has logged your inquiry (`support@picklers.app`).</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-1.5">Category</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-xs sm:text-sm font-extrabold outline-none bg-surface-interactive/80 dark:bg-[#162238] border border-border dark:border-white/15 text-foreground cursor-pointer shadow-sm"
                    >
                      <option value="General Support" className="bg-[#162238] text-slate-100 dark:bg-[#162238] dark:text-slate-100 font-bold">General Inquiry</option>
                      <option value="Court Booking Issue" className="bg-[#162238] text-slate-100 dark:bg-[#162238] dark:text-slate-100 font-bold">Court Booking & Payment Issue</option>
                      <option value="Account & Login" className="bg-[#162238] text-slate-100 dark:bg-[#162238] dark:text-slate-100 font-bold">Account & Login Help</option>
                      <option value="Report Bug" className="bg-[#162238] text-slate-100 dark:bg-[#162238] dark:text-slate-100 font-bold">Report a Bug / Glitch</option>
                      <option value="Court Owner Partner" className="bg-[#162238] text-slate-100 dark:bg-[#162238] dark:text-slate-100 font-bold">Facility / Owner Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-1.5">How can we help?</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue or question in detail..."
                      className="w-full p-4 rounded-xl text-xs sm:text-sm outline-none bg-surface-interactive/80 dark:bg-white/[0.05] border border-border dark:border-white/10 text-foreground placeholder:text-ink-muted focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="w-full py-3 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-emerald-400/40 shadow-[0_0_20px_rgba(0,217,139,0.3)] active:scale-[0.98] transition-all cursor-pointer tracking-wider uppercase"
                    style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
                  >
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    Submit Support Ticket
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
