"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  Command,
  ShieldCheck,
  Cpu,
  Activity,
  Terminal,
  AlertTriangle,
  Bell,
  Menu,
  X,
  Layers,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { DevGate } from "@/components/shared/DevGate";
import { DevSidebar, DEV_NAV_SECTIONS } from "@/components/dev/DevSidebar";
import { DevCommandPalette } from "@/components/dev/DevCommandPalette";
import { DevBreadcrumb } from "@/components/dev/DevBreadcrumb";
import { ConsoleSwitcher } from "@/components/shared/ConsoleSwitcher";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

const ALL_DEV_ITEMS = DEV_NAV_SECTIONS.flatMap((s) => s.items);

const QUICK_MOBILE_ITEMS = [
  { id: "dashboard", label: "Control", href: "/app/dev", icon: Cpu },
  { id: "health", label: "Health", href: "/app/dev/health", icon: Activity },
  { id: "logs", label: "Logs", href: "/app/dev/logs", icon: Terminal },
  { id: "errors", label: "Errors", href: "/app/dev/errors", icon: AlertTriangle },
];

export default function DeveloperLayout({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const envName = (process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "production").toUpperCase();
  const regionName = process.env.NEXT_PUBLIC_APP_REGION || "ap-southeast-1";

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (showMobileDrawer) setShowMobileDrawer(false);
        if (showNotifs) setShowNotifs(false);
        if (isCommandOpen) setIsCommandOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutConfirm, showMobileDrawer, showNotifs, isCommandOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-notif-toggle]")) return;

      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs]);

  useEffect(() => {
    if (showMobileDrawer) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileDrawer]);

  useEffect(() => {
    const item = ALL_DEV_ITEMS.find((n) => n.href === "/app/dev" ? pathname === "/app/dev" : pathname.startsWith(n.href));
    const title = item ? item.label : "Control Center";
    document.title = `${title} | Developer Console`;
  }, [pathname]);

  return (
    <ProtectedRoute>
      <DevGate>
        <div className="dark min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Skip link for accessibility */}
          <a
            href="#dev-main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:font-mono focus:rounded-lg"
          >
            Skip to main developer content
          </a>

          {/* Environment Banner */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="font-bold text-cyan-400">ENVIRONMENT :: {envName}</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">Region: {regionName}</span>
            </div>
            <div className="flex items-center gap-3">
              <ConsoleSwitcher />
            </div>
          </div>

          {/* Main Shell */}
          <div className="flex-1 flex pb-16 lg:pb-0">
            {/* Sidebar */}
            <aside aria-label="Developer Navigation" className="hidden lg:flex flex-col w-64 shrink-0">
              <DevSidebar />
            </aside>

            {/* Right Main Body */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Toolbar */}
              <header className="h-14 border-b border-slate-800 bg-slate-900/40 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsCommandOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all hover:bg-slate-800"
                    aria-label="Open command palette"
                  >
                    <Command className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Search commands...</span>
                    <kbd className="ml-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400">
                      ⌘K
                    </kbd>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Notifications Toggle */}
                  <div className="relative" ref={notifRef}>
                    <button
                      data-notif-toggle
                      onClick={() => setShowNotifs((prev) => !prev)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors relative"
                      aria-label="Toggle notifications"
                      aria-expanded={showNotifs}
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-950 animate-pulse" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifs && (
                        <NotificationDropdown
                          onClose={() => setShowNotifs(false)}
                          className="right-0 top-full mt-2"
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Developer User Pill */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left leading-none">
                      <div className="text-xs font-bold text-slate-200">
                        {user?.name || user?.email || "Developer"}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        {user?.dev_role || (user?.role === "dev" ? "Lead Developer" : "Developer")}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Log Out of Developer Console"
                    aria-label="Log out"
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </header>

              {/* Content Area */}
              <main id="dev-main-content" className="flex-1 p-6 overflow-y-auto">
                <DevBreadcrumb />
                {children}
              </main>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl z-40 flex items-center justify-around h-14">
            {QUICK_MOBILE_ITEMS.map((item) => {
              const active = item.href === "/app/dev" ? pathname === "/app/dev" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 font-mono transition-colors ${
                    active ? "text-cyan-400 font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setShowMobileDrawer(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 font-mono text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Open all developer tools menu"
            >
              <Menu className="w-4 h-4" />
              <span className="text-[10px]">All Tools</span>
            </button>
          </nav>

          {/* Mobile All-Tools Slide-Up Sheet */}
          <AnimatePresence>
            {showMobileDrawer && (
              <div className="fixed inset-0 z-[600] lg:hidden flex flex-col justify-end overflow-hidden">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileDrawer(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                />

                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                  className="relative bg-surface-overlay dark:bg-[#13223F] border-t border-border dark:border-white/12 rounded-t-[32px] max-h-[85dvh] max-h-[85svh] flex flex-col z-[610] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  {/* Fixed Header & Grab Handle */}
                  <div className="pt-3 px-5 sm:px-6 pb-3.5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-3 shrink-0" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-mono font-bold text-slate-100 text-sm tracking-wider truncate">ALL DEVELOPER TOOLS</h2>
                          <p className="text-[11px] font-mono text-slate-400 truncate">Quick console module switcher</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMobileDrawer(false)}
                        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
                        aria-label="Close all tools menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Navigation Body */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 pb-[max(env(safe-area-inset-bottom,24px),2rem)] space-y-5 scrollbar-thin font-mono text-xs">
                    {DEV_NAV_SECTIONS.map((section) => (
                      <div key={section.title} className="space-y-2">
                        <div className="text-[10.5px] text-slate-500 font-bold tracking-wider uppercase px-1">
                          {section.title}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = item.href === "/app/dev" ? pathname === "/app/dev" : pathname.startsWith(item.href);
                            return (
                              <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setShowMobileDrawer(false)}
                                className={`p-3 px-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] min-h-[48px] ${
                                  active
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-bold shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                    : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1.5 rounded-xl shrink-0 ${active ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400"}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[13px] font-semibold text-slate-200 truncate">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {active && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                                  <ChevronRight className="w-4 h-4 text-slate-500 opacity-60" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Developer Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-title"
                className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-sm bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] font-mono z-[610]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 id="logout-title" className="text-base font-bold text-foreground mb-1">
                    Terminate Developer Session?
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6 font-sans">
                    You will be signed out of the Developer Control Center. Re-authentication will be required.
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 rounded-xl text-xs font-semibold bg-surface-interactive hover:bg-surface-interactive/80 text-foreground transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        router.push("/auth");
                      }}
                      className="flex-1 py-3 rounded-xl text-xs font-bold bg-red-500 text-white hover:bg-red-600 shadow-md transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Global Command Palette */}
          <DevCommandPalette
            isOpen={isCommandOpen}
            onClose={() => setIsCommandOpen(false)}
          />
        </div>
      </DevGate>
    </ProtectedRoute>
  );
}
