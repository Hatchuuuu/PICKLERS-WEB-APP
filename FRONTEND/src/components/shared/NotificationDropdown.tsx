import { motion, AnimatePresence } from "motion/react";
import { Bell, CalendarDays, Users, Server, Check, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, markAllNotificationsRead, dismissNotification } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case "booking": return <CalendarDays className="w-5 h-5 text-emerald-400" />;
      case "community": return <Users className="w-5 h-5 text-[#00D4FF]" />;
      case "system": return <Server className="w-5 h-5 text-amber-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute top-[calc(100%+12px)] right-0 w-[340px] rounded-[24px] shadow-[0_24px_54px_rgba(0,0,0,0.6)] overflow-hidden z-[100] border origin-top-right"
      style={{ background: "rgba(10,22,40,0.9)", backdropFilter: "blur(30px) saturate(1.5)", borderColor: "rgba(255,255,255,0.08)" }}>
      
      <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <h3 className="text-[16px] font-bold text-white tracking-tight" >Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllNotificationsRead} className="text-[12px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 active:scale-95">
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[380px] overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-1 scrollbar-none">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-[14px] font-medium text-white/60">You're all caught up!</p>
            </motion.div>
          ) : (
            notifications.map((n, i) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30, delay: i * 0.05 }}
                className={cn(
                  "relative flex gap-3 p-3.5 rounded-[16px] transition-colors group cursor-pointer",
                  n.read ? "hover:bg-white/[0.04]" : "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
                )}
                onClick={() => dismissNotification(n.id)}
              >
                <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 pr-6">
                  <div className="flex items-start justify-between mb-0.5">
                    <span className={cn("text-[14px] font-semibold", n.read ? "text-white/80" : "text-white")}>{n.title}</span>
                    <span className="text-[11px] text-white/40 shrink-0 mt-0.5">{n.time}</span>
                  </div>
                  <p className={cn("text-[13px] leading-snug", n.read ? "text-white/50" : "text-white/70")}>{n.body}</p>
                </div>
                
                {/* Unread dot */}
                {!n.read && (
                  <div className="absolute left-3.5 top-3.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
                
                {/* Dismiss Icon */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <X className="w-3.5 h-3.5 text-white/70" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
