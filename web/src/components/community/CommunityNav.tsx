"use client";

import { motion } from "motion/react";
import { Users, MessageCircle, Activity } from "lucide-react";

export type Tab = "feed" | "messages" | "community";

export default function CommunityNav({ active, onChange, unreadCount }: {
  active: Tab;
  onChange: (t: Tab) => void;
  unreadCount: number;
}) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "feed", label: "Feed", icon: Activity },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "community", label: "Discover", icon: Users },
  ];

  return (
    <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <motion.button
            key={t.id}
            onClick={() => onChange(t.id)}
            whileTap={{ scale: 0.97 }}
            className={`relative flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-300 shrink-0 ${
              isActive 
                ? "bg-gradient-to-r from-emerald-500/15 via-emerald-400/20 to-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_8px_30px_rgba(0,217,139,0.15)]" 
                : "bg-surface-raised/50 hover:bg-surface-raised border border-border-subtle text-ink-secondary"
            }`}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ background: isActive ? "rgba(0,217,139,0.2)" : "var(--surface-interactive)" }}
            >
              <Icon className="w-5 h-5" style={{ color: isActive ? "var(--accent-primary)" : "var(--ink-muted)" }} />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight" style={{ fontFamily: "var(--font-outfit), sans-serif" }}>{t.label}</span>
            {t.id === "messages" && unreadCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-emerald-500 text-black text-[11px] font-black flex items-center justify-center shadow-[0_0_12px_rgba(0,217,139,0.5)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
