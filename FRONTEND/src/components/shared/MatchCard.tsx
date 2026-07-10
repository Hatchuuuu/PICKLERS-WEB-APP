import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, levelColor } from "@/lib/utils";
import { OPEN_MATCHES } from "@/data/mockData";
import { CapacityRing } from "@/components/ui/shared";
import { VerificationGate } from "@/components/shared/VerificationGate";
import { Check } from "lucide-react";


export function MatchCard({ m, joined, onJoin, publicMode = false }: { m: typeof OPEN_MATCHES[0]; joined?: boolean; onJoin?: () => void; publicMode?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState(false);
  const joinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
    };
  }, []);

  const filled = joined ? m.slots + 1 : m.slots;
  const full = filled >= m.max;

  function handleJoin() {
    if (joined || full || loading || isSimulating || simSuccess) return;
    setShowJoinConfirm(true);
  }

  function confirmJoin() {
    if (isSimulating || simSuccess) return;
    setIsSimulating(true);

    // Simulate high-concurrency network latency
    joinTimeoutRef.current = setTimeout(() => {
      setIsSimulating(false);
      setSimSuccess(true);

      // Give the user 600ms to visually register the satisfying checkmark before closing
      setTimeout(() => {
        setShowJoinConfirm(false);
        setSimSuccess(false); // reset for future
        setLoading(true);
        setTimeout(() => { setLoading(false); onJoin?.(); }, 400);
      }, 600);
    }, 1500);
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative p-5 pt-[52px] flex gap-5 items-center cursor-default h-full rounded-[24px] border backdrop-blur-[20px] ${joined ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_8px_32px_rgba(52,211,153,0.15),inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'bg-surface-base border-border shadow-lg dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.01] dark:border-white/[0.08] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.06)]'}`}>
      
      {/* Absolute Level Badge */}
      <div className="absolute top-4 left-5 flex items-center gap-2">
        <span className="text-[12px] px-3 py-1 rounded-full font-bold tracking-wide bg-black/5 text-accent-primary border border-border dark:bg-white/5 dark:border-white/5 backdrop-blur-[8px]">
          {m.level}
        </span>
        {joined && (
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold border border-solid"
            style={{
              background: "rgba(52,211,153,0.1)",
              color: "var(--accent-success)",
              borderColor: "rgba(52,211,153,0.25)"
            }}>
            Joined ✓
          </span>
        )}
      </div>
      <CapacityRing filled={filled} max={m.max} />
      <div className="flex-1 min-w-0">
        <div className="text-[16px] font-bold tracking-tight truncate" style={{ color: "var(--ink-primary)" }}>{m.facility}</div>
        <div className="text-[13px] font-medium mt-1" style={{ color: "var(--ink-secondary)" }}>{m.date} · {m.time}</div>
        <div className="text-[12px] font-medium mt-1" style={{ color: "var(--ink-muted)" }}>Host: {m.host}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold text-[16px]" style={{ color: "var(--accent-primary)" }}>₱{m.price}</div>
        <div className="text-[11px] font-medium mb-3" style={{ color: "var(--ink-muted)" }}>your share</div>
        {publicMode ? (
          <button onClick={onJoin} disabled={joined || full}
            className={`text-[14px] px-6 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 min-w-[72px] ${joined ? 'bg-transparent text-emerald-400 border-[1.5px] border-emerald-400 shadow-none' : full ? 'bg-black/5 dark:bg-white/5 text-muted-foreground border-none shadow-none' : 'bg-[#3B82F6] text-white border-none shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:opacity-90'}`}>
            {joined ? "Joined" : full ? "Full" : "Join"}
          </button>
        ) : (
          <VerificationGate disabled={joined || full} onVerifiedClick={handleJoin}>
            <button disabled={joined || full}
              className={`text-[14px] px-6 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2 min-w-[72px] ${joined ? 'bg-transparent text-emerald-400 border-[1.5px] border-emerald-400 shadow-none' : full ? 'bg-black/5 dark:bg-white/5 text-muted-foreground border-none shadow-none' : 'bg-[#3B82F6] text-white border-none shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:opacity-90'}`}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
              ) : joined ? "Joined" : full ? "Full" : "Join"}
            </button>
          </VerificationGate>
        )}
      </div>

      {/* Join Confirm Modal */}
      <AnimatePresence>
        {showJoinConfirm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 pb-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-surface-base/40 backdrop-blur-sm"
              onClick={() => setShowJoinConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-full max-w-[340px] bg-surface-base/80 dark:bg-[#0A1118]/80 backdrop-blur-3xl rounded-[28px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] dark:shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] border border-black/5 dark:border-white/[0.08]">
                <div className="p-6 text-center pb-5">
                  <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <span className="text-[24px] drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">🤝</span>
                  </div>
                  <h3 className="text-[20px] font-bold text-foreground tracking-tight mb-2" >Join Match?</h3>
                  <p className="text-[14px] text-foreground/70 leading-relaxed font-medium px-2">
                    Join <span className="font-bold text-foreground">{m.level}</span> match at <span className="font-bold text-foreground">{m.facility}</span> on <span className="font-bold text-foreground">{m.date}</span> for <span className="font-bold text-emerald-400">₱{m.price}</span>?
                  </p>
                </div>
                <div className="p-5 pt-0 flex gap-2.5">
                  <button onClick={() => setShowJoinConfirm(false)} className="flex-1 py-3.5 rounded-[16px] text-[15px] font-semibold text-foreground bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={confirmJoin}
                    disabled={isSimulating || simSuccess}
                    className="flex-[1.5] py-3.5 rounded-[16px] text-[15px] font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-400 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50 flex items-center justify-center gap-2"
                  >
                    {isSimulating ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : simSuccess ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Check className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : (
                      "Confirm & Join"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
