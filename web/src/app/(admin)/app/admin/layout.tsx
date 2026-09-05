"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  Bell,
  ShieldCheck,
  Command,
  Menu,
  X,
  Layers,
  LayoutDashboard,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AdminGate } from "@/components/shared/AdminGate";
import { AdminSidebar, ADMIN_NAV_SECTIONS, ADMIN_NAV_ITEMS } from "@/components/admin/AdminSidebar";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ConsoleSwitcher } from "@/components/shared/ConsoleSwitcher";

const QUICK_ADMIN_MOBILE_ITEMS = [
  { id: "overview", label: "Control", href: "/app/admin", icon: LayoutDashboard },
  { id: "applications", label: "Applications", href: "/app/admin/applications", icon: FileText },
  { id: "facilities", label: "Facilities", href: "/app/admin/facilities", icon: Building2 },
  { id: "bookings", label: "Bookings", href: "/app/admin/bookings", icon: Calendar },
];

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showNotifs, setShowNotifs] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

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
      // Return focus to the trigger button that opened the sheet (WCAG §2.4.3)
      mobileMenuTriggerRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileDrawer]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showLogoutConfirm) setShowLogoutConfirm(false);
        if (showMobileDrawer) setShowMobileDrawer(false);
        if (showNotifs) setShowNotifs(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutConfirm, showMobileDrawer, showNotifs]);

  useEffect(() => {
    const activeNav = ADMIN_NAV_ITEMS.find((item) =>
      item.href === "/app/admin" ? pathname === "/app/admin" : pathname.startsWith(item.href)
    );
    const pageTitle = activeNav ? activeNav.label : "Control Center";
    document.title = `${pageTitle} | Picklers Admin Console`;
  }, [pathname]);

  const getRoleLabel = () => {
    if (user?.admin_role) {
      return `● ${user.admin_role.replace("_", " ").toUpperCase()}`;
    }
    if (user?.role === "admin" || user?.isAdmin) return "● Super Admin";
    return "● Admin Account";
  };

  return (
    <ProtectedRoute>
      <AdminGate>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Skip link for accessibility */}
          <a
            href="#admin-main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:font-bold focus:rounded-lg"
          >
            Skip to main admin content
          </a>

          <AdminCommandPalette />

          {/* Desktop Sidebar */}
          <aside aria-label="Admin Navigation" className="hidden md:flex flex-col w-64 shrink-0 border-r border-solid relative z-20 bg-surface-base/75 backdrop-blur-2xl border-border">
            {/* Header branding */}
            <div
              className="px-6 py-5 border-b border-solid flex items-center justify-between relative"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <PicklersLogo size={32} />
                  <ShinyText
                    text="PICKLERS"
                    className="text-xl font-black"
                    style={{
                      fontFamily: "var(--font-montserrat), sans-serif",
                      letterSpacing: "-0.02em",
                      paddingRight: "0.1em",
                      marginLeft: "-8px",
                    }}
                    color="var(--ink-primary)"
                    shineColor="#10b981"
                    speed={3}
                    delay={0}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono">
                    ADMIN CONSOLE
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <AdminSidebar />

            {/* User card at bottom */}
            <div
              className="p-4 border-t border-solid bg-surface-base/50"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">
                      {user?.name || user?.email || "Admin"}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono font-medium truncate">
                      {getRoleLabel()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Sign Out of Admin Console"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main content body */}
          <main id="admin-main-content" className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Top Toolbar */}
            <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-surface-base/80 backdrop-blur-2xl shrink-0 z-10">
              <div className="flex items-center gap-4">
                {/* Mobile branding */}
                <div className="flex md:hidden items-center gap-2">
                  <PicklersLogo size={24} />
                  <span className="text-xs font-black tracking-tight text-foreground font-mono">
                    ADMIN
                  </span>
                </div>

                {/* Quick Search trigger */}
                <button
                  onClick={() => {
                    // A-015 FIX: Browsers set metaKey=false on synthetic events
                    // dispatched from scripts (untrusted events). The previous
                    // code dispatched a KeyboardEvent with metaKey:true which
                    // the palette's listener never saw. Now we use a named
                    // CustomEvent that the palette explicitly subscribes to.
                    window.dispatchEvent(new CustomEvent("open-admin-palette"));
                  }}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-surface-base hover:bg-surface-interactive text-xs text-muted-foreground transition-all cursor-pointer shadow-sm"
                  aria-label="Open search command palette"
                >
                  <Command className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Search admin hub…</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono">
                    ⌘K
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Console Switcher */}
                <ConsoleSwitcher />

                {/* Notifications toggle */}
                <div className="relative" ref={notifRef}>
                  <button
                    data-notif-toggle
                    onClick={() => setShowNotifs((prev) => !prev)}
                    className="p-2.5 rounded-xl border border-border bg-surface-base hover:bg-surface-interactive text-muted-foreground hover:text-foreground transition-colors relative"
                    aria-label="Toggle notifications"
                    aria-expanded={showNotifs}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
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
              </div>
            </header>

            {/* Body scroll area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
              <AdminBreadcrumb />
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ ease: "easeInOut", duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav aria-label="Mobile Bottom Navigation" className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border z-40 bg-background/95 backdrop-blur-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)] h-16">
            {QUICK_ADMIN_MOBILE_ITEMS.map((item) => {
              const active =
                item.href === "/app/admin"
                  ? pathname === "/app/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors relative"
                  style={{ color: active ? "#10b981" : "var(--ink-muted)" }}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-mobile-active-indicator"
                      className="absolute top-0 inset-x-0 h-[3px] mx-auto w-8 rounded-full bg-emerald-500"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            })}

            <button
              ref={mobileMenuTriggerRef}
              onClick={() => setShowMobileDrawer(true)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open all admin sections menu"
              aria-haspopup="dialog"
              aria-expanded={showMobileDrawer}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-semibold">More</span>
            </button>
          </nav>

          {/* Mobile All-Sections Slide-Up Sheet */}
          <AnimatePresence>
            {showMobileDrawer && (
              <div className="fixed inset-0 z-[600] md:hidden flex flex-col justify-end overflow-hidden">
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
                  <div className="pt-3 px-5 sm:px-6 pb-3.5 border-b border-border bg-surface-base/95 backdrop-blur-md shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider truncate">ALL ADMIN SECTIONS</h2>
                          <p className="text-[11px] text-muted-foreground font-medium truncate">Quick navigation across admin console</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMobileDrawer(false)}
                        className="p-2 rounded-xl bg-surface-raised border border-border text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                        aria-label="Close all sections menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Navigation Body */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 pb-[max(env(safe-area-inset-bottom,24px),2rem)] space-y-5 scrollbar-thin">
                    {ADMIN_NAV_SECTIONS.map((section) => (
                      <div key={section.title} className="space-y-2">
                        <div className="text-[10.5px] text-muted-foreground font-bold tracking-wider uppercase px-1">
                          {section.title}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = item.href === "/app/admin" ? pathname === "/app/admin" : pathname.startsWith(item.href);
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setShowMobileDrawer(false);
                                  router.push(item.href);
                                }}
                                className={`p-3 px-3.5 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer min-h-[48px] ${
                                  active
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                                    : "bg-surface-raised/60 border-border text-foreground hover:border-emerald-500/30"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`p-1.5 rounded-xl shrink-0 ${active ? "bg-emerald-500/20 text-emerald-400" : "bg-black/5 dark:bg-white/5 text-muted-foreground"}`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[13px] font-semibold tracking-tight text-foreground truncate">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {active && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60" />
                                </div>
                              </button>
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

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-logout-title"
                className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-sm bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[610]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 dark:text-red-400">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 id="admin-logout-title" className="text-lg font-bold text-foreground mb-1">
                    Log Out of Admin Console?
                  </h3>
                  <p className="text-xs text-muted-foreground mb-6">
                    You will need to sign in again to access administrative controls.
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
        </div>
      </AdminGate>
    </ProtectedRoute>
  );
}
