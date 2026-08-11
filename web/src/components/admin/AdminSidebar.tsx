"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Tag,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "overview", label: "Overview", href: "/app/admin", icon: LayoutDashboard },
  { id: "applications", label: "Applications", href: "/app/admin/applications", icon: FileText },
  { id: "users", label: "Users", href: "/app/admin/users", icon: Users },
  { id: "analytics", label: "Analytics BI", href: "/app/admin/analytics", icon: BarChart3 },
  { id: "promotions", label: "Promotions", href: "/app/admin/promotions", icon: Tag },
  { id: "audit-log", label: "Audit Log", href: "/app/admin/audit-log", icon: ScrollText },
];

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const res = await fetch("/api/admin/applications?status=pending");
        if (res.ok) {
          const json = await res.json();
          setPendingCount((json.data || []).length);
        }
      } catch {
        // Silently fail — badge is non-critical
      }
    }
    fetchPendingCount();
  }, [pathname]); // Re-fetch when navigating between admin pages

  return (
    <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto relative">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active =
          item.href === "/app/admin"
            ? pathname === "/app/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const showBadge = item.id === "applications" && pendingCount > 0;

        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className={cn(
              "relative flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-left active:scale-[0.98] transition-colors group",
              active ? "font-bold text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId="admin-sidebar-active-pill"
                className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-500/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <Icon
              className={cn(
                "w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110",
                active ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span className="relative z-10 flex-1">{item.label}</span>

            {/* Pending count badge */}
            {showBadge && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative z-10 min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shadow-md shadow-amber-500/30"
              >
                {pendingCount > 99 ? "99+" : pendingCount}
              </motion.span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
