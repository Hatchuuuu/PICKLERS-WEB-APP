import { useState, useRef, useEffect } from "react";
import { useOutlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Map, Settings,
  Trophy, UserCheck, LogOut, Bell, Grid2x2
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";
import ShinyText from "@/components/ui/ShinyText";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";

type OwnerTabId = "owner-dashboard" | "owner-courts" | "owner-tournaments" | "owner-staff" | "owner-settings";

interface OwnerTab {
  id: OwnerTabId;
  label: string;
  icon: React.ElementType;
}

export const OWNER_TABS: OwnerTab[] = [
  { id: "owner-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "owner-courts", label: "My Courts", icon: Grid2x2 },
  { id: "owner-tournaments", label: "Tournaments", icon: Trophy },
  { id: "owner-staff", label: "Staff", icon: UserCheck },
  { id: "owner-settings", label: "Settings", icon: Settings },
];

export function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const outlet = useOutlet();

  const segments = location.pathname.split("/").filter(Boolean);
  const currentPath = segments.length > 0 ? segments[segments.length - 1] : "";
  const view = "owner-" + (currentPath === "owner" ? "dashboard" : currentPath);

  const { notifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-solid relative z-20 bg-surface-base/75 backdrop-blur-2xl border-border">
        <div className="px-6 py-5 border-b border-solid" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 mb-1">
            <PicklersLogo size={24} />
            <ShinyText text="PICKLERS" className="text-xl font-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em", paddingRight: "0.1em" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
          </div>
          <div className="text-[12px] font-medium" style={{ color: "var(--accent-success)" }}>Owner Portal</div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto relative">
          {OWNER_TABS.map(tab => {
            const active = view === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigate(`/app/owner/${tab.id.replace("owner-", "") === "dashboard" ? "" : tab.id.replace("owner-", "")}`)}
                className={cn("relative flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-left active:scale-[0.98] transition-colors group", active ? "font-bold" : "")}
                style={{ color: active ? "var(--ink-inverse)" : "var(--ink-secondary)" }}>
                {active && (
                  <motion.div layoutId="owner-sidebar-active-pill" className="absolute inset-0 rounded-xl"
                    style={{ background: "var(--accent-warning)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}

                <Icon className="w-4 h-4 shrink-0 relative z-10 transition-transform group-hover:scale-110" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-solid flex flex-col gap-1" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={() => navigate("/app")}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors hover:bg-surface-raised"
            style={{ color: "var(--ink-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--ink-muted)"}>
            <Map className="w-4 h-4" />Player Dashboard
          </button>
          <button onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium transition-colors hover:bg-surface-raised"
            style={{ color: "var(--ink-muted)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--ink-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--ink-muted)"}>
            <LogOut className="w-4 h-4" />Log Out
          </button>
        </div>
        <div className="p-5 border-t border-solid flex items-center gap-3" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.1)" }}>
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center p-[2px] overflow-hidden">
            <div className="absolute inset-0 w-full h-full" 
              style={{ 
                background: "conic-gradient(from 180deg at 50% 50%, #10b981 0deg, #FBBF24 180deg, #10b981 360deg)"
              }} />
            <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center text-sm font-bold uppercase"
              style={{ background: "var(--surface-base)", color: "#FBBF24" }}>{user?.name?.[0] || "O"}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium truncate" style={{ color: "var(--ink-primary)" }}>{user?.name || "BGC Pickleball Hub"}</div>
            <div className="text-[12px]" style={{ color: "var(--accent-success)" }}>● Verified Owner</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative bg-background flex flex-col">
        {/* Mobile Premium Header */}
        <div 
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-[15px] py-[6px] border-b border-border bg-surface-base/75 backdrop-blur-3xl saturate-200">
          <div className="flex items-center gap-1">
            <PicklersLogo size={36} />
            <ShinyText text="PICKLERS" className="text-[18px] font-black" style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em", textTransform: "uppercase", lineHeight: "1.2", display: "inline-block", paddingTop: "4px", paddingBottom: "2px", paddingRight: "0.1em" }} color="var(--ink-primary)" shineColor="#4abd96" speed={3} delay={0} />
          </div>
          <div className="flex items-center gap-4 relative">

            
            <button onClick={() => setShowLogoutConfirm(true)} className="relative w-8 h-8 rounded-full flex items-center justify-center p-[1.5px] active:scale-95 transition-transform overflow-hidden">
              <div className="absolute inset-0 w-full h-full" 
                style={{ 
                  background: "conic-gradient(from 180deg at 50% 50%, #10b981 0deg, #FBBF24 180deg, #10b981 360deg)"
                }} />
              <div className="relative z-10 w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold uppercase pointer-events-none"
                style={{ background: "var(--surface-base)", color: "#FBBF24" }}>{user?.name?.[0] || "O"}</div>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="flex-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-solid z-40 pb-safe bg-surface-base/85 backdrop-blur-2xl border-border">
        {OWNER_TABS.map(tab => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => navigate(`/app/owner/${tab.id.replace("owner-", "") === "dashboard" ? "" : tab.id.replace("owner-", "")}`)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-colors relative"
              style={{ color: active ? "#FBBF24" : "var(--ink-muted)" }}>
              {active && (
                <motion.div layoutId="owner-mobile-active-indicator" className="absolute top-0 inset-x-0 h-[2px] mx-auto w-8"
                  style={{ background: "#FBBF24", boxShadow: "0 2px 8px rgba(251,191,36,0.5)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center"
              style={{ background: "rgba(30, 30, 32, 0.75)", backdropFilter: "blur(40px) saturate(150%)", borderColor: "rgba(255,255,255,0.15)" }}>
              <h3 className="text-xl font-bold text-foreground mb-2">Log Out?</h3>
              <p className="text-[14px] text-foreground/60 mb-6 leading-relaxed">You are about to securely log out of the Facility Dashboard. You will need to sign in again to manage your courts.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { logout(); navigate("/"); }} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "#ef4444", color: "#ffffff" }}>
                  Log Out
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} 
                  className="w-full py-3.5 rounded-full font-bold active:scale-[0.98] transition-opacity hover:opacity-90 shadow-lg"
                  style={{ background: "rgba(34, 197, 94, 0.15)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
