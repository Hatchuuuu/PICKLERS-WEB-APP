"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Calendar,
  Users,
  ShieldAlert,
  DollarSign,
  Tag,
  BarChart3,
  ScrollText,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badgeKey?: "pendingApps";
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "overview", label: "Control Center", href: "/app/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "applications", label: "Partner Applications", href: "/app/admin/applications", icon: FileText, badgeKey: "pendingApps" },
      { id: "facilities", label: "Facilities & Courts", href: "/app/admin/facilities", icon: Building2 },
      { id: "bookings", label: "Bookings & Matches", href: "/app/admin/bookings", icon: Calendar },
    ],
  },
  {
    title: "USER MANAGEMENT",
    items: [
      { id: "users", label: "User Directory & Roles", href: "/app/admin/users", icon: Users },
      { id: "moderation", label: "Content Moderation", href: "/app/admin/moderation", icon: ShieldAlert },
    ],
  },
  {
    title: "FINANCE & PROMOTIONS",
    items: [
      { id: "finance", label: "Financial Ledger", href: "/app/admin/finance", icon: DollarSign },
      { id: "promotions", label: "Promo Codes", href: "/app/admin/promotions", icon: Tag },
    ],
  },
  {
    title: "INSIGHTS & REPORTS",
    items: [
      { id: "analytics", label: "Analytics BI", href: "/app/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "SYSTEM & SECURITY",
    items: [
      { id: "audit-log", label: "Business Audit Trail", href: "/app/admin/audit-log", icon: ScrollText },
      { id: "settings", label: "Platform Settings", href: "/app/admin/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);

export function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchPendingCount() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/admin/applications?status=pending");
        if (res.ok && isMounted) {
          const json = await res.json();
          setPendingCount((json.data || []).length);
        }
      } catch {
        // Silently fail — badge is non-critical
      }
    }
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchPendingCount();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <nav className="flex-1 p-3 flex flex-col gap-5 overflow-y-auto relative custom-scrollbar">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1">
          <h3 className="px-3 text-[10px] font-mono font-bold text-muted-foreground/70 tracking-wider uppercase">
            {section.title}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/app/admin"
                  ? pathname === "/app/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const showBadge = item.badgeKey === "pendingApps" && pendingCount > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "relative flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-left transition-all group",
                    active
                      ? "font-bold text-white bg-emerald-500/10 border border-emerald-500/20 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-interactive border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform group-hover:scale-110",
                        active ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {showBadge ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="min-w-[18px] h-4.5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
                    >
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </motion.span>
                  ) : active ? (
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
