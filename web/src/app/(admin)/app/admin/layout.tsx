"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  User,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AdminGate } from "@/components/shared/AdminGate";
import { AdminSidebar, ADMIN_NAV_ITEMS } from "@/components/admin/AdminSidebar";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { useUserStore } from "@/store/useUserStore";

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const toggleAdminMode = useUserStore((state) => state.toggleAdminMode);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showNotifs, setShowNotifs] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  const handleSwitchToPlayer = () => {
    toggleAdminMode();
    router.push("/app");
  };

  return (
    <ProtectedRoute>
      <AdminGate>
        <div className="flex h-screen overflow-hidden bg-background">
          <AdminCommandPalette />

          {/* Desktop Sidebar */}
          <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-solid relative z-20 bg-surface-base/75 backdrop-blur-2xl border-border">
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
                <div className="text-[12px] font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Console
                </div>
              </div>

              <div className="relative">
                <button
                  data-notif-toggle
                  onClick={() => setShowNotifs(!showNotifs)}
                  aria-label="Notifications"
                  className="relative p-2 rounded-xl border border-border hover:bg-surface-interactive text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifs && (
                    <div ref={notifRef} className="absolute right-0 top-12 z-50">
                      <NotificationDropdown onClose={() => setShowNotifs(false)} />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar nav tabs */}
            <AdminSidebar />

            {/* Switch mode & logout buttons */}
            <div
              className="p-4 border-t border-solid flex flex-col gap-1"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={handleSwitchToPlayer}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Switch to Player View</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-surface-raised"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Admin Profile Footer */}
            <div
              className="p-5 border-t border-solid flex items-center gap-3"
              style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.15)" }}
            >
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-[2px] overflow-hidden">
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background:
                      "conic-gradient(from 180deg at 50% 50%, #10b981 0deg, #3B82F6 180deg, #10b981 360deg)",
                  }}
                />
                <div
                  className="relative z-10 w-full h-full rounded-full flex items-center justify-center text-sm font-bold uppercase overflow-hidden"
                  style={{ background: "var(--surface-base)", color: "#10b981" }}
                >
                  {user?.avatarUrl ? (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.[0] || "A"
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold truncate text-foreground">
                  {user?.name || "System Admin"}
                </div>
                <div className="text-[12px] font-medium text-emerald-400 truncate">
                  ● Admin Account
                </div>
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 overflow-y-auto pb-[120px] md:pb-0 relative bg-background flex flex-col">
            {/* Mobile Top Header */}
            <div className="md:hidden sticky top-0 z-[100] flex items-center justify-between px-[15px] py-[8px] border-b border-border bg-background/95 backdrop-blur-3xl saturate-200">
              <div className="flex items-center gap-1">
                <PicklersLogo size={32} />
                <div>
                  <ShinyText
                    text="PICKLERS"
                    className="text-[16px] font-black tracking-tight"
                    color="var(--ink-primary)"
                    shineColor="#10b981"
                    speed={3}
                    delay={0}
                  />
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                    Admin Console
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={handleSwitchToPlayer}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400"
                >
                  Player View
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-2 rounded-full hover:bg-surface-raised text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  className="flex-1"
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
          <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border z-40 bg-background/95 backdrop-blur-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active =
                item.href === "/app/admin"
                  ? pathname === "/app/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 transition-colors relative"
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
          </nav>

          {/* Logout Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                key="logout-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-3xl"
                onClick={() => setShowLogoutConfirm(false)}
              >
                <motion.div
                  key="logout-modal"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="relative w-full max-w-sm bg-surface-base border border-border rounded-3xl p-6 text-center shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4 text-red-500">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Log Out of Admin Console?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    You will need to sign in again to access administrative controls.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-raised hover:bg-surface-interactive transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        router.push("/auth");
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AdminGate>
    </ProtectedRoute>
  );
}
