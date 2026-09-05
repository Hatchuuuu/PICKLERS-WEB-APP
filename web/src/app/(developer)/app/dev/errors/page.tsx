"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  RefreshCw,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

interface ErrorEvent {
  id: string;
  error_type: string;
  message: string;
  stack_trace: string;
  component: string;
  environment: string;
  severity: "error" | "fatal" | "warn";
  status: "unresolved" | "investigating" | "resolved";
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
}

const MOCK_ERRORS: ErrorEvent[] = [
  {
    id: "err_001",
    error_type: "PayMongoWebhookSignatureInvalid",
    message: "Webhook payload signature verification failed for event pay_89102",
    stack_trace: `Error: Signature mismatch\n    at verifyWebhookSignature (/app/api/webhooks/paymongo/route.ts:42:11)\n    at POST (/app/api/webhooks/paymongo/route.ts:18:5)`,
    component: "api/webhooks",
    environment: "production",
    severity: "error",
    status: "unresolved",
    occurrence_count: 14,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    last_seen_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "err_002",
    error_type: "SupabaseConnectionTimeout",
    message: "Connection pool exhausted during peak booking window",
    stack_trace: `Error: PGBouncer connection pool full\n    at createClient (/lib/supabase.ts:12:3)\n    at getAvailableCourts (/lib/db/courts.ts:88:21)`,
    component: "database",
    environment: "production",
    severity: "fatal",
    status: "unresolved",
    occurrence_count: 3,
    first_seen_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    last_seen_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
];

export default function ErrorIntelligencePage() {
  const { showToast } = useToast();
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentService, setIncidentService] = useState("api");
  const [incidentSeverity, setIncidentSeverity] = useState("error");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  const [isUsingMockData, setIsUsingMockData] = useState(false);

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dev/errors");
      if (res.ok) {
        const data = await res.json();
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
          setIsUsingMockData(false);
        } else {
          setErrors(MOCK_ERRORS);
          setIsUsingMockData(true);
        }
      } else {
        setErrors(MOCK_ERRORS);
        setIsUsingMockData(true);
      }
    } catch {
      setErrors(MOCK_ERRORS);
      setIsUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIncidentModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/dev/errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });

      if (res.ok) {
        setErrors((prev) => prev.filter((e) => e.id !== id));
        showToast(`Error alert [${id}] marked resolved.`, "success");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || `Failed to resolve error alert [${id}]`, "error");
      }
    } catch {
      showToast(`Network error resolving error alert [${id}]`, "error");
    }
  };

  const handleCopyTrace = (trace: string, id: string) => {
    navigator.clipboard.writeText(trace).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle.trim()) return;

    setIsSubmittingIncident(true);
    try {
      const res = await fetch("/api/dev/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: incidentTitle.trim(),
          service: incidentService,
          severity: incidentSeverity,
          description: incidentDescription.trim(),
        }),
      });

      if (res.ok) {
        showToast("Incident logged and broadcast to telemetry.", "success");
        setShowIncidentModal(false);
        setIncidentTitle("");
        setIncidentDescription("");
        fetchErrors();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create incident", "error");
      }
    } catch {
      showToast("Incident registration request failed", "error");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const activeErrors = errors.filter((e) => e.status !== "resolved");

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              ERROR INTELLIGENCE
            </h1>
            {activeErrors.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {activeErrors.length} UNRESOLVED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time exception tracking, stack traces, and error occurrence metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowIncidentModal(true)}
            aria-label="Log new manual incident"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Incident</span>
          </button>

          <button
            onClick={fetchErrors}
            disabled={loading}
            aria-label="Refresh error events list"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Mock Telemetry Notice Banner */}
      {isUsingMockData && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-sans shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="font-semibold">
              Live error telemetry table unavailable or empty. Displaying simulated diagnostic events.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
            SIMULATED MODE
          </span>
        </div>
      )}

      {/* Error Cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))
        ) : activeErrors.length === 0 ? (
          <div className="text-center py-16 text-slate-500 font-mono text-sm bg-slate-900/20 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 opacity-60" />
            Zero active unresolved error alerts! System nominal.
          </div>
        ) : (
          activeErrors.map((err) => {
            const isExpanded = expandedId === err.id;
            return (
              <div key={err.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : err.id)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {err.severity === "fatal" ? (
                      <XCircle className="w-5 h-5 text-purple-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 font-mono">{err.error_type}</span>
                        {isUsingMockData && (
                          <span className="text-[9px] font-mono font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            SIMULATED
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {err.component}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          {err.occurrence_count}x events
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans mt-1 truncate">{err.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResolve(err.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all"
                    >
                      Resolve
                    </button>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>First seen: {new Date(err.first_seen_at).toLocaleString()}</span>
                        <span>·</span>
                        <span>Last seen: {new Date(err.last_seen_at).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleCopyTrace(err.stack_trace, err.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        {copiedId === err.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedId === err.id ? "Copied Trace" : "Copy Trace"}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-red-300 overflow-x-auto whitespace-pre-wrap">
                      {err.stack_trace}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Log Manual Incident Modal */}
      {showIncidentModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
          onClick={() => setShowIncidentModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 space-y-4 shadow-[0_25px_60px_rgba(0,0,0,0.5)] font-mono text-xs z-[610]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-foreground text-sm">LOG MANUAL INCIDENT</h3>
              </div>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  placeholder="e.g. Stripe checkout latency degradation"
                  className="w-full p-2.5 rounded-xl border border-border bg-surface-interactive text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Component / Service
                  </label>
                  <select
                    value={incidentService}
                    onChange={(e) => setIncidentService(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface-interactive text-foreground focus:outline-none"
                  >
                    <option value="api">API Layer</option>
                    <option value="database">Database (PGBouncer)</option>
                    <option value="auth">Auth Services</option>
                    <option value="payments">Payment Gateway</option>
                    <option value="webhooks">Webhook Dispatcher</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-surface-interactive text-foreground focus:outline-none"
                  >
                    <option value="warn">Warning (P3)</option>
                    <option value="error">Error (P2)</option>
                    <option value="fatal">Fatal Outage (P1)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                  Description / Error Log
                </label>
                <textarea
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Paste relevant trace or triage notes..."
                  className="w-full p-2.5 rounded-xl border border-border bg-surface-interactive text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-surface-interactive hover:bg-surface-interactive/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIncident}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmittingIncident ? "Logging..." : "Create Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
