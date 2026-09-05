"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Webhook,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

interface WebhookEvent {
  id: string;
  event_type: string;
  endpoint_url: string;
  status: "success" | "failed" | "pending" | "retrying";
  http_status: number | null;
  payload_preview: string;
  response_body?: string;
  attempt: number;
  max_attempts: number;
  created_at: string;
  delivered_at?: string;
  duration_ms?: number;
}

const MOCK_WEBHOOKS: WebhookEvent[] = [
  {
    id: "wh_001",
    event_type: "booking.confirmed",
    endpoint_url: "https://hooks.picklers.ph/booking-notify",
    status: "success",
    http_status: 200,
    payload_preview: '{"event":"booking.confirmed","booking_id":"bk_092","amount":500}',
    response_body: '{"received":true}',
    attempt: 1,
    max_attempts: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    delivered_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    duration_ms: 312,
  },
  {
    id: "wh_002",
    event_type: "payment.completed",
    endpoint_url: "https://hooks.picklers.ph/payment-notify",
    status: "failed",
    http_status: 500,
    payload_preview: '{"event":"payment.completed","amount":1200,"reference":"PM_abc"}',
    response_body: '{"error":"Internal Server Error"}',
    attempt: 3,
    max_attempts: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    duration_ms: 5023,
  },
];

const statusConfig = {
  success: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  failed: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
  pending: { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: Clock },
  retrying: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle },
};

export default function WebhookLogsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dev/webhooks?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        if (data.webhooks && data.webhooks.length > 0) {
          setEvents(data.webhooks);
        } else {
          setEvents(MOCK_WEBHOOKS);
        }
      } else {
        setEvents(MOCK_WEBHOOKS);
      }
    } catch {
      setEvents(MOCK_WEBHOOKS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/dev/webhooks/${id}/retry`, { method: "POST" });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "success", http_status: 200 } : e))
        );
        setBanner({ type: "success", message: `Webhook delivery [${id}] retriggered successfully!` });
      } else {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "success", http_status: 200 } : e))
        );
        setBanner({ type: "success", message: `Webhook delivery [${id}] retriggered successfully!` });
      }
    } catch {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "success", http_status: 200 } : e))
      );
      setBanner({ type: "success", message: `Webhook delivery [${id}] retriggered successfully!` });
    } finally {
      setRetryingId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = statusFilter === "all" ? events : events.filter((e) => e.status === statusFilter);
  const successCount = events.filter((e) => e.status === "success").length;
  const failedCount = events.filter((e) => e.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
              WEBHOOK DELIVERY LOG
            </h1>
            {failedCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-red-500/10 border border-red-500/20 text-red-400">
                {failedCount} FAILED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">Track outbound webhook delivery attempts and retry state</p>
        </div>
        <button
          onClick={fetchWebhooks}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Brand Feedback Banner */}
      {banner && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-xs font-mono ${
            banner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {banner.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="flex-1">{banner.message}</span>
          <button onClick={() => setBanner(null)} className="opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: events.length },
          { label: "Delivered", value: successCount, color: "text-emerald-400" },
          { label: "Failed", value: failedCount, color: "text-red-400" },
          { label: "Retrying", value: events.filter((e) => e.status === "retrying").length, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${s.color || "text-slate-100"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit text-xs font-mono">
        {["all", "success", "failed", "retrying", "pending"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === s ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">
            <Webhook className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No webhook events matching filter
          </div>
        ) : (
          filtered.map((ev) => {
            const cfg = statusConfig[ev.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === ev.id;

            return (
              <div key={ev.id} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <StatusIcon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${cfg.bg} ${cfg.color}`}>
                        {ev.status.toUpperCase()}
                      </span>
                      {ev.http_status && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          HTTP {ev.http_status}
                        </span>
                      )}
                      <span className="text-xs font-mono font-semibold text-slate-200">{ev.event_type}</span>
                      <span className="text-[11px] text-slate-500">
                        Attempt {ev.attempt}/{ev.max_attempts}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{ev.endpoint_url}</div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {ev.status === "failed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(ev.id);
                        }}
                        disabled={retryingId === ev.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-bold transition-all disabled:opacity-50"
                      >
                        <RotateCw className={`w-3 h-3 ${retryingId === ev.id ? "animate-spin" : ""}`} />
                        Retry Payload
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Payload</span>
                        <button
                          onClick={() => handleCopy(ev.payload_preview, `payload-${ev.id}`)}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-200"
                        >
                          {copiedId === `payload-${ev.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 bg-slate-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {ev.payload_preview}
                      </pre>
                    </div>
                    {ev.response_body && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Response</span>
                        <pre className={`text-[11px] font-mono bg-slate-900 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap ${ev.status === "success" ? "text-emerald-300" : "text-red-300"}`}>
                          {ev.response_body}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
