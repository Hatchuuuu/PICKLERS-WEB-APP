"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import {
  Bell, LayoutDashboard, CalendarDays, Users, Settings, LogOut, Building2, Flame
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
// VerificationGate removed
import { TopUpModal } from "@/components/modals/TopUpModal";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

type PlayerTabId = "player-play" | "player-explore" | "player-bookings" | "player-community" | "player-settings";

interface PlayerTab {
  id: PlayerTabId;
  label: string;
  icon: React.ElementType;
}

export const PLAYER_TABS: PlayerTab[] = [
  { id: "player-play", label: "Play", icon: Building2 },
  { id: "player-explore", label: "Explore", icon: Flame },
  { id: "player-community", label: "Community", icon: Users },
  { id: "player-bookings", label: "Bookings", icon: CalendarDays },
  { id: "player-settings", label: "Settings", icon: Settings },
];

export default function AppShellLayout({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const { user, logout } = useAuth();
  const { notifications } = useApp();

  const segments = pathname.split("/").filter(Boolean);
  const currentPath = segments.length > 0 ? segments[segments.length - 1] : "";
  const view = "player-" + (currentPath === "app" ? "play" : currentPath);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: mainScrollRef });
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest < 0) return;
    if (latest > lastY && latest > 50) {
      setIsHeaderVisible(false);
    } else if (latest < lastY) {
      setIsHeaderVisible(true);
    }
    setLastY(latest);
  });

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-notif-toggle]')) return;

      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifs(false);
      }
    }
    if (showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs]);

  return (
    <ProtectedRoute>
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-solid relative z-20 bg-surface-base/75 backdrop-blur-2xl border-border">
        <div className="px-6 py-5 border-b border-solid flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1">
            <PicklersLogo size={36} />
            <ShinyText text="PICKLERS" className="text-[18px] font-black" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: "1.2", display: "inline-block", paddingTop: "4px", paddingBottom: "2px", paddingRight: "0.1em", marginLeft: "-8px" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
          </div>
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              data-notif-toggle="true"
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-surface-raised"
              style={{ color: showNotifs ? "var(--ink-primary)" : "var(--ink-secondary)" }}>
              <Bell className="w-4 h-4" pointerEvents="none" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full border border-solid"
                  style={{ background: "var(--accent-primary)", borderColor: "var(--surface-base)" }} />
              )}
            </button>

            <AnimatePresence>
              {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} className="top-[calc(100%+12px)] left-0 origin-top-left" />}
            </AnimatePresence>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto relative">
          {PLAYER_TABS.map(tab => {
            const active = view === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => router.push(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
                className={cn("relative flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-left active:scale-[0.98] transition-colors group", active ? "font-bold" : "")}
                style={{ color: active ? "var(--ink-inverse)" : "var(--ink-secondary)" }}>
                {active && (
                  <motion.div layoutId="sidebar-active-pill" className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--accent-primary)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}

                <Icon className="w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-solid flex flex-col gap-1" style={{ borderColor: "var(--border-subtle)" }}>
          {user?.role === "owner" && (
            <button onClick={() => router.push("/app/owner")}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors hover:bg-surface-raised"
              style={{ color: "var(--ink-muted)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--ink-muted)"}>
              <LayoutDashboard className="w-4 h-4" />Owner Dashboard
            </button>
          )}
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors hover:bg-surface-raised"
            style={{ color: "var(--ink-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--accent-danger)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--ink-muted)"}>
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
        <div className="p-5 border-t border-solid flex items-center gap-3" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.1)" }}>
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-[2px]"
            style={{ background: "conic-gradient(from 180deg at 50% 50%, var(--accent-primary) 0deg, var(--accent-secondary) 180deg, var(--accent-primary) 360deg)" }}>
            <div className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold uppercase bg-background text-accent-primary">{user?.name?.[0] || "P"}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink-primary)" }}>{user?.name || "Player"}</div>
            <div className="text-[12px]" style={{ color: "var(--ink-muted)" }}>{user?.phone || user?.email || "3.5 Rating"}</div>
          </div>
        </div>
      </aside>

      <main ref={mainScrollRef} className="flex-1 overflow-y-auto pb-[calc(74px+env(safe-area-inset-bottom))] md:pb-0 relative bg-background flex flex-col">
        {/* Mobile Premium Header */}
        <motion.div
          animate={{ y: isHeaderVisible ? 0 : "-100%", z: 100 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="md:hidden sticky top-0 z-[100] isolate flex items-center justify-between px-[15px] py-[6px] border-b border-border bg-surface-base/90 backdrop-blur-3xl saturate-200">
          <div className="flex items-center gap-1">
            <PicklersLogo size={36} />
            <ShinyText text="PICKLERS" className="text-[18px] font-black" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: "1.2", display: "inline-block", paddingTop: "4px", paddingBottom: "2px", paddingRight: "0.1em", marginLeft: "-8px" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="relative" ref={notifRef}>
              <button data-notif-toggle="true" onClick={() => setShowNotifs(!showNotifs)} className="relative active:scale-95 transition-transform flex items-center justify-center">
                <Bell className="w-5 h-5 pointer-events-none" style={{ color: "var(--ink-secondary)" }} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-[1.5px]" style={{ borderColor: "var(--surface-base)", background: "var(--accent-primary)" }} />
                )}
              </button>

              <AnimatePresence>
                {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} className="top-[calc(100%+16px)] right-[-48px] origin-top w-[calc(100vw-30px)] sm:w-[360px] max-w-[380px]" />}
              </AnimatePresence>
            </div>

            <button onClick={() => setShowLogoutConfirm(true)} className="relative w-8 h-8 rounded-full flex items-center justify-center p-[1.5px] active:scale-95 transition-transform"
              style={{ background: "conic-gradient(from 180deg at 50% 50%, var(--accent-primary) 0deg, var(--accent-secondary) 180deg, var(--accent-primary) 360deg)" }}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold uppercase pointer-events-none bg-background text-accent-primary">{user?.name?.[0] || "P"}</div>
            </button>
          </div>
        </motion.div>



        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={pathname} className="flex-1 relative z-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ ease: "easeInOut", duration: 0.25 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border z-40 pb-safe bg-background shadow-lg">
        {PLAYER_TABS.map(tab => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => router.push(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-colors relative"
              style={{ color: active ? "var(--accent-primary)" : "var(--ink-muted)" }}>
              {active && (
                <motion.div layoutId="mobile-active-indicator" className="absolute top-0 inset-x-0 h-[2px] mx-auto w-8 rounded-full"
                  style={{ background: "var(--accent-primary)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Confirm Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 dark:bg-[#0A1118]/80 backdrop-blur-3xl"
              onClick={() => setShowLogoutConfirm(false)} />
            <motion.div initial={{ y: "100%", opacity: 0.5 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm flex flex-col gap-2 z-10 items-center">
              <div className="w-[340px] bg-background dark:bg-gradient-to-b dark:from-[#1A2235] dark:to-[#0B132B] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl ring-1 ring-black/5 dark:ring-0 relative p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF453A]/20 via-transparent to-transparent opacity-50"></div>
                <div className="relative bg-surface-base dark:bg-[#0A1124] rounded-[27px] p-6 pb-7 text-center overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FF453A]/20 blur-[50px] rounded-full pointer-events-none"></div>
                  <div className="relative mb-5 mt-2">
                    <div className="absolute inset-0 bg-[#FF453A] blur-xl opacity-30 rounded-full animate-pulse"></div>
                    <div className="w-14 h-14 relative z-10 rounded-[18px] bg-gradient-to-b from-[#FF453A]/20 to-[#FF3B30]/5 flex items-center justify-center border border-[#FF453A]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                      <LogOut className="w-6 h-6 text-[#FF453A]" style={{ marginLeft: "-2px" }} strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-[19px] font-bold text-foreground dark:text-white tracking-tight mb-2">Sign Out?</h3>
                  <p className="text-[14px] text-muted-foreground dark:text-slate-400 font-medium leading-relaxed px-1">
                    You will need to sign in again to access your bookings and profile.
                  </p>
                  <div className="flex gap-3 w-full mt-7">
                    <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 rounded-xl text-[14px] font-semibold text-foreground/80 dark:text-slate-300 bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white transition-all active:scale-[0.98]">
                      Cancel
                    </button>
                    <button onClick={() => { logout(); router.push("/"); }} className="flex-1 py-3.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-b from-[#FF453A] to-[#E02D23] shadow-[0_8px_20px_rgba(255,59,48,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_10px_25px_rgba(255,59,48,0.4)] transition-all active:scale-[0.98]">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TopUpModal />
    </div>
    </ProtectedRoute>
  );
}
