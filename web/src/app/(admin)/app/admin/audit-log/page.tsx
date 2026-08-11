"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import type { AdminAuditLog } from "@/types/admin";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState("all");
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

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE")) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (action.includes("REJECT") || action.includes("BAN")) return "bg-rose-500/10 border-rose-500/30 text-rose-400";
    if (action.includes("PROMO")) return "bg-violet-500/10 border-violet-500/30 text-violet-400";
    return "bg-amber-500/10 border-amber-500/30 text-amber-400";
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
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-sm font-medium text-muted-foreground animate-pulse">
            Loading audit ledger...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <ScrollText className="w-8 h-8 opacity-40" />
            <div className="text-sm font-bold text-foreground">No audit logs recorded yet</div>
            <p className="text-xs text-muted-foreground">Admin write actions will be logged here automatically.</p>
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
                  <th className="p-4">Metadata</th>
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

                    <td className="p-4 font-mono text-muted-foreground truncate max-w-[120px]">
                      {log.target_id}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
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
