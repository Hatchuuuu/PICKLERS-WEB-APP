import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Bell,
  LayoutDashboard, Map, CalendarDays, Users, Settings, LogOut, PlayCircle
} from "lucide-react";
import { PicklersLogo } from "@/components/ui/PicklersLogo";


export const PLAYER_TABS = [
  { id: "player-play" as any, label: "Play", icon: Map },
  { id: "player-explore" as any, label: "Explore", icon: PlayCircle },
  { id: "player-bookings" as any, label: "Bookings", icon: CalendarDays },
  { id: "player-community" as any, label: "Community", icon: Users },
  { id: "player-settings" as any, label: "Settings", icon: Settings },
];

export function AppShellLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop();
  const view = "player-" + (currentPath === "app" ? "play" : currentPath);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border" style={{ background: "#0b1640" }}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PicklersLogo size={22} />
            <span className="text-lg font-bold tracking-widest" style={{ fontFamily: "'Montserrat', sans-serif", color: "#00d4ff" }}>PICKLERS</span>
          </div>
          <button aria-label="Notifications" className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
            style={{ transition: "background-color 150ms ease-out" }}>
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 border border-[#0b1640]" />
          </button>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {PLAYER_TABS.map(tab => {
            const active = view === tab.id;
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => navigate(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-left active:scale-[0.97]"
                style={{
                  background: active ? "rgba(0,212,255,0.12)" : "transparent",
                  color: active ? "#00d4ff" : "#6b82b8",
                  borderLeft: active ? "2px solid #00d4ff" : "2px solid transparent",
                  transition: "background-color 150ms ease-out, color 150ms ease-out",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <Icon className="w-4 h-4 shrink-0" />{tab.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border flex flex-col gap-1">
          <button onClick={() => navigate("/app/owner")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
            style={{ transition: "background-color 150ms ease-out, color 150ms ease-out" }}>
            <LayoutDashboard className="w-4 h-4" />Owner Dashboard
          </button>
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
            style={{ transition: "background-color 150ms ease-out, color 150ms ease-out" }}>
            <LogOut className="w-4 h-4" />Log Out
          </button>
        </div>
        <div className="p-4 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: "#1a2d6e", color: "#00d4ff" }}>M</div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate">Maria Santos</div>
            <div className="text-xs text-muted-foreground">3.5 Rating</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ ease: "easeOut", duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex border-t border-border z-40"
        style={{ background: "rgba(11,22,64,0.97)", backdropFilter: "blur(16px)" }}>
        {PLAYER_TABS.map(tab => {
          const active = view === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => navigate(`/app/${tab.id.replace("player-", "") === "play" ? "" : tab.id.replace("player-", "")}`)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: active ? "#00d4ff" : "#6b82b8" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
