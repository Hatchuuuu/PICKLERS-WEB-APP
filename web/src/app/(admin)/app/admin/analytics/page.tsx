"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Users,
  Building2,
  Calendar,
  Trophy,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SkeletonStatCard, SkeletonTableRows } from "@/components/admin/AdminSkeleton";
import type { AdminStats } from "@/types/admin";

interface FacilityLeaderboardItem {
  rank: number;
  id: string;
  name: string;
  owner: string;
  bookings: number;
  gmv: string;
  rating: number;
}

export default function AnalyticsBIPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topFacilities, setTopFacilities] = useState<FacilityLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, facilitiesRes] = await Promise.all([
          fetch("/api/admin/analytics"),
          fetch("/api/admin/analytics/top-facilities"),
        ]);

        if (statsRes.ok) {
          const json = await statsRes.json();
          setStats(json.data);
        }

        if (facilitiesRes.ok) {
          const json = await facilitiesRes.json();
          setTopFacilities(json.data || []);
        }
      } catch (e) {
        console.error("Failed to load analytics data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Executive BI Analytics
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Platform GMV, court utilization cohorts, and partner leaderboards
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Total GMV Volume"
              value={`₱${(stats?.total_revenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              description="Platform total earnings"
            />
            <StatCard
              title="Total Registered Users"
              value={stats?.total_users ?? 0}
              icon={Users}
              color="blue"
              description="Registered player profiles"
            />
            <StatCard
              title="Bookings Today"
              value={stats?.bookings_today ?? 0}
              icon={Calendar}
              color="violet"
              description="Active reservations"
            />
            <StatCard
              title="Active Facilities"
              value={stats?.active_facilities ?? 0}
              icon={Building2}
              color="amber"
              description="Verified partner courts"
            />
          </>
        )}
      </div>

      {/* Facility Owner Leaderboard Table */}
      <div className="p-6 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Top Performing Facility Partners
              </h3>
              <p className="text-xs text-muted-foreground">
                Ranked by court bookings and GMV revenue contribution
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Live Database Ranking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Facility Name</th>
                <th className="p-3">Owner Entity</th>
                <th className="p-3">Bookings</th>
                <th className="p-3">Est. GMV</th>
                <th className="p-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-medium">
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={6} />
              ) : topFacilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                    No active facilities available yet for ranking.
                  </td>
                </tr>
              ) : (
                topFacilities.map((f) => (
                  <tr key={f.id || f.rank} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="p-3 font-bold text-emerald-400">#{f.rank}</td>
                    <td className="p-3 font-bold text-foreground">{f.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{f.owner}</td>
                    <td className="p-3 font-semibold">{f.bookings} bookings</td>
                    <td className="p-3 font-bold text-emerald-400">{f.gmv}</td>
                    <td className="p-3 text-right font-bold text-amber-400">★ {f.rating}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
