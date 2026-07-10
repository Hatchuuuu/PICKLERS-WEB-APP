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
      className="rounded-[24px] border border-solid p-5 flex gap-5 items-center cursor-default h-full"
      style={{ 
        background: joined ? "rgba(52,211,153,0.05)" : "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        borderColor: joined ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)", 
        boxShadow: joined ? "0 8px 32px rgba(52,211,153,0.15), inset 0 1px 1px rgba(255,255,255,0.1)" : "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)"
      }}>
      <CapacityRing filled={filled} max={m.max} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[12px] px-3 py-1 rounded-full font-bold tracking-wide" 
            style={{ 
              background: "rgba(255,255,255,0.06)", 
              color: "var(--accent-primary)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(8px)"
            }}>
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
        <div className="text-[16px] font-bold tracking-tight truncate" style={{ color: "var(--ink-primary)" }}>{m.facility}</div>
        <div className="text-[13px] font-medium mt-1" style={{ color: "var(--ink-secondary)" }}>{m.date} · {m.time}</div>
        <div className="text-[12px] font-medium mt-1" style={{ color: "var(--ink-muted)" }}>Host: {m.host}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-bold text-[16px]" style={{ color: "var(--accent-primary)" }}>₱{m.price}</div>
        <div className="text-[11px] font-medium mb-3" style={{ color: "var(--ink-muted)" }}>your share</div>
        {publicMode ? (
          <button onClick={onJoin} disabled={joined || full}
            className="text-[14px] px-6 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{
              background: joined ? "transparent" : full ? "rgba(255,255,255,0.05)" : "var(--accent-secondary)",
              color: joined ? "var(--accent-success)" : full ? "var(--ink-muted)" : "#ffffff",
              border: joined ? "1.5px solid var(--accent-success)" : "none",
              boxShadow: (!joined && !full) ? "0 4px 16px rgba(59, 130, 246, 0.35)" : "none",
              minWidth: "72px",
              transition: "all 150ms ease-out" }}
            onMouseEnter={e => { if (!joined && !full) e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            {joined ? "Joined" : full ? "Full" : "Join"}
          </button>
        ) : (
          <VerificationGate disabled={joined || full} onVerifiedClick={handleJoin}>
            <button disabled={joined || full}
              className="text-[14px] px-6 py-2.5 rounded-full font-bold active:scale-[0.95] transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: joined ? "transparent" : full ? "rgba(255,255,255,0.05)" : "var(--accent-secondary)",
                color: joined ? "var(--accent-success)" : full ? "var(--ink-muted)" : "#ffffff",
                border: joined ? "1.5px solid var(--accent-success)" : "none",
                boxShadow: (!joined && !full) ? "0 4px 16px rgba(59, 130, 246, 0.35)" : "none",
                minWidth: "72px",
                transition: "all 150ms ease-out" }}
              onMouseEnter={e => { if (!joined && !full) e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowJoinConfirm(false)} />
            
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}>
              <div className="w-full max-w-sm bg-gradient-to-b from-[#1c1c1e]/95 to-[#141415]/95 backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-white/[0.08] pb-safe">
                 <div className="p-8 text-center pb-6">
                   <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
                     <span className="text-[28px]">🤝</span>
                   </div>
                   <h3 className="text-[22px] font-black text-white tracking-tight" >Join Match?</h3>
                   <p className="text-[15px] text-white/60 mt-3 leading-relaxed">
                     Join <span className="font-bold text-white">{m.level}</span> match at <span className="font-bold text-white">{m.facility}</span> on <span className="font-bold text-white">{m.date}</span> for <span className="font-bold text-emerald-400">₱{m.price}</span>?
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
                         <Check className="w-6 h-6 text-white" />
                       </motion.div>
                     ) : (
                       "Confirm & Join"
                     )}
                   </button>
                   <button 
                     onClick={() => setShowJoinConfirm(false)} 
                     disabled={isSimulating || simSuccess}
                     className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none">
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
