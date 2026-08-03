"use client";

import { motion, AnimatePresence } from "motion/react";
import { Bell, CalendarDays, Users, Server, Check, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export function NotificationDropdown({ onClose: _onClose, className }: { onClose?: () => void, className?: string }) {
  const { notifications, markAllNotificationsRead, dismissNotification } = useApp();

  const getIconInfo = (type: string) => {
    switch (type) {
      case "booking": return { Icon: CalendarDays, color: "#0BCE83", bg: "rgba(11,206,131,0.15)", glow: "rgba(11,206,131,0.4)" };
      case "community": return { Icon: Users, color: "#00D4FF", bg: "rgba(0,212,255,0.15)", glow: "rgba(0,212,255,0.4)" };
      case "system": return { Icon: Server, color: "#FF9F0A", bg: "rgba(255,159,10,0.15)", glow: "rgba(255,159,10,0.4)" };
      default: return { Icon: Bell, color: "#94A3B8", bg: "rgba(148,163,184,0.15)", glow: "rgba(148,163,184,0.4)" };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("absolute w-[340px] max-w-[calc(100vw-30px)] rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden z-[9999] border bg-white/95 dark:bg-[#0B132B]/98 backdrop-blur-[60px] saturate-[1.2] border-border dark:border-white/[0.12] ring-1 ring-black/5 dark:ring-white/5", className)}>

      <div className="px-5 py-4 flex items-center justify-between border-b border-border dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
        <h3 className="text-[17px] font-black text-foreground dark:text-white tracking-wide" >Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllNotificationsRead} className="text-[12px] font-bold text-[#0BCE83] hover:text-[#0ea86f] transition-all flex items-center gap-1.5 active:scale-95 px-2.5 py-1 rounded-full bg-[#0BCE83]/10 hover:bg-[#0BCE83]/20">
            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Mark read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2.5 flex flex-col gap-1.5 scrollbar-none relative">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-4 border border-border dark:border-white/[0.05] shadow-inner">
                <Bell className="w-6 h-6 text-muted-foreground dark:text-slate-500" />
              </div>
              <p className="text-[15px] font-bold text-foreground dark:text-white mb-1">You're all caught up!</p>
              <p className="text-[13px] font-medium text-muted-foreground dark:text-slate-500">No new notifications.</p>
            </motion.div>
          ) : (
            notifications.map((n, i) => {
              const info = getIconInfo(n.type);
              const Icon = info.Icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30, delay: i * 0.05 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.8, right: 0 }}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x < -60) {
                      dismissNotification(n.id);
                    }
                  }}
                  className={cn(
                    "relative flex gap-3.5 p-4 rounded-[20px] transition-all duration-300 group cursor-pointer",
                    n.read
                      ? "hover:bg-black/[0.02] dark:hover:bg-white/[0.04] border border-transparent"
                      : "bg-surface-raised dark:bg-white/[0.04] border border-border dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  )}
                  onClick={() => dismissNotification(n.id)}
                >
                  <div className="shrink-0 w-11 h-11 rounded-[16px] flex items-center justify-center border border-border dark:border-white/[0.05] shadow-sm transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: info.bg }}>
                    <Icon className="w-5 h-5" style={{ color: info.color, filter: `drop-shadow(0 0 8px ${info.glow})` }} />
                  </div>

                  <div className="flex-1 min-w-0 pr-6 pt-0.5">
                    <div className="flex items-start justify-between mb-1">
                      <span className={cn("text-[14px] font-bold truncate pr-2 tracking-tight", n.read ? "text-muted-foreground dark:text-slate-300" : "text-foreground dark:text-white")}>{n.title}</span>
                      <span className="text-[11px] font-medium text-muted-foreground dark:text-slate-500 shrink-0 mt-0.5">{n.time}</span>
                    </div>
                    <p className={cn("text-[13px] leading-relaxed", n.read ? "text-muted-foreground dark:text-slate-500" : "text-foreground/80 dark:text-slate-400 font-medium")}>{n.body}</p>
                  </div>

                  {/* Unread indicator */}
                  {!n.read && (
                    <div className="absolute left-[13px] top-[13px] w-2.5 h-2.5 rounded-full z-10"
                      style={{ backgroundColor: info.color, boxShadow: `0 0 12px ${info.color}, 0 0 4px ${info.color}` }} />
                  )}

                  {/* Dismiss Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 backdrop-blur-md shadow-lg border border-black/10 dark:border-white/10">
                      <X className="w-4 h-4 text-foreground dark:text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
