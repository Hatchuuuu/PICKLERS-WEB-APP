"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatTime } from "@/lib/utils";
import { LiveCourt } from "@/types";


export function CourtCard({ court, onEnd, onAlertChange }: { court: LiveCourt; onEnd?: () => void; onAlertChange?: (isAlert: boolean) => void }) {
  const [seconds, setSeconds] = useState(court.remaining);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAlert = seconds <= 0 && court.status === "occupied";

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className={`rounded-2xl p-5 transition-all relative overflow-hidden backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] ${isAlert ? 'border border-red-500/60 dark:border-t-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15),inset_0_0_20px_rgba(239,68,68,0.05)] bg-red-500/5 animate-pulse' : 'bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10'}`}>
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
          <div className="flex items-center gap-1.5 mb-2 truncate">
            <span className="text-[13px] font-bold text-foreground truncate">{court.player || "Occupied"}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold shrink-0">Pass</span>
          </div>
          <div className={cn("tracking-tight font-mono mb-4", isAlert ? "flex items-center gap-2 text-[24px] xl:text-[26px] font-semibold" : "text-[28px] font-semibold text-cyan-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]")}
               style={isAlert ? { color: "#ff4b4b", textShadow: "0 0 12px rgba(255, 75, 75, 0.5)" } : {}}>
            {isAlert ? (
              <>
                <span className="whitespace-nowrap">TIME'S UP</span>
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
            className="w-full text-[13px] font-bold mt-2 py-2 rounded-xl active:scale-[0.97] transition-all bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/15 dark:border-red-500/20 dark:text-red-500 relative z-10">
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

      {mounted && createPortal(
        <AnimatePresence>
          {showEndConfirm && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                onClick={(e) => { e.stopPropagation(); setShowEndConfirm(false); }} />
              <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm flex flex-col gap-2 z-[610] items-center">
                <div className="w-full bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-6 text-center flex flex-col items-center">
                   <div className="relative mb-4 mt-1">
                     <div className="w-14 h-14 relative z-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-sm">
                       <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" strokeWidth={2.5} />
                     </div>
                   </div>
                   <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">{isAlert ? "Clear Court?" : "End Session Early?"}</h3>
                   <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed px-1">
                     {isAlert ? "Are you sure you want to clear this court and make it available again?" : "Are you sure you want to terminate this active session? The players will be notified that their court time has ended."}
                   </p>
                   <div className="flex gap-3 w-full mt-6">
                     <button onClick={(e) => { e.stopPropagation(); setShowEndConfirm(false); }} className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-semibold text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-all active:scale-[0.98] cursor-pointer">
                       {isAlert ? "Cancel" : "Keep Playing"}
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onEnd?.(); setShowEndConfirm(false); }} className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-md transition-all active:scale-[0.98] cursor-pointer">
                       {isAlert ? "Clear Court" : "End Session"}
                     </button>
                   </div>
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
