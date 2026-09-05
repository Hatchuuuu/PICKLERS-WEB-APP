"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Globe,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import type { ThreatEvent } from "@/types/developer";

interface ThreatIncidentDrawerProps {
  threat: ThreatEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onBlockIp: (ip: string, threatId: string, userId?: string) => Promise<void>;
  onResolveThreat: (threatId: string) => Promise<void>;
}

export function ThreatIncidentDrawer({
  threat,
  isOpen,
  onClose,
  onBlockIp,
  onResolveThreat,
}: ThreatIncidentDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !threat) return null;

  const handleCopyPayload = () => {
    const content = typeof threat.payload_preview === "object"
      ? JSON.stringify(threat.payload_preview, null, 2)
      : String(threat.payload_preview || "");
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBlock = async () => {
    setIsProcessing(true);
    try {
      await onBlockIp(threat.ip_address, threat.id, threat.user_id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async () => {
    setIsProcessing(true);
    try {
      await onResolveThreat(threat.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
        />

        {/* Drawer Container */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-xl bg-surface-overlay dark:bg-[#13223F] border-l border-border dark:border-white/12 h-full overflow-y-auto flex flex-col shadow-2xl z-[610] font-mono text-xs text-foreground"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface-interactive/30 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">
                    {threat.threat_type.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border uppercase text-[10px] font-bold ${getSeverityBadge(
                      threat.severity
                    )}`}
                  >
                    {threat.severity}
                  </span>
                </div>
                <div className="text-muted-foreground text-[10px] flex items-center gap-1.5 mt-0.5">
                  <Terminal className="w-3 h-3" />
                  <span>ID: {threat.id.slice(0, 8)}...</span>
                  <span>•</span>
                  <span>{new Date(threat.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-lg hover:bg-surface-interactive text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex-1">
            {/* Severity & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Severity Level
                </span>
                <span className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase ${getSeverityBadge(threat.severity)}`}>
                  {threat.severity}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Incident Status
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-bold uppercase text-cyan-300">
                  {threat.status}
                </span>
              </div>
            </div>

            {/* Attacker Origin Info */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Attacker Origin & Network</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 text-[10px] block">IP Address:</span>
                  <span className="font-bold text-slate-100">{threat.ip_address}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Location:</span>
                  <span>{threat.city || "Unknown"}, {threat.country_code || "Global"}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">HTTP Method:</span>
                  <span className="text-emerald-400 font-bold">{threat.http_method}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Timestamp:</span>
                  <span>{new Date(threat.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-0.5">User-Agent:</span>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-400 break-all">
                  {threat.user_agent || "None specified"}
                </div>
              </div>
            </div>

            {/* Payload / Query Inspector */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Payload & Request Parameters</span>
                </div>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy Payload"}</span>
                </button>
              </div>

              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 overflow-x-auto max-h-56">
                {typeof threat.payload_preview === "object"
                  ? JSON.stringify(threat.payload_preview, null, 2)
                  : String(threat.payload_preview || "No body payload captured")}
              </pre>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <button
                disabled={isProcessing}
                onClick={handleBlock}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>{threat.user_id ? "Ban IP & Quarantine User" : "Block Attacker IP"}</span>
              </button>

              <button
                disabled={isProcessing}
                onClick={handleResolve}
                className="py-3 px-4 rounded-xl font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Resolve</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
