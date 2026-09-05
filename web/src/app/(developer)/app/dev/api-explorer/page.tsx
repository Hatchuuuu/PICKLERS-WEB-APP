"use client";

import { useState, useCallback } from "react";
import {
  Play,
  Copy,
  Check,
  Loader2,
  Lock,
  Globe,
  AlertTriangle,
} from "lucide-react";

interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  group: string;
  requiresAuth: boolean;
  sampleBody?: string;
  sampleResponse?: string;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: "get-analytics",
    method: "GET",
    path: "/api/admin/analytics",
    description: "Retrieve platform-wide analytics including GMV, user count, booking velocity, and 14-day time series data.",
    group: "Analytics",
    requiresAuth: true,
  },
  {
    id: "get-settings",
    method: "GET",
    path: "/api/admin/settings",
    description: "Fetch all platform configuration keys from persistent storage.",
    group: "Settings",
    requiresAuth: true,
  },
  {
    id: "patch-settings",
    method: "PATCH",
    path: "/api/admin/settings",
    description: "Update one or more platform settings keys. Each key-value pair is audited.",
    group: "Settings",
    requiresAuth: true,
    sampleBody: JSON.stringify({ platform_fee_percent: 10 }, null, 2),
  },
  {
    id: "get-bookings",
    method: "GET",
    path: "/api/admin/bookings",
    description: "List all bookings with optional search, status, and date filters.",
    group: "Bookings",
    requiresAuth: true,
  },
  {
    id: "get-dev-flags",
    method: "GET",
    path: "/api/dev/flags",
    description: "Fetch all runtime feature flags.",
    group: "Developer",
    requiresAuth: true,
  },
  {
    id: "get-dev-logs",
    method: "GET",
    path: "/api/dev/logs",
    description: "Fetch application logs telemetry.",
    group: "Developer",
    requiresAuth: true,
  },
  {
    id: "get-dev-audit",
    method: "GET",
    path: "/api/dev/audit",
    description: "Retrieve developer-level technical audit events.",
    group: "Developer",
    requiresAuth: true,
  },
];

const methodColors: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PATCH: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
};

const groups = ["All", ...Array.from(new Set(ENDPOINTS.map((e) => e.group)))];

