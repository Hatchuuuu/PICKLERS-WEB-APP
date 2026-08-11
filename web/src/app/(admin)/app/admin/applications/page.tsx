"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileText, RefreshCw, Search, X } from "lucide-react";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { ApplicationDetailDrawer } from "@/components/admin/ApplicationDetailDrawer";
import { SkeletonCard } from "@/components/admin/AdminSkeleton";
import type { OwnerApplication } from "@/types/admin";
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
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Tab counts — fetched once (pending + in_review most important)
  const [tabCounts, setTabCounts] = useState<Partial<Record<FilterStatus, number>>>({});

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const url =
        filter === "all"
          ? "/api/admin/applications"
          : `/api/admin/applications?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Fetch counts for each status tab
  const fetchCounts = useCallback(async () => {
    const statusesToCount: FilterStatus[] = ["pending", "in_review", "more_info_requested"];
    const results = await Promise.allSettled(
      statusesToCount.map((s) =>
        fetch(`/api/admin/applications?status=${s}`).then((r) =>
          r.ok ? r.json().then((j) => ({ status: s, count: (j.data || []).length })) : null
        )
      )
    );
    const counts: Partial<Record<FilterStatus, number>> = {};
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        counts[r.value.status] = r.value.count;
      }
    });
    setTabCounts(counts);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Client-side search filter (searches facility name and business name)
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

  return (
    <div className="flex flex-col gap-6">
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
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors self-start sm:self-auto flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by facility or business name…"
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
                      ? "bg-amber-500 text-black"
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
              onClick={() => setSelectedApp(app)}
            />
          ))}
        </div>
      )}

      {/* Inspection Drawer */}
      <ApplicationDetailDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
