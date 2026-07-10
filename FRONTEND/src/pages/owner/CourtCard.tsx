import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatTime } from "@/lib/utils";
import { LIVE_COURTS } from "@/data/mockData";


export function CourtCard({ court, onEnd, onAlertChange }: { court: typeof LIVE_COURTS[0]; onEnd?: () => void; onAlertChange?: (isAlert: boolean) => void }) {
  const [seconds, setSeconds] = useState(court.remaining);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const isAlert = seconds <= 0 && court.status === "occupied";

  useEffect(() => {
    if (court.status !== "occupied" || seconds <= 0) return;
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [court.status]);

  useEffect(() => {
    onAlertChange?.(isAlert);
  }, [isAlert, onAlertChange]);

  const pct = court.maxTime > 0 ? seconds / court.maxTime : 0;

  return (
    <div className={`rounded-3xl p-5 transition-all relative overflow-hidden backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${isAlert ? 'border border-red-500/60 dark:border-t-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15),inset_0_0_20px_rgba(239,68,68,0.05)] bg-red-500/5' : 'bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[15px] font-bold text-foreground tracking-tight">{court.name}</span>
        <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wide shadow-sm",
          court.status === "occupied" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
          court.status === "available" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-surface-interactive text-muted-foreground border border-border")}>
          {court.status.toUpperCase()}
        </span>
      </div>
      {court.status === "occupied" && (
        <>
          <div className="text-[13px] text-muted-foreground mb-1.5 truncate">{court.player}</div>
          <div className={cn("text-2xl font-mono mb-3", isAlert ? "flex items-center gap-2 font-medium" : "font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]")}
               style={isAlert ? { color: "#ff4b4b", textShadow: "0 0 12px rgba(255, 75, 75, 0.5)" } : {}}>
            {isAlert ? (
              <>
                <motion.span 
                  animate={{ opacity: [1, 0.4, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="w-2.5 h-2.5 rounded-full bg-[#ff4b4b] shadow-[0_0_8px_#ff4b4b]"
                />
                TIME UP
              </>
            ) : (
              formatTime(seconds)
            )}
          </div>
          <div className="w-full h-1.5 rounded-full mb-4 shadow-inner" style={{ background: "rgba(0,0,0,0.3)" }}>
            <div className="h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_currentColor]"
              style={{ width: `${pct * 100}%`, background: pct > 0.2 ? "var(--accent-primary)" : "var(--accent-danger)", color: pct > 0.2 ? "var(--accent-primary)" : "var(--accent-danger)" }} />
          </div>
          <button onClick={() => setShowEndConfirm(true)}
            className="w-full text-[13px] font-semibold mt-1.5 py-2.5 rounded-full active:scale-[0.97] transition-all bg-[#ff3b30]/10 hover:bg-[#ff3b30]/15 border border-[#ff3b30]/15 text-[#ff3b30]">
            Skip / End Session
          </button>
        </>
      )}
      {court.status === "available" && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-full h-8 bg-surface-interactive/80 rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground border border-white/5">
            Waiting for players
          </div>
        </div>
      )}
      {court.status === "maintenance" && (
        <div className="flex items-center gap-2 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-400">Under maintenance</span>
        </div>
      )}

      <AnimatePresence>
        {showEndConfirm && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-base/60 backdrop-blur-sm"
               onClick={() => setShowEndConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border text-center bg-surface-base/95 dark:bg-[#1e1e20]/75 backdrop-blur-[40px] saturate-150 dark:border-white/[0.15]">
              <h3 className="text-xl font-bold text-foreground mb-2">End Session Early?</h3>
              <p className="text-[14px] text-foreground/60 mb-6 leading-relaxed">Are you sure you want to terminate this active session? The players will be notified that their court time has ended.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { onEnd?.(); setShowEndConfirm(false); }} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg bg-accent-danger text-white" >
                  End Session
                </button>
                <button onClick={() => setShowEndConfirm(false)} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                  Keep Playing
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
