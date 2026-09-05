"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";

export type ReportReason = "spam" | "inappropriate" | "harassment" | "other";

const REASONS: { id: ReportReason; label: string; description: string }[] = [
  { id: "spam", label: "Spam or promotional", description: "Unsolicited advertisements or repetitive content" },
  { id: "inappropriate", label: "Inappropriate content", description: "Sexually explicit, violent, or offensive material" },
  { id: "harassment", label: "Harassment or hate speech", description: "Targeted insults, bullying, or discrimination" },
  { id: "other", label: "Other issue", description: "Any other violation of community guidelines" },
];

export function ReportModal({
  open,
  postId,
  commentId,
  onClose,
}: {
  open: boolean;
  postId?: string | null;
  commentId?: string | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId && !commentId) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId || undefined,
          comment_id: commentId || undefined,
          reason,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setNote("");
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        />

        {/* Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md rounded-3xl p-6 overflow-hidden bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3
                className="text-base font-black text-foreground"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                Report Content
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-8 h-8 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-foreground">Report Submitted</p>
              <p className="text-xs text-muted-foreground">
                Thank you for helping keep the Picklers community safe.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Select why you are reporting this {commentId ? "comment" : "post"}:
              </p>

              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      reason === r.id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-foreground shadow-sm"
                        : "bg-surface-interactive border-border hover:bg-surface-interactive/80 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground">{r.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                  Additional details (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 300))}
                  placeholder="Provide any context that helps us understand..."
                  rows={2}
                  className="w-full p-3 rounded-xl text-xs bg-surface-interactive border border-border outline-none focus:border-emerald-500 text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface-interactive text-foreground hover:bg-surface-interactive/80 border border-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
export default ReportModal;
