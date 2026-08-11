"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileText, RefreshCw } from "lucide-react";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { ApplicationDetailDrawer } from "@/components/admin/ApplicationDetailDrawer";
import type { OwnerApplication } from "@/types/admin";
import { cn } from "@/lib/utils";

type FilterStatus = "pending" | "in_review" | "approved" | "rejected" | "more_info_requested" | "all";

export default function OwnerApplicationsPage() {
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [selectedApp, setSelectedApp] = useState<OwnerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/applications" : `/api/admin/applications?status=${filter}`;
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
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const tabs: { id: FilterStatus; label: string }[] = [
    { id: "pending", label: "Pending Queue" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "more_info_requested", label: "Needs Info" },
    { id: "all", label: "All History" },
  ];

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
          onClick={fetchApplications}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors self-start sm:self-auto flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-border">
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap relative",
                active
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {active && (
                <motion.div
                  layoutId="app-tab-indicator"
                  className="absolute bottom-0 inset-x-2 h-0.5 bg-emerald-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-sm font-medium text-muted-foreground animate-pulse">
          Loading applications queue...
        </div>
      ) : applications.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 border border-dashed border-border rounded-2xl bg-surface-base/40">
          <div className="p-3 rounded-2xl bg-surface-raised text-muted-foreground">
            <FileText className="w-8 h-8" />
          </div>
          <div className="text-base font-bold text-foreground">
            No applications in this category
          </div>
          <div className="text-xs text-muted-foreground max-w-sm">
            {filter === "pending"
              ? "All submitted facility applications have been reviewed."
              : "No records found for the selected filter."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
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
        onRefresh={fetchApplications}
      />
    </div>
  );
}
