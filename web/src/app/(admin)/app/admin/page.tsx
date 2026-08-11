"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Users,
  Building2,
  FileText,
  TrendingUp,
  Tag,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import type { AdminStats, OwnerApplication } from "@/types/admin";

export default function AdminOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingApps, setPendingApps] = useState<OwnerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, appsRes] = await Promise.all([
          fetch("/api/admin/analytics"),
          fetch("/api/admin/applications?status=pending"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setPendingApps(appsData.data || []);
        }
      } catch (err) {
        console.error("Error loading admin overview:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Platform performance, application queue, and quick actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/app/admin/applications")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <span>Review Applications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Users"
          value={isLoading ? "..." : stats?.total_users ?? 0}
          icon={Users}
          color="emerald"
          description="Registered players"
        />
        <StatCard
          title="Pending Apps"
          value={isLoading ? "..." : stats?.pending_applications ?? 0}
          icon={FileText}
          color="amber"
          pulse={(stats?.pending_applications ?? 0) > 0}
          description="Needs review"
        />
        <StatCard
          title="Facility Owners"
          value={isLoading ? "..." : stats?.total_owners ?? 0}
          icon={Building2}
          color="blue"
          description="Verified partners"
        />
        <StatCard
          title="Active Promos"
          value={isLoading ? "..." : stats?.active_promos ?? 0}
          icon={Tag}
          color="violet"
          description="Running campaigns"
        />
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Applications Review Widget */}
        <div className="lg:col-span-2 flex flex-col gap-4 p-5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Pending Owner Applications
                </h3>
                <p className="text-xs text-muted-foreground">
                  {pendingApps.length} applications waiting for review
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/app/admin/applications")}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              View All Queue →
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
              Loading applications...
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-2 border border-dashed border-border rounded-xl">
              <div className="text-emerald-400 font-bold text-sm">
                Queue is clear! 🎉
              </div>
              <div className="text-xs text-muted-foreground">
                All submitted owner applications have been reviewed.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pendingApps.slice(0, 5).map((app) => (
                <motion.div
                  key={app.id}
                  onClick={() => router.push("/app/admin/applications")}
                  whileHover={{ scale: 1.01 }}
                  className="p-3.5 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-interactive cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {app.facility_name[0]?.toUpperCase() || "F"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {app.facility_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {app.business_name} • {app.court_count} court(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                      Pending
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Side Column */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-foreground">Quick Actions</h3>

            <button
              onClick={() => router.push("/app/admin/users")}
              className="w-full p-3.5 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-interactive flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    User Moderation
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Search and ban/unban users
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button
              onClick={() => router.push("/app/admin/promotions")}
              className="w-full p-3.5 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-interactive flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Create Promo Code
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Launch discount campaign
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button
              onClick={() => router.push("/app/admin/audit-log")}
              className="w-full p-3.5 rounded-xl border border-border bg-surface-raised/60 hover:bg-surface-interactive flex items-center justify-between text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Audit Log Trail
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Inspect admin system ledger
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
