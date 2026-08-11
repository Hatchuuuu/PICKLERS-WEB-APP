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
import type { AdminStats } from "@/types/admin";

export default function AnalyticsBIPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const topFacilities = [
    { rank: 1, name: "BGC Pickleball Hub", owner: "BGC Sports Inc.", bookings: 342, gmv: "₱171,000", rating: 4.9 },
    { rank: 2, name: "Makati Smash Courts", owner: "Metro Pickleball Ltd", bookings: 289, gmv: "₱144,500", rating: 4.8 },
    { rank: 3, name: "Ortigas Indoor Arena", owner: "East Coast Recreation", bookings: 215, gmv: "₱107,500", rating: 4.7 },
    { rank: 4, name: "Alabang Country Club", owner: "South Sports Corp", bookings: 180, gmv: "₱90,000", rating: 4.9 },
    { rank: 5, name: "Quezon City Pickle Park", owner: "QC Parks Dept", bookings: 140, gmv: "₱70,000", rating: 4.6 },
  ];

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
        <StatCard
          title="Total GMV Volume"
          value={isLoading ? "..." : `₱${(stats?.total_revenue ?? 128500).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          trend="18.4% vs last month"
          trendUp={true}
        />
        <StatCard
          title="Total Registered Users"
          value={isLoading ? "..." : stats?.total_users ?? 0}
          icon={Users}
          color="blue"
          trend="124 new this week"
          trendUp={true}
        />
        <StatCard
          title="Bookings This Month"
          value={isLoading ? "..." : stats?.bookings_this_month ?? 850}
          icon={Calendar}
          color="violet"
          trend="8.2% conversion"
          trendUp={true}
        />
        <StatCard
          title="Active Facilities"
          value={isLoading ? "..." : stats?.active_facilities ?? 0}
          icon={Building2}
          color="amber"
          description="Verified partner courts"
        />
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
            Top 5 Partner Leaderboard
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
              {topFacilities.map((f) => (
                <tr key={f.rank} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3 font-bold text-emerald-400">#{f.rank}</td>
                  <td className="p-3 font-bold text-foreground">{f.name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{f.owner}</td>
                  <td className="p-3 font-semibold">{f.bookings} bookings</td>
                  <td className="p-3 font-bold text-emerald-400">{f.gmv}</td>
                  <td className="p-3 text-right font-bold text-amber-400">★ {f.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
