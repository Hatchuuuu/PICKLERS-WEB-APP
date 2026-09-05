"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Square,
} from "lucide-react";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { ApplicationDetailDrawer } from "@/components/admin/ApplicationDetailDrawer";
import { SkeletonCard } from "@/components/admin/AdminSkeleton";
import type { OwnerApplication } from "@/types/admin";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

type FilterStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "more_info_requested"
  | "all";

const TABS: { id: FilterStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "in_review", label: "In Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "more_info_requested", label: "Needs Info" },
  { id: "all", label: "All" },
];

export default function OwnerApplicationsPage() {
  const { showToast } = useToast();
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState<Partial<Record<FilterStatus, number>>>({});

  const [confirmBulkAction, setConfirmBulkAction] = useState<"approve" | "reject" | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSelectedIds([]);
    setConfirmBulkAction(null);
    try {
      const url =
        filter === "all"
          ? "/api/admin/applications"
          : `/api/admin/applications?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to fetch applications list");
      }
      const json = await res.json();
      setApplications(json.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error loading applications";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications/counts");
      if (res.ok) {
        const json = await res.json();
        setTabCounts(json.counts || {});
      }
    } catch {
      // Non-blocking count fallback
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const filtered = search.trim()
    ? applications.filter(
        (a) =>
          a.facility_name.toLowerCase().includes(search.toLowerCase()) ||
          a.business_name.toLowerCase().includes(search.toLowerCase())
      )
    : applications;

  const handleRefresh = () => {
    fetchApplications();
    fetchCounts();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
    setConfirmBulkAction(null);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((a) => a.id));
    }
    setConfirmBulkAction(null);
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedIds.length === 0) return;
    setIsBulkSubmitting(true);
    try {
      const res = await fetch("/api/admin/applications/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          application_ids: selectedIds,
          reason: `Bulk ${action} via Admin Console`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        showToast(
          `Successfully ${action}d ${json.processed_count || selectedIds.length} application(s).`,
          "success"
        );
        setSelectedIds([]);
        setConfirmBulkAction(null);
        handleRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || `Failed to bulk ${action} applications`, "error");
      }
    } catch {
      showToast("Bulk operation failed to process", "error");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Owner Applications
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Review, verify, and approve partner facility applications
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {filtered.length > 0 && (
            <button
              onClick={handleSelectAll}
              aria-label={selectedIds.length === filtered.length ? "Deselect all applications" : "Select all applications"}
              className="px-3 py-2 rounded-xl border border-border bg-surface-base hover:bg-surface-interactive text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              {selectedIds.length === filtered.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground" />
              )}
              <span>
                {selectedIds.length === filtered.length ? "Deselect All" : "Select All"}
              </span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh applications list"
            className="p-2.5 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 backdrop-blur-2xl shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            aria-label="Retry loading applications"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications by facility or business name"
          placeholder="Search by facility or business name…"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface-base text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search input"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-border">
        {TABS.map((t) => {
          const active = filter === t.id;
          const count = tabCounts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap relative flex items-center gap-1.5",
                active
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    active
                      ? "bg-emerald-500 text-white"
                      : t.id === "pending"
                      ? "bg-amber-500 text-white"
                      : "bg-surface-raised text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
              {active && (
                <motion.div
                  layoutId="app-tab-indicator"
                  className="absolute bottom-[-9px] inset-x-2 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="text-xs text-muted-foreground font-medium -mt-2">
          {search
            ? `${filtered.length} of ${applications.length} application${applications.length !== 1 ? "s" : ""} match "${search}"`
            : `${applications.length} application${applications.length !== 1 ? "s" : ""} in this category`}
          {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 border border-dashed border-border rounded-2xl bg-surface-base/40">
          <div className="p-3 rounded-2xl bg-surface-raised text-muted-foreground">
            <FileText className="w-8 h-8" />
          </div>
          <div className="text-base font-bold text-foreground">
            {search ? "No results for your search" : "No applications in this category"}
          </div>
          <div className="text-xs text-muted-foreground max-w-sm">
            {search
              ? `Try a different facility or business name.`
              : filter === "pending"
              ? "All submitted facility applications have been reviewed."
              : "No records found for the selected filter."}
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              isSelected={selectedIds.includes(app.id)}
              onToggleSelect={(id) => handleToggleSelect(id)}
              onClick={() => setSelectedApp(app)}
            />
          ))}
        </div>
      )}

      {/* Floating Bulk Actions Bar with Confirmation Step */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,12px))] md:bottom-8 inset-x-0 mx-auto max-w-lg z-[300] px-4"
          >
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-surface-base/95 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-4">
              <div className="text-xs font-bold text-foreground">
                <span className="font-mono text-emerald-400">{selectedIds.length}</span> application{selectedIds.length !== 1 ? "s" : ""} selected
              </div>

              {confirmBulkAction ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Confirm {confirmBulkAction}?
                  </span>
                  <button
                    onClick={() => setConfirmBulkAction(null)}
                    disabled={isBulkSubmitting}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBulkAction(confirmBulkAction)}
                    disabled={isBulkSubmitting}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md",
                      confirmBulkAction === "approve"
                        ? "bg-emerald-500 text-white hover:bg-emerald-400"
                        : "bg-rose-500 text-white hover:bg-rose-600"
                    )}
                  >
                    {isBulkSubmitting ? "Processing..." : `Yes, ${confirmBulkAction === "approve" ? "Approve" : "Reject"}`}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmBulkAction("reject")}
                    disabled={isBulkSubmitting}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject All</span>
                  </button>

                  <button
                    onClick={() => setConfirmBulkAction("approve")}
                    disabled={isBulkSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Approve All</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspection Drawer */}
      <ApplicationDetailDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
