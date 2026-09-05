"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Terminal,
  AlertTriangle,
  Code2,
  Webhook,
  Flag,
  Globe,
  Database,
  Search,
  ShieldAlert,
  Users,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface DevNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export interface DevNavSection {
  title: string;
  items: DevNavItem[];
}

export const DEV_NAV_SECTIONS: DevNavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Control Center", href: "/app/dev", icon: Cpu },
    ],
  },
  {
    title: "OBSERVABILITY",
    items: [
      { id: "health", label: "System Health", href: "/app/dev/health", icon: Activity },
      { id: "logs", label: "Application Logs", href: "/app/dev/logs", icon: Terminal },
      { id: "errors", label: "Error Intelligence", href: "/app/dev/errors", icon: AlertTriangle },
    ],
  },
  {
    title: "APIS & INTEGRATIONS",
    items: [
      { id: "api-explorer", label: "API Explorer", href: "/app/dev/api-explorer", icon: Code2 },
      { id: "webhooks", label: "Webhook Logs", href: "/app/dev/webhooks", icon: Webhook },
    ],
  },
  {
    title: "RUNTIME & CONFIG",
    items: [
      { id: "flags", label: "Feature Flags", href: "/app/dev/flags", icon: Flag },
      { id: "environments", label: "Environments", href: "/app/dev/environments", icon: Globe },
    ],
  },
  {
    title: "DIAGNOSTICS",
    items: [
      { id: "entity-inspector", label: "Entity Inspector", href: "/app/dev/entity-inspector", icon: Database },
      { id: "user-diagnostics", label: "User Diagnostics", href: "/app/dev/user-diagnostics", icon: Search },
    ],
  },
  {
    title: "ACCESS CONTROL",
    items: [
      { id: "accounts", label: "Account Roles & Access", href: "/app/dev/accounts", icon: Users },
    ],
  },
  {
    title: "AUDIT & SECURITY",
    items: [
      { id: "threats", label: "Threat Radar & IDS", href: "/app/dev/threats", icon: ShieldAlert },
      { id: "audit", label: "Technical Audit", href: "/app/dev/audit", icon: Layers },
    ],
  },
];

export function DevSidebar() {
  const pathname = usePathname();
  const [errorCount, setErrorCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout | null = null;
    async function fetchErrors() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/dev/errors");
        if (res.status === 401 || res.status === 403) {
          if (interval) clearInterval(interval);
          return;
        }
        if (res.ok && isMounted) {
          const json = await res.json();
          const unresolved = (json.errors || []).filter((e: { status?: string }) => e.status !== "resolved").length;
          setErrorCount(unresolved);
        }
      } catch {
        // Silently handle offline/error
      }
    }
    fetchErrors();
    interval = setInterval(fetchErrors, 60000);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchErrors();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl shrink-0 h-screen sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-100 tracking-wide block">DEVELOPER CONSOLE</span>
            <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider">Engineering Operations</span>
          </div>
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {DEV_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-mono font-semibold text-slate-500 tracking-wider uppercase">
              {section.title}
            </h3>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/app/dev" && pathname.startsWith(item.href));

                const badgeContent = item.id === "errors" && errorCount !== null
                  ? String(errorCount)
                  : item.badge;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                      <span>{item.label}</span>
                    </div>
                    {badgeContent ? (
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                        item.id === "errors" && Number(badgeContent) > 0
                          ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}>
                        {badgeContent}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400/60" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30 text-slate-400 text-[11px] font-mono flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SYS_OK :: {process.env.NEXT_PUBLIC_APP_VERSION || "v2.4.0"}
        </span>
        <span className="text-slate-500">{(process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "PROD").toUpperCase()}</span>
      </div>
    </aside>
  );
}
