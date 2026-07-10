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

            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}>
              <div className="w-full max-w-sm bg-surface-raised/95 backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-border pb-safe">
                <div className="p-8 text-center pb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                    <span className="text-[28px]">🤝</span>
                  </div>
                  <h3 className="text-[22px] font-black text-foreground tracking-tight" >Join Match?</h3>
                  <p className="text-[15px] text-foreground/60 mt-3 leading-relaxed">
                    Join <span className="font-bold text-foreground">{m.level}</span> match at <span className="font-bold text-foreground">{m.facility}</span> on <span className="font-bold text-foreground">{m.date}</span> for <span className="font-bold text-emerald-400">₱{m.price}</span>?
                  </p>
                </div>
                <div className="flex flex-col p-5 pt-0 gap-3">
                  <button
                    onClick={confirmJoin}
                    disabled={isSimulating || simSuccess}
                    className="w-full py-4 rounded-[18px] text-[16px] font-extrabold text-black flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_rgba(52,211,153,0.3)]"
                    style={{
                      background: simSuccess ? "var(--accent-success)" : "var(--accent-primary)",
                      opacity: isSimulating ? 0.8 : 1,
                      transform: (isSimulating || simSuccess) ? "scale(0.98)" : "scale(1)",
                    }}>
                    {isSimulating ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                        className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full" />
                    ) : simSuccess ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                        <Check className="w-6 h-6 text-foreground" />
                      </motion.div>
                    ) : (
                      "Confirm & Join"
                    )}
                  </button>
                  <button
                    onClick={() => setShowJoinConfirm(false)}
                    disabled={isSimulating || simSuccess}
                    className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-foreground/80 bg-surface-interactive hover:bg-surface-interactive/80 border border-border active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none">
                    Cancel
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
