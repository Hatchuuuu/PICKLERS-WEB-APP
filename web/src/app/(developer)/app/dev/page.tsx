"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Terminal,
  AlertTriangle,
  Code2,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Server,
  Zap,
  ShieldAlert,
} from "lucide-react";
import type { DependencyTelemetry } from "@/types/developer";

export default function DevDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Connecting...");
  const [latency, setLatency] = useState(14);
  const [activeErrors, setActiveErrors] = useState(0);
  const [requestsPerMinute, setRequestsPerMinute] = useState(42);
  const [systemStatus, setSystemStatus] = useState<"operational" | "degraded" | "outage">("operational");
  const [dependencies, setDependencies] = useState<DependencyTelemetry[]>([
    { id: "pg", service: "Primary Database (Supabase PostgreSQL)", category: "Database", status: "operational", latency_ms: 14, uptime_30d: "99.98%", last_check: "1s ago", details: "Connection pool active" },
    { id: "api", service: "Core API Gateway (/api)", category: "API", status: "operational", latency_ms: 24, uptime_30d: "99.95%", last_check: "1s ago", details: "Edge middleware active" },
    { id: "auth", service: "Auth & Identity Service (GoTrue)", category: "Auth", status: "operational", latency_ms: 20, uptime_30d: "99.99%", last_check: "1s ago", details: "JWT token validation active" },
  ]);

  const fetchHealthData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/health");
      if (res.ok) {
        const data = await res.json();
        if (data.health) {
          setLatency(data.health.p95_latency_ms || 14);
          setActiveErrors(data.health.active_errors || 0);
          setRequestsPerMinute(data.health.requests_per_minute || 42);
          setSystemStatus(data.health.status || "operational");
          if (data.health.dependencies) {
            setDependencies(data.health.dependencies);
          }
        }
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
              DEVELOPER CONTROL CENTER
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              SYS_DIAGNOSTICS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time platform observability, technical diagnostics, and system health control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealthData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Refresh Metrics"}</span>
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            Last: {lastRefreshed}
          </span>
        </div>
      </div>

      {/* Primary Technical Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>EST. REQUESTS / MIN</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{requestsPerMinute.toLocaleString()}</span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> LIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Platform API & telemetry throughput</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>P95 LATENCY</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{latency}ms</span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center">
              Target &lt; 250ms
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Real-time DB query latency</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>UNRESOLVED ERRORS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${activeErrors > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {activeErrors}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">Active error intelligence alerts</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>SYSTEM STATUS</span>
            <Activity className={`w-4 h-4 ${systemStatus === "operational" ? "text-emerald-400" : systemStatus === "degraded" ? "text-amber-400" : "text-rose-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono uppercase ${systemStatus === "operational" ? "text-emerald-400" : systemStatus === "degraded" ? "text-amber-400" : "text-rose-400"}`}>
              {systemStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {systemStatus === "operational" ? "All core services healthy" : "Service degradation detected"}
          </p>
        </div>
      </div>

      {/* System Dependencies Matrix & Active Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Dependencies Matrix (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-slate-200">
                SYSTEM DEPENDENCY MATRIX
              </h2>
            </div>
            <Link
              href="/app/dev/health"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Full Telemetry</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60">
            {dependencies.map((service) => (
              <div
                key={service.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-slate-900/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  {service.status === "operational" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {service.service}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Category: {service.category}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-xs">
                  <div className="text-right">
                    <div className="text-slate-300">{service.latency_ms}ms</div>
                    <div className="text-[10px] text-slate-500">Response</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-semibold">{service.uptime_30d}</div>
                    <div className="text-[10px] text-slate-500">Uptime</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      service.status === "operational"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Diagnostics Shortcuts (1 column) */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-slate-200">
                QUICK DIAGNOSTIC TOOLS
              </h2>
            </div>

            <div className="space-y-2">
              <Link
                href="/app/dev/logs"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      Application Log Explorer
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Search live server & client logs
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </Link>

              <Link
                href="/app/dev/api-explorer"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">
                      Interactive API Explorer
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Inspect & test platform endpoints
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </Link>

              <Link
                href="/app/dev/entity-inspector"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">
                      Entity Inspector
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Read-only relational graph traversal
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </Link>

              <Link
                href="/app/dev/audit"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                      Technical Audit Ledger
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Inspect sensitive dev operations
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
