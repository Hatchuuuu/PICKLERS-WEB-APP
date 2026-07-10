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
  }, [court.status, seconds]);

  useEffect(() => {
    setSeconds(court.remaining);
  }, [court.remaining]);

  useEffect(() => {
    onAlertChange?.(isAlert);
  }, [isAlert, onAlertChange]);

  const pct = court.maxTime > 0 ? seconds / court.maxTime : 0;

  return (
    <div className={`rounded-3xl p-5 transition-all relative overflow-hidden backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${isAlert ? 'border border-red-500/60 dark:border-t-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15),inset_0_0_20px_rgba(239,68,68,0.05)] bg-red-500/5' : 'bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10'}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <span className="text-[16px] font-bold text-foreground tracking-tight leading-tight truncate whitespace-nowrap">{court.name}</span>
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn("w-3 h-3 rounded-full shrink-0",
          isAlert ? "bg-red-500 dark:shadow-[0_0_12px_rgba(239,68,68,0.8)]" :
          court.status === "occupied" ? "bg-cyan-500 dark:shadow-[0_0_12px_rgba(6,182,212,0.8)]" :
          court.status === "available" ? "bg-emerald-500 dark:shadow-[0_0_12px_rgba(16,185,129,0.8)]" : 
          "bg-muted"
        )} />
      </div>
      {court.status === "occupied" && (
        <>
          <div className="text-[13px] text-muted-foreground mb-2 truncate">{court.player}</div>
          <div className={cn("text-[28px] tracking-tight font-mono mb-4", isAlert ? "flex items-center gap-2 font-semibold" : "font-semibold text-cyan-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]")}
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
          <div className="w-full h-1.5 rounded-full mb-5 shadow-inner bg-black/5 dark:bg-black/30">
            <div className="h-1.5 rounded-full transition-all duration-1000 dark:shadow-[0_0_8px_currentColor]"
              style={{ width: `${pct * 100}%`, background: pct > 0.2 ? "var(--accent-primary)" : "var(--accent-danger)", color: pct > 0.2 ? "var(--accent-primary)" : "var(--accent-danger)" }} />
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEndConfirm(true); }}
            className="w-full text-[14px] font-bold mt-2 py-3 rounded-full active:scale-[0.97] transition-all bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-[#ff3b30]/10 dark:hover:bg-[#ff3b30]/15 dark:border-[#ff3b30]/15 dark:text-[#ff3b30] relative z-10">
            {isAlert ? "Clear Court" : "End Session Early"}
          </button>
        </>
      )}
      {court.status === "available" && (
        <div className="flex items-center gap-2 mt-2">
          <div className="w-full h-8 bg-surface-interactive/80 rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground border border-black/5 dark:border-white/5">
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

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showEndConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                 onClick={(e) => { e.stopPropagation(); setShowEndConfirm(false); }}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 text-center bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-[40px] saturate-150">
                <div className="mb-6">
                  <h3 className="text-[20px] font-bold text-foreground mb-2 tracking-tight">{isAlert ? "Clear Court?" : "End Session Early?"}</h3>
                  <p className="text-[14px] text-foreground/60 leading-relaxed">
                    {isAlert ? "Are you sure you want to clear this court and make it available again?" : "Are you sure you want to terminate this active session? The players will be notified that their court time has ended."}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={(e) => { e.stopPropagation(); onEnd?.(); setShowEndConfirm(false); }} 
                    className="w-full py-3.5 rounded-full text-[15px] font-bold text-white bg-[#FF3B30] shadow-[0_4px_12px_rgba(255,59,48,0.3)] hover:opacity-90 active:scale-[0.98] transition-all" >
                    {isAlert ? "Clear Court" : "End Session"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShowEndConfirm(false); }} 
                    className="w-full py-3.5 rounded-full text-[15px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 active:scale-[0.98] transition-all">
                    {isAlert ? "Cancel" : "Keep Playing"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
