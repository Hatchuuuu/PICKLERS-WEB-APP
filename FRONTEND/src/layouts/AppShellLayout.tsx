import { useState, useRef, useEffect } from "react";
import { useOutlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import {
  Bell,
  LayoutDashboard, Map, CalendarDays, Users, Settings, LogOut, PlayCircle, Building2, Flame, ShieldAlert
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { VerificationGate } from "@/components/shared/VerificationGate";

type PlayerTabId = "player-play" | "player-explore" | "player-bookings" | "player-community" | "player-settings";

interface PlayerTab {
  id: PlayerTabId;
  label: string;
  icon: React.ElementType;
}

export const PLAYER_TABS: PlayerTab[] = [
  { id: "player-play", label: "Play", icon: Building2 },
  { id: "player-explore", label: "Explore", icon: Flame },
  { id: "player-bookings", label: "Bookings", icon: CalendarDays },
  { id: "player-community", label: "Community", icon: Users },
  { id: "player-settings", label: "Settings", icon: Settings },
];

export function AppShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const { user, logout } = useAuth();
  const { notifications } = useApp();

  const segments = location.pathname.split("/").filter(Boolean);
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
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-solid relative z-20"
        style={{
          background: "rgba(10, 22, 40, 0.75)",
          backdropFilter: "blur(24px) saturate(1.2)",
          borderColor: "var(--border-subtle)"
        }}>
        <div className="px-6 py-5 border-b border-solid flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-1">
            <PicklersLogo size={36} />
            <ShinyText text="PICKLERS" className="text-[18px] font-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em", textTransform: "uppercase", lineHeight: "1.2", display: "inline-block", paddingTop: "4px", paddingBottom: "2px" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
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
              {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
            </AnimatePresence>
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto relative">
          {PLAYER_TABS.map(tab => {
            const active = view === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigate(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
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
            <button onClick={() => navigate("/app/owner")}
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
            <div className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold uppercase"
              style={{ background: "var(--surface-base)", color: "var(--accent-primary)" }}>{user?.name?.[0] || "P"}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink-primary)" }}>{user?.name || "Player"}</div>
            <div className="text-[12px]" style={{ color: "var(--ink-muted)" }}>{user?.phone || user?.email || "3.5 Rating"}</div>
          </div>
        </div>
      </aside>

      <main ref={mainScrollRef} className="flex-1 overflow-y-auto pb-20 md:pb-0 relative bg-background flex flex-col">
        {/* Mobile Premium Header */}
        <motion.div 
          animate={{ y: isHeaderVisible ? 0 : "-100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-[15px] py-[6px] border-b border-white/[0.08]"
          style={{ background: "rgba(10, 22, 40, 0.75)", backdropFilter: "blur(40px) saturate(200%)" }}>
          <div className="flex items-center gap-1">
            <PicklersLogo size={36} />
            <ShinyText text="PICKLERS" className="text-[18px] font-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em", textTransform: "uppercase", lineHeight: "1.2", display: "inline-block", paddingTop: "4px", paddingBottom: "2px" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
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
                {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
              </AnimatePresence>
            </div>
            
            <button onClick={() => setShowLogoutConfirm(true)} className="relative w-8 h-8 rounded-full flex items-center justify-center p-[1.5px] active:scale-95 transition-transform"
              style={{ background: "conic-gradient(from 180deg at 50% 50%, var(--accent-primary) 0deg, var(--accent-secondary) 180deg, var(--accent-primary) 360deg)" }}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold uppercase pointer-events-none"
                style={{ background: "var(--surface-base)", color: "var(--accent-primary)" }}>{user?.name?.[0] || "P"}</div>
            </button>
          </div>
        </motion.div>



        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="flex-1 relative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-solid z-40 pb-safe"
        style={{ background: "rgba(10, 22, 40, 0.85)", backdropFilter: "blur(24px) saturate(1.2)", borderColor: "var(--border-subtle)" }}>
        {PLAYER_TABS.map(tab => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => navigate(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-colors relative"
              style={{ color: active ? "var(--accent-primary)" : "var(--ink-muted)" }}>
              {active && (
                <motion.div layoutId="mobile-active-indicator" className="absolute top-0 inset-x-0 h-[2px] mx-auto w-8"
                  style={{ background: "var(--accent-primary)", boxShadow: "0 2px 8px rgba(0,217,139,0.5)" }}
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)} />
            <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}>
              <div className="w-[320px] bg-gradient-to-b from-[#1c1c1e]/95 to-[#141415]/95 backdrop-blur-[40px] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-white/[0.08]">
                 <div className="p-8 text-center pb-6">
                   <div className="w-16 h-16 rounded-full bg-[#FF3B30]/10 flex items-center justify-center mx-auto mb-5 border border-[#FF3B30]/20 shadow-[0_0_24px_rgba(255,59,48,0.2)]">
                     <LogOut className="w-7 h-7 text-[#FF3B30]" style={{ marginLeft: "-2px" }} />
                   </div>
                   <h3 className="text-[22px] font-black text-white tracking-tight" >Sign Out</h3>
                   <p className="text-[15px] text-white/60 mt-3 leading-relaxed">
                     You will need to sign in again to access your bookings and profile.
                   </p>
                 </div>
                 <div className="flex flex-col p-5 pt-0 gap-3">
                   <button onClick={() => { logout(); navigate("/"); }} className="w-full py-4 rounded-[18px] text-[16px] font-extrabold text-white bg-[#FF3B30] hover:bg-[#FF3B30]/90 active:scale-[0.98] transition-all shadow-[0_4px_16px_rgba(255,59,48,0.3)]">
                     Sign Out
                   </button>
                   <button onClick={() => setShowLogoutConfirm(false)} className="w-full py-4 rounded-[18px] text-[16px] font-semibold text-white/80 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] transition-all">
                     Cancel
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
