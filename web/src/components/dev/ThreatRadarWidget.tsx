"use client";

import { motion } from "motion/react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ThreatStats } from "@/types/developer";

interface ThreatRadarWidgetProps {
  stats: ThreatStats | null;
  isLoading: boolean;
}

export function ThreatRadarWidget({ stats, isLoading }: ThreatRadarWidgetProps) {
  const defcon = stats?.defcon_level ?? 5;
  const defconLabel = stats?.defcon_label ?? "DEFCON 5 • NOMINAL";

  const getDefconColor = (level: number) => {
    switch (level) {
      case 1:
        return {
          border: "border-red-500/40",
          bg: "bg-red-950/40",
          text: "text-red-400",
          glow: "shadow-[0_0_30px_rgba(239,68,68,0.25)]",
          badgeBg: "bg-red-500/20",
          badgeBorder: "border-red-500/30",
        };
      case 2:
      case 3:
        return {
          border: "border-amber-500/40",
          bg: "bg-amber-950/40",
          text: "text-amber-400",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.2)]",
          badgeBg: "bg-amber-500/20",
          badgeBorder: "border-amber-500/30",
        };
      default:
        return {
          border: "border-cyan-500/40",
          bg: "bg-slate-900/60",
          text: "text-cyan-400",
          glow: "shadow-[0_0_30px_rgba(6,182,212,0.15)]",
          badgeBg: "bg-cyan-500/20",
          badgeBorder: "border-cyan-500/30",
        };
    }
  };

  const theme = getDefconColor(defcon);

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} p-6 backdrop-blur-2xl transition-all duration-500 font-mono`}>
      {/* Background Radar Animation Sweep */}
      <div className="absolute right-[-40px] top-[-40px] w-64 h-64 pointer-events-none opacity-20">
        <div className="w-full h-full rounded-full border border-cyan-500/30 relative flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-full border border-cyan-500/20 flex items-center justify-center">
            <div className="w-1/2 h-1/2 rounded-full border border-cyan-500/20" />
          </div>
          {/* Rotating sweep line */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 origin-center flex items-center justify-center"
          >
            <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent to-cyan-400 self-start ml-auto" />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: DEFCON Level and Indicator */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${theme.badgeBg} border ${theme.badgeBorder} ${theme.text} shrink-0`}>
            {defcon === 1 ? (
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            ) : defcon <= 3 ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <ShieldCheck className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${defcon === 1 ? "bg-red-400" : defcon <= 3 ? "bg-amber-400" : "bg-cyan-400"}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${defcon === 1 ? "bg-red-500" : defcon <= 3 ? "bg-amber-500" : "bg-cyan-500"}`} />
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>
                LIVE SYSTEM DEFENSE RADAR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {isLoading ? "CALCULATING THREAT STATUS..." : defconLabel}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Intrusion Detection System (IDS) monitoring edge scanner probes, honeypot traps, and injection signatures.
            </p>
          </div>
        </div>

        {/* Right: Quick Stat Badges */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-500 font-bold uppercase">24h Attacks</div>
            <div className="text-lg font-bold text-slate-100">
              {isLoading ? "-" : stats?.total_threats_24h ?? 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[100px]">
            <div className="text-[10px] text-amber-500/80 font-bold uppercase">Active Threats</div>
            <div className="text-lg font-bold text-amber-400">
              {isLoading ? "-" : stats?.active_threats ?? 0}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[100px]">
            <div className="text-[10px] text-red-500/80 font-bold uppercase">Blocked IPs</div>
            <div className="text-lg font-bold text-red-400">
              {isLoading ? "-" : stats?.blocked_ips_count ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
