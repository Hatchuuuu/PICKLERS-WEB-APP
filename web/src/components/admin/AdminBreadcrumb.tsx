"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  applications: "Partner Applications",
  facilities: "Facilities & Courts",
  bookings: "Bookings & Matches",
  users: "User Directory & Roles",
  moderation: "Content Moderation",
  finance: "Financial Ledger",
  promotions: "Promo Codes",
  analytics: "Analytics BI",
  "audit-log": "Business Audit Trail",
  settings: "Platform Settings",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const rawSegments = pathname.replace(/^\/app\/admin/, "").split("/").filter(Boolean);

  let accumulatedPath = "/app/admin";
  const breadcrumbItems = rawSegments.map((segment) => {
    accumulatedPath += `/${segment}`;
    const label =
      ROUTE_LABELS[segment] ||
      ADMIN_NAV_ITEMS.find((item) => item.href === accumulatedPath)?.label ||
      segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      href: accumulatedPath,
      label,
    };
  });

  return (
    <nav
      aria-label="Admin Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 overflow-x-auto scrollbar-none whitespace-nowrap"
    >
      <Link
        href="/app/admin"
        className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 text-emerald-400" />
        <span>Admin</span>
      </Link>

      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors font-medium text-muted-foreground"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
