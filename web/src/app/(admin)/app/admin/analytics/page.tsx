"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Users,
  Building2,
  Calendar,
  Trophy,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { StatCard } from "@/components/admin/StatCard";
import { SkeletonStatCard, SkeletonTableRows } from "@/components/admin/AdminSkeleton";

interface TimeSeriesPoint {
  date: string;
  gmv: number;
  bookings: number;
  users: number;
}

interface AdminAnalyticsStats {
  total_users: number;
  total_owners: number;
  active_facilities: number;
  pending_applications: number;
  total_revenue: number;
  bookings_today: number;
  bookings_this_month: number;
  active_promos: number;
  time_series?: TimeSeriesPoint[];
}

interface FacilityLeaderboardItem {
  rank: number;
  id: string;
  name: string;
  owner: string;
  bookings: number;
  gmv: string;
  rating: number;
}

function CustomChartTooltip({
  active,
  payload,
  label,
  isCurrency,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface-base/95 backdrop-blur-xl p-3 shadow-2xl text-xs space-y-1 font-sans">
      <div className="font-bold text-foreground">{label}</div>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground font-medium">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || "#10b981" }} />
          <span>{item.name || "Value"}:</span>
          <span className="font-bold text-foreground">
            {isCurrency ? `₱${Number(item.value).toLocaleString()}` : `${item.value} bookings`}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsBIPage() {
  const [stats, setStats] = useState<AdminAnalyticsStats | null>(null);
  const [topFacilities, setTopFacilities] = useState<FacilityLeaderboardItem[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("from", startDate);
      if (endDate) params.set("to", endDate);

      const [statsRes, facilitiesRes] = await Promise.all([
        fetch(`/api/admin/analytics?${params.toString()}`),
        fetch("/api/admin/analytics/top-facilities"),
      ]);

      if (!statsRes.ok) {
        const json = await statsRes.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load analytics statistics");
      }

      if (!facilitiesRes.ok) {
        const json = await facilitiesRes.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load top facilities ranking");
      }

      const jsonStats = await statsRes.json();
      setStats(jsonStats.data);

      const jsonFacilities = await facilitiesRes.json();
      setTopFacilities(jsonFacilities.data || []);
    } catch (e: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load analytics data:", e);
      }
      setError(e instanceof Error ? e.message : "Failed to load analytics telemetry");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const timeSeries = stats?.time_series || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Executive BI Analytics
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Platform GMV, court utilization cohorts, and partner leaderboards
          </p>
        </div>

        {/* Date Filter Bar (P2-06) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-base text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={startDate}
              aria-label="Start date filter"
              onChange={(e) => {
                const val = e.target.value;
                if (endDate && val > endDate) {
                  setEndDate("");
                }
                setStartDate(val);
              }}
              className="bg-transparent text-foreground focus:outline-none"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              aria-label="End date filter"
              min={startDate || undefined}
              onChange={(e) => {
                const val = e.target.value;
                if (startDate && val < startDate) {
                  return;
                }
                setEndDate(val);
              }}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              aria-label="Clear date range filter"
              className="px-3 py-2 rounded-xl border border-border bg-surface-base hover:bg-surface-interactive text-foreground text-xs font-semibold transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            aria-label="Refresh analytics data"
            className="p-2.5 rounded-xl border border-border bg-surface-raised hover:bg-surface-interactive text-foreground transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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
            onClick={loadData}
            aria-label="Retry loading analytics data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

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

      {/* Analytics Charts Grid (Phase 4 / P1-01) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GMV Revenue Over Time Chart */}
        <div className="p-6 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">GMV Revenue Trajectory</h3>
                <p className="text-[11px] text-muted-foreground">Daily platform gross transaction volume (₱)</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <defs>
                    <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.2)" />
                  <XAxis dataKey="date" stroke="rgba(140, 140, 140, 0.6)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(140, 140, 140, 0.6)" fontSize={11} tickLine={false} tickFormatter={(v) => `₱${v}`} />
                  <Tooltip content={<CustomChartTooltip isCurrency />} />
                  <Area type="monotone" dataKey="gmv" name="GMV Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gmvGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Booking Volume Bar Chart */}
        <div className="p-6 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Court Booking Volume</h3>
                <p className="text-[11px] text-muted-foreground">Daily reservation velocity</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(140, 140, 140, 0.2)" />
                  <XAxis dataKey="date" stroke="rgba(140, 140, 140, 0.6)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(140, 140, 140, 0.6)" fontSize={11} tickLine={false} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="bookings" name="Bookings" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
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
