"use client";

import { DollarSign, TrendingUp, Users, Clock, BarChart3 } from "lucide-react";

export function OwnerAnalytics() {
  const peakHours = [
    { hour: "6:00 AM - 9:00 AM", utilization: 85, level: "High" },
    { hour: "9:00 AM - 4:00 PM", utilization: 45, level: "Moderate" },
    { hour: "4:00 PM - 8:00 PM", utilization: 98, level: "Peak" },
    { hour: "8:00 PM - 11:00 PM", utilization: 75, level: "High" }
  ];

  return (
    <div className="p-6 rounded-2xl bg-surface-base border border-border space-y-6 text-foreground">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" /> Facility Analytics & Intelligence
          </h3>
          <p className="text-xs text-muted-foreground">Real-time revenue, court utilization, and player demographics</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Updated 5m ago
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-interactive border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Revenue (30D)
          </div>
          <div className="text-2xl font-extrabold text-foreground">₱142,500</div>
          <div className="text-[11px] font-bold text-emerald-500 mt-1">↑ +18% vs last month</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-interactive border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Peak Occupancy
          </div>
          <div className="text-2xl font-extrabold text-foreground">94.2%</div>
          <div className="text-[11px] font-bold text-amber-500 mt-1">Fri - Sun Evenings</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-interactive border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase mb-1">
            <Users className="w-4 h-4 text-blue-500" /> Repeat Players
          </div>
          <div className="text-2xl font-extrabold text-foreground">68%</div>
          <div className="text-[11px] font-bold text-blue-500 mt-1">High Loyalty</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-interactive border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase mb-1">
            <Clock className="w-4 h-4 text-purple-500" /> Avg Session
          </div>
          <div className="text-2xl font-extrabold text-foreground">1.8 hrs</div>
          <div className="text-[11px] font-bold text-purple-500 mt-1">Doubles Open Play</div>
        </div>
      </div>

      {/* Hourly Utilization Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Daily Court Utilization Heatmap</h4>
        <div className="space-y-3">
          {peakHours.map((p) => (
            <div key={p.hour} className="p-3 rounded-xl bg-surface-interactive border border-border flex items-center justify-between gap-4">
              <div className="min-w-[140px] text-xs font-bold">{p.hour}</div>
              <div className="flex-1 h-2.5 bg-surface-base rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    p.utilization >= 90
                      ? "bg-amber-500"
                      : p.utilization >= 70
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${p.utilization}%` }}
                />
              </div>
              <div className="text-xs font-extrabold w-12 text-right">{p.utilization}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
