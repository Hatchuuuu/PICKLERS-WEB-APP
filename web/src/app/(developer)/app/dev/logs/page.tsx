"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Activity,
  Download,
  AlertTriangle,
} from "lucide-react";
import { LogLevel } from "@/types/developer";
import { useToast } from "@/contexts/ToastContext";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  request_id: string;
  trace_id: string;
  metadata?: Record<string, unknown>;
}

const MOCK_LOGS: LogEntry[] = [
  { id: "log-1", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), level: "INFO", service: "api-gateway", message: "GET /api/admin/users 200 OK (latency: 42ms)", request_id: "req_9f821a", trace_id: "tr_8271049", metadata: { method: "GET", path: "/api/admin/users", status: 200, latency_ms: 42, ip: "192.168.1.10" } },
  { id: "log-2", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: "WARN", service: "webhook-service", message: "Webhook retry attempt 2/3 for target https://partner.com/api/webhook (timeout 5000ms)", request_id: "req_7481bb", trace_id: "tr_9918231", metadata: { attempt: 2, max_attempts: 3, endpoint: "https://partner.com/api/webhook", reason: "ETIMEDOUT" } },
  { id: "log-3", timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), level: "ERROR", service: "auth-service", message: "Failed login attempt for user admin@picklers.ph: invalid password hash match", request_id: "req_3310aa", trace_id: "tr_1120492", metadata: { email: "admin@picklers.ph", failure_reason: "invalid_credentials", attempts_remaining: 3 } },
  { id: "log-4", timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), level: "INFO", service: "booking-service", message: "Booking #bk_88192 confirmed for Facility #fac_102 (amount: ₱1,500.00)", request_id: "req_1092cc", trace_id: "tr_4491023", metadata: { booking_id: "bk_88192", facility_id: "fac_102", amount_php: 1500, payment_status: "paid" } },
  { id: "log-5", timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(), level: "DEBUG", service: "cache-service", message: "Cache hit for key facility_details_fac_102 (ttl: 300s)", request_id: "req_0029dd", trace_id: "tr_0029311", metadata: { key: "facility_details_fac_102", ttl_seconds: 300, strategy: "redis_lru" } },
];

export default function ApplicationLogsPage() {
  const { showToast } = useToast();
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (levelFilter !== "ALL") params.append("level", levelFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/dev/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
          setIsUsingMockData(false);
        } else {
          setLogs(MOCK_LOGS);
          setIsUsingMockData(true);
        }
      } else {
        setLogs(MOCK_LOGS);
        setIsUsingMockData(true);
      }
    } catch {
      setLogs(MOCK_LOGS);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Robust live polling stream using useRef
  useEffect(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    if (isStreaming) {
      streamIntervalRef.current = setInterval(() => {
        fetchLogs();
      }, 4000);
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isStreaming, fetchLogs]);

  const handleCopy = (text: string, label = "Item") => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`${label} copied to clipboard`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `picklers_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported ${logs.length} log entries to JSON`, "success");
  };

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case "INFO": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "WARN": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ERROR": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "FATAL": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "DEBUG": return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              APPLICATION LOG EXPLORER
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time streaming log telemetry, request correlation trace search, and exception inspection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportJSON}
            aria-label="Export logs to JSON"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            aria-label="Toggle live log streaming"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isStreaming
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isStreaming ? "animate-pulse text-emerald-400" : "text-cyan-400"}`} />
            <span>{isStreaming ? "Live Streaming (4s)" : "Stream Live"}</span>
          </button>
        </div>
      </div>

      {/* Mock Telemetry Notice Banner */}
      {isUsingMockData && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400 text-xs font-sans">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Live log ingestion pipeline unavailable or empty. Displaying simulated runtime traces.</span>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter logs by keyword"
            placeholder="Filter logs by message, request ID, service..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filter by log level"
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 w-full sm:w-auto"
          >
            <option value="ALL">All Levels</option>
            <option value="DEBUG">DEBUG</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="FATAL">FATAL</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            aria-label="Refresh logs"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Log Console Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Log Message</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Trace ID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No application log entries match your filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <tbody key={log.id} className="group">
                      <tr
                        className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                          isExpanded ? "bg-slate-900/50" : ""
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(log.level)}`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-300 whitespace-nowrap">{log.service}</td>
                        <td className="px-4 py-3 text-slate-200 max-w-md truncate font-sans">{log.message}</td>
                        <td className="px-4 py-3 text-cyan-400 whitespace-nowrap">{log.request_id}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <span>{log.trace_id}</span>
                            <button
                              onClick={() => handleCopy(log.trace_id, "Trace ID")}
                              aria-label="Copy trace ID"
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
                            >
                              {copiedId === log.trace_id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Detailed Expanded Row View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-slate-800">
                            <div className="bg-slate-950 p-4 space-y-3 border-t border-slate-800/60">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                                <div className="flex items-center gap-3">
                                  <span>Log ID: <strong className="text-slate-200">{log.id}</strong></span>
                                  <span>·</span>
                                  <span>Full Timestamp: <strong className="text-slate-200">{new Date(log.timestamp).toLocaleString()}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopy(JSON.stringify(log, null, 2), "Raw Log JSON")}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy JSON</span>
                                  </button>
                                </div>
                              </div>

                              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                                  Full Message Payload
                                </div>
                                <div className="text-xs text-slate-200 font-sans break-words whitespace-pre-wrap">
                                  {log.message}
                                </div>
                              </div>

                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                                    Structured Metadata
                                  </div>
                                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
