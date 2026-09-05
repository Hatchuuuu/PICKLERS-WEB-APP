"use client";

import { useEffect, useState, useCallback } from "react";
import { ScrollText, Search, X, Calendar, AlertTriangle, RotateCcw, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import type { AdminAuditLog } from "@/types/admin";
import { SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const LIMIT = 25;
  const totalPages = Math.max(1, Math.ceil(totalLogs / LIMIT));

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      params.set("page", String(page));

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load audit logs from server");
      }
      const json = await res.json();
      setLogs(json.data || []);
      setTotalLogs(json.total || 0);
    } catch (e: unknown) {
      console.error("Failed to load audit logs:", e);
      setError(e instanceof Error ? e.message : "Failed to load audit trail");
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, search, startDate, endDate, page]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const today = new Date().toISOString().split("T")[0];

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE")) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (action.includes("REJECT") || action.includes("BAN") || action.includes("DELETE"))
      return "bg-rose-500/10 border-rose-500/30 text-rose-400";
    if (action.includes("PROMO")) return "bg-violet-500/10 border-violet-500/30 text-violet-400";
    if (action.includes("SETTINGS")) return "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
    return "bg-amber-500/10 border-amber-500/30 text-amber-400";
  };

  const formatMetadata = (metadata: Record<string, unknown> | null | undefined) => {
    if (!metadata || Object.keys(metadata).length === 0) return "—";
    const entries = Object.entries(metadata)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" • ");
    return entries;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Business Audit Trail
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Complete, unalterable ledger of all business administrative system actions
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          aria-label="Filter audit logs by administrative action"
          className="px-4 py-2.5 rounded-xl border border-border bg-surface-base text-xs font-bold text-foreground focus:outline-none self-start sm:self-auto"
        >
          <option value="all">All Audit Actions</option>
          <option value="APPROVE_OWNER_APPLICATION">Approved Applications</option>
          <option value="REJECT_OWNER_APPLICATION">Rejected Applications</option>
          <option value="REQUEST_REVISION">Requested Application Revisions</option>
          <option value="BAN_USER">Banned Users</option>
          <option value="UNBAN_USER">Unbanned Users</option>
          <option value="PROMOTE_ADMIN">Promoted Admins</option>
          <option value="DEMOTE_ADMIN">Demoted Admins</option>
          <option value="CREATE_PROMO">Created Promos</option>
          <option value="UPDATE_PROMO">Updated Promos</option>
          <option value="ACTIVATE_PROMO">Activated Promos</option>
          <option value="DEACTIVATE_PROMO">Deactivated Promos</option>
          <option value="DELETE_PROMO">Deleted Promos</option>
          <option value="UPDATE_PLATFORM_SETTINGS">Updated Platform Settings</option>
        </select>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Date Range */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin, action, target, or metadata…"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface-base text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-base text-xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={startDate}
              max={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              title="Clear date filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results counter */}
      {!isLoading && (
        <div className="text-xs text-muted-foreground font-medium -mt-2">
          Showing {logs.length} entry log(s) on page {page} ({totalLogs} total entries)
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <SkeletonTableRows rows={6} cols={6} />
              </tbody>
            </table>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <ScrollText className="w-8 h-8 opacity-40" />
            <div className="text-sm font-bold text-foreground">No audit logs match filters</div>
            <p className="text-xs text-muted-foreground">Try adjusting your search term or date range.</p>
            {(search || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-raised/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Target ID</th>
                  <th className="p-4">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-interactive/50 transition-colors text-xs">
                    <td className="p-4 font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="p-4 font-bold text-foreground">
                      {log.admin?.name || "System Admin"}
                    </td>

                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase whitespace-nowrap", getActionBadge(log.action))}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 uppercase font-bold text-muted-foreground">
                      {log.target_type}
                    </td>

                    <td className="p-4 font-mono text-muted-foreground">
                      {log.target_id ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(log.target_id);
                            setCopiedId(log.id);
                            showToast("Target ID copied to clipboard", "success");
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="flex items-center gap-1 hover:text-emerald-400 transition-colors group"
                          title={`Copy full Target ID: ${log.target_id}`}
                        >
                          <span>{log.target_id.slice(0, 8)}…</span>
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-muted-foreground max-w-sm truncate" title={JSON.stringify(log.metadata)}>
                      {formatMetadata(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 rounded-xl border border-border bg-surface-base text-xs font-bold text-foreground min-w-[60px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
