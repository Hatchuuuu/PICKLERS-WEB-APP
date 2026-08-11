"use client";

import { useEffect, useState } from "react";
import { ScrollText, Search, X, Calendar } from "lucide-react";
import type { AdminAuditLog } from "@/types/admin";
import { SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const url = actionFilter === "all" ? "/api/admin/audit-log" : `/api/admin/audit-log?action=${actionFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  // Client-side filtering for search and date range
  const filteredLogs = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const adminName = (log.admin?.name || "System Admin").toLowerCase();
      const action = log.action.toLowerCase();
      const targetType = log.target_type.toLowerCase();
      const targetId = (log.target_id || "").toLowerCase();
      const metaStr = JSON.stringify(log.metadata || {}).toLowerCase();

      const matches =
        adminName.includes(q) ||
        action.includes(q) ||
        targetType.includes(q) ||
        targetId.includes(q) ||
        metaStr.includes(q);

      if (!matches) return false;
    }

    if (startDate) {
      const logDate = new Date(log.created_at).getTime();
      const start = new Date(startDate).getTime();
      if (logDate < start) return false;
    }

    if (endDate) {
      const logDate = new Date(log.created_at).getTime();
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (logDate > end) return false;
    }

    return true;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE")) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (action.includes("REJECT") || action.includes("BAN") || action.includes("DELETE"))
      return "bg-rose-500/10 border-rose-500/30 text-rose-400";
    if (action.includes("PROMO")) return "bg-violet-500/10 border-violet-500/30 text-violet-400";
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
            Immutable Audit Trail
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Complete, unalterable ledger of all administrative system actions
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border bg-surface-base text-xs font-bold text-foreground focus:outline-none self-start sm:self-auto"
        >
          <option value="all">All Audit Actions</option>
          <option value="APPROVE_OWNER_APPLICATION">Approved Applications</option>
          <option value="REJECT_OWNER_APPLICATION">Rejected Applications</option>
          <option value="BAN_USER">Banned Users</option>
          <option value="UNBAN_USER">Unbanned Users</option>
          <option value="CREATE_PROMO">Created Promos</option>
          <option value="DEACTIVATE_PROMO">Deactivated Promos</option>
          <option value="DELETE_PROMO">Deleted Promos</option>
        </select>
      </div>

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
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
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
          Showing {filteredLogs.length} of {logs.length} audit entry log(s)
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
        ) : filteredLogs.length === 0 ? (
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
                {filteredLogs.map((log) => (
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

                    <td className="p-4 font-mono text-muted-foreground truncate max-w-[120px]" title={log.target_id}>
                      {log.target_id ? `${log.target_id.slice(0, 8)}…` : "—"}
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
    </div>
  );
}
