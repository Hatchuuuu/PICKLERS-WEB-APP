"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { DeveloperAuditLog } from "@/types/developer";

export default function TechnicalAuditPage() {
  const [logs, setLogs] = useState<DeveloperAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [actionSearch, setActionSearch] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });
      if (categoryFilter) params.append("category", categoryFilter);
      if (actionSearch) params.append("action", actionSearch);

      const res = await fetch(`/api/dev/audit?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load technical audit logs");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, actionSearch]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-mono text-slate-100 tracking-tight">
              TECHNICAL AUDIT LEDGER
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of sensitive engineering operations, production modifications, and developer actions.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Error Banner matching brand guidelines */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-2xl bg-red-500/10 border-red-500/20 text-red-400 text-xs font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchAuditLogs}
            className="ml-auto underline hover:text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={actionSearch}
            onChange={(e) => {
              setActionSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search audit action..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500/50 w-full sm:w-auto"
          >
            <option value="">All Categories</option>
            <option value="system">System</option>
            <option value="production_action">Production Action</option>
            <option value="feature_flag">Feature Flag</option>
            <option value="webhook">Webhook</option>
            <option value="database">Database</option>
            <option value="api_key">API Key</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Developer</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Environment</th>
                <th className="px-4 py-3">Target ID</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-28 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-16 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-36 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-24 bg-slate-800 rounded"></div></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 bg-slate-800 rounded"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No technical audit logs recorded matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">
                        {log.developer?.name || "System Developer"}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                        {log.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-cyan-300">
                      {log.action}
                    </td>

                    <td className="px-4 py-3 uppercase text-[10px] font-bold text-amber-400">
                      {log.environment}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {log.target_id ? (
                        <div className="flex items-center gap-1.5">
                          <span>{log.target_id.slice(0, 12)}...</span>
                          <button
                            onClick={() => handleCopy(log.target_id!)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
                            title="Copy Target ID"
                          >
                            {copiedId === log.target_id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {log.ip_address || "Internal"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between font-mono text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-bold">{logs.length}</span> of{" "}
            <span className="text-slate-200 font-bold">{totalCount}</span> log entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