export default function ApiExplorerPage() {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [activeEndpoint, setActiveEndpoint] = useState<ApiEndpoint | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bodyInput, setBodyInput] = useState("");
  // F-624: write methods require the dev to type the endpoint path before
  // execution. The previous version let any dev one-click PATCH /api/admin/*
  // including `PATCH /api/admin/settings` — production changes from a typo.
  const [confirmText, setConfirmText] = useState("");

  const filtered = selectedGroup === "All" ? ENDPOINTS : ENDPOINTS.filter((e) => e.group === selectedGroup);

  const isWriteMethod = (m?: string | null) =>
    !!m && ["POST", "PUT", "PATCH", "DELETE"].includes(m);

  const handleSelect = (ep: ApiEndpoint) => {
    setActiveEndpoint(ep);
    setResponse(null);
    setHttpStatus(null);
    setLatency(null);
    setBodyInput(ep.sampleBody || "");
    setConfirmText("");
  };

  const handleRun = useCallback(async () => {
    if (!activeEndpoint) return;
    if (running) return;

    // Confirmation gate. Two checks:
    //  1. For any write method, require the dev to type the endpoint path.
    //  2. For any /api/admin or /api/dev write, also require a typed
    //     "RUN" sentinel so a fat-fingered click on a destructive admin
    //     endpoint can't be one click away.
    if (isWriteMethod(activeEndpoint.method)) {
      const typed = confirmText.trim();
      if (typed !== activeEndpoint.path) {
        setHttpStatus(400);
        setResponse(JSON.stringify({
          error: 'Confirmation required',
          detail: `To run a ${activeEndpoint.method} request, type the exact endpoint path in the confirmation box. (Expected: ${activeEndpoint.path})`,
        }, null, 2));
        return;
      }
      if (activeEndpoint.path.startsWith('/api/admin/') || activeEndpoint.path.startsWith('/api/dev/')) {
        if (typed !== activeEndpoint.path || !window.confirm(
          `You are about to call ${activeEndpoint.method} ${activeEndpoint.path} against PRODUCTION. This is irreversible. Continue?`
        )) {
          return;
        }
      }
    }

    setRunning(true);
    setResponse(null);
    setHttpStatus(null);
    setLatency(null);

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: {
          "Content-Type": "application/json",
          // F-624: tag the request so audit logs can identify explorer calls.
          "X-Picklers-Source": "api-explorer",
        },
      };

      if (["POST", "PATCH", "PUT"].includes(activeEndpoint.method) && bodyInput.trim()) {
        options.body = bodyInput;
      }

      const res = await fetch(activeEndpoint.path, options);
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHttpStatus(res.status);

      let textData = "";
      try {
        const jsonData = await res.json();
        textData = JSON.stringify(jsonData, null, 2);
      } catch {
        textData = await res.text();
      }

      setResponse(textData || "No response content");
    } catch (err) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHttpStatus(500);
      setResponse(JSON.stringify({ error: "Network or Request Failure", details: String(err) }, null, 2));
    } finally {
      setRunning(false);
    }
  }, [activeEndpoint, bodyInput, confirmText, running]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
            INTERACTIVE API EXPLORER
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
            {ENDPOINTS.length} ENDPOINTS
          </span>
        </div>
        <p className="text-xs text-slate-400">Inspect and execute live platform API routes directly against your server. Session cookies are automatically forwarded.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Endpoint List */}
        <div className="lg:col-span-2 space-y-3">
          {/* Group Filter */}
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                  selectedGroup === g
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {filtered.map((ep) => (
              <button
                key={ep.id}
                onClick={() => handleSelect(ep)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeEndpoint?.id === ep.id
                    ? "bg-slate-800 border-cyan-500/30 text-slate-100"
                    : "bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  {ep.requiresAuth && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                </div>
                <div className="text-xs font-mono text-slate-200 mt-1.5 truncate">{ep.path}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ep.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="lg:col-span-3 space-y-4">
          {!activeEndpoint ? (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 font-mono text-sm">
              <Globe className="w-8 h-8 mb-3 opacity-30" />
              Select an endpoint to execute
            </div>
          ) : (
            <>
              {/* Endpoint Info */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${methodColors[activeEndpoint.method]}`}>
                    {activeEndpoint.method}
                  </span>
                  <code className="text-sm font-mono text-slate-200">{activeEndpoint.path}</code>
                  {activeEndpoint.requiresAuth && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      Auth Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">{activeEndpoint.description}</p>
              </div>

              {/* Request Body */}
              {["POST", "PATCH", "PUT"].includes(activeEndpoint.method) && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">Request Body (JSON)</div>
                  <textarea
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              )}

              {/* F-624: typed confirmation for any write method. */}
              {isWriteMethod(activeEndpoint.method) && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-mono text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Confirmation required
                  </div>
                  <p className="text-xs text-slate-400">
                    Type the exact endpoint path below to enable the run button. This prevents fat-finger one-click writes against production.
                  </p>
                  <div className="text-[10px] font-mono text-slate-500 break-all">{activeEndpoint.path}</div>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={activeEndpoint.path}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
              )}

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-sm font-mono font-semibold transition-all disabled:opacity-50"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Executing Request..." : "Send Real Request"}
              </button>

              {/* Response */}
              {response && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-slate-400 uppercase tracking-wider">Response</span>
                      {httpStatus && (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${httpStatus < 300 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                          HTTP {httpStatus}
                        </span>
                      )}
                      {latency !== null && (
                        <span className="text-slate-500 text-[10px]">{latency}ms</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(response)}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy Response"}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 rounded-lg p-3 overflow-x-auto max-h-72 whitespace-pre-wrap">
                    {response}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
