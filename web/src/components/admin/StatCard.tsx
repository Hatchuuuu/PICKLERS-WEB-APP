"use client";

import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  pulse?: boolean;
  color?: "emerald" | "amber" | "blue" | "violet" | "rose";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendUp = true,
  pulse = false,
  color = "emerald",
}: StatCardProps) {
  const colorStyles = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative p-5 rounded-2xl border border-border bg-surface-base/80 backdrop-blur-2xl shadow-lg flex flex-col justify-between overflow-hidden group"
    >
      {/* Background ambient glow */}
      <div
        className={cn(
          "absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40",
          color === "emerald" && "bg-emerald-500",
          color === "amber" && "bg-amber-500",
          color === "blue" && "bg-blue-500",
          color === "violet" && "bg-violet-500",
          color === "rose" && "bg-rose-500"
        )}
      />

      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="relative">
          <div className={cn("p-2.5 rounded-xl border", colorStyles[color])}>
            <Icon className="w-4 h-4 shrink-0" />
          </div>
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </div>
      </div>

      <div>
        <div className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
          {value}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium">
            {trend && (
              <span className={cn(trendUp ? "text-emerald-400" : "text-rose-400")}>
                {trendUp ? "↑" : "↓"} {trend}
              </span>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
