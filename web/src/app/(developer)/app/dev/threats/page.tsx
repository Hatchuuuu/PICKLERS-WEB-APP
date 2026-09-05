"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RotateCcw,
  AlertTriangle,
  Radio,
  Eye,
} from "lucide-react";
import { ThreatRadarWidget } from "@/components/dev/ThreatRadarWidget";
import { ThreatIncidentDrawer } from "@/components/dev/ThreatIncidentDrawer";
import type { ThreatEvent, ThreatStats } from "@/types/developer";

export default function ThreatRadarPage() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMigration, setPendingMigration] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Incident for Drawer
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchThreatData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [threatsRes, statsRes] = await Promise.all([
        fetch(`/api/dev/threats?${params.toString()}`),
        fetch("/api/dev/threats/stats"),
      ]);

      if (!threatsRes.ok) {
        const json = await threatsRes.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load threat events");
      }

      if (!statsRes.ok) {
        const json = await statsRes.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load threat stats");
      }

      const threatsData = await threatsRes.json();
      const statsData = await statsRes.json();

      if (threatsData.pending_migration || statsData.stats?.pending_migration) {
        setPendingMigration(true);
      } else {
        setPendingMigration(false);
      }

      setThreats(threatsData.data || []);
      setStats(statsData.stats || null);
    } catch (err: unknown) {
      console.error("Error fetching threat radar data:", err);
      const message = err instanceof Error ? err.message : "Failed to load threat radar";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, severityFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchThreatData();
    // Auto-poll threat radar every 15 seconds for real-time monitoring
    const timer = setInterval(() => {
      fetchThreatData();
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchThreatData]);

  const handleBlockIp = async (ip: string, threatId: string, userId?: string) => {
    try {
      const res = await fetch("/api/dev/threats/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip_address: ip,
          threat_event_id: threatId,
          quarantine_user_id: userId,
          reason: "Manual developer ban via Threat Radar",
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to block IP");
      }

      setActionSuccess(`IP ${ip} has been quarantined & blocked successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setSelectedThreat(null);
      fetchThreatData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error blocking IP");
    }
  };

  const handleResolveThreat = async (threatId: string) => {
    try {
      const res = await fetch(`/api/dev/threats/${threatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to resolve incident");
      }

      setActionSuccess("Threat incident marked as resolved.");
      setTimeout(() => setActionSuccess(null), 4000);
      setSelectedThreat(null);
      fetchThreatData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error resolving threat");
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
    <div className="flex flex-col gap-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              CYBER DEFENSE & THREAT RADAR
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time Intrusion Detection System (IDS), honeypot traps, and edge penetration telemetry.
          </p>
        </div>

        <button
          onClick={() => fetchThreatData()}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center gap-2 self-start cursor-pointer"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Migration Setup Banner */}
      {pendingMigration && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Database Tables Required (`security_threat_events` & `blocked_ips`)</span>
          </div>
          <p className="text-[11px] text-amber-300/80 font-sans">
            To activate the live Intrusion Detection System and honeypot logging, run the migration script in your Supabase SQL Editor:
            <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[10px]">
              web/supabase/migrations/20260818_intrusion_detection_system.sql
            </code>
          </p>
        </div>
      )}

      {/* Live Threat Radar DEFCON HUD */}
      <ThreatRadarWidget stats={stats} isLoading={isLoading} />

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by IP, target path, or city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Attack Types</option>
            <option value="honeypot_trap">Honeypot Traps</option>
            <option value="sqli_probe">SQL Injection Probes</option>
            <option value="xss_probe">XSS Probes</option>
            <option value="path_traversal">Path Traversal</option>
            <option value="privilege_escalation">Privilege Escalation</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="detected">Detected</option>
            <option value="blocked">Blocked</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Security Threats Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-slate-200 uppercase">
              INTERCEPTED THREAT LOGS ({threats.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Real-time scanner & probe telemetry
          </span>
        </div>

        {isLoading && threats.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
            Scanning network telemetry and security threat logs...
          </div>
        ) : threats.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-2 text-xs">
            <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-200">RADAR IS CLEAR</div>
            <div className="text-slate-500 font-sans max-w-sm">
              No unauthorized penetration attempts or honeypot triggers detected matching the current filter.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {threats.map((threat) => (
              <div
                key={threat.id}
                onClick={() => setSelectedThreat(threat)}
                className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase shrink-0 ${getSeverityBadge(threat.severity)}`}>
                    {threat.severity}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {threat.threat_type.toUpperCase()}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">
                        {threat.http_method} {threat.target_path}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="text-slate-400 font-bold">{threat.ip_address}</span>
                      <span>•</span>
                      <span>{threat.city || "Unknown"}, {threat.country_code || "Global"}</span>
                      <span>•</span>
                      <span>{new Date(threat.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    threat.status === "blocked"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : threat.status === "resolved"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {threat.status}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedThreat(threat);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Inspect incident payload"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payload & Incident Inspector Slide-Over Drawer */}
      <ThreatIncidentDrawer
        threat={selectedThreat}
        isOpen={Boolean(selectedThreat)}
        onClose={() => setSelectedThreat(null)}
        onBlockIp={handleBlockIp}
        onResolveThreat={handleResolveThreat}
      />
    </div>
  );
}
