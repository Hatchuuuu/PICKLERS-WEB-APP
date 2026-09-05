"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Terminal } from "lucide-react";
import { DEV_NAV_SECTIONS } from "./DevSidebar";

const ALL_DEV_ITEMS = DEV_NAV_SECTIONS.flatMap((s) => s.items);

export function DevBreadcrumb() {
  const pathname = usePathname();
  const rawSegments = pathname.replace(/^\/app\/dev/, "").split("/").filter(Boolean);

  let accumulatedPath = "/app/dev";
  const breadcrumbItems = rawSegments.map((segment) => {
    accumulatedPath += `/${segment}`;
    const matchedItem = ALL_DEV_ITEMS.find((item) => item.href === accumulatedPath);
    const label =
      matchedItem?.label.toLowerCase().replace(/\s+/g, "-") ||
      segment.toLowerCase().replace(/_/g, "-");

    return {
      href: accumulatedPath,
      label,
    };
  });

  return (
    <nav
      aria-label="Developer Breadcrumb"
      className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-4 overflow-x-auto scrollbar-none whitespace-nowrap"
    >
      <Link
        href="/app/dev"
        className="flex items-center gap-1 hover:text-slate-200 transition-colors"
      >
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span>dev</span>
      </Link>

      {breadcrumbItems.map((item, idx) => {
        const isLast = idx === breadcrumbItems.length - 1;
        return (
          <span key={item.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-200">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-slate-200 transition-colors text-slate-400"
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
