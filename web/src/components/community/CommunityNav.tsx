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
            className="relative flex items-center gap-3 px-3 py-2.5 md:py-3 rounded-2xl transition-all shrink-0"
            style={{
              background: isActive ? "var(--surface-raised)" : "transparent",
              color: isActive ? "var(--ink-primary)" : "var(--ink-secondary)",
              border: isActive ? "1px solid var(--border-subtle)" : "1px solid transparent",
              boxShadow: isActive ? "0 8px 30px rgba(0,0,0,0.06)" : "none"
            }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors"
                 style={{ background: isActive ? "var(--accent-primary-muted)" : "var(--surface-interactive)" }}>
              <Icon className="w-5 h-5" style={{ color: isActive ? "var(--accent-primary)" : "var(--ink-muted)" }} />
            </div>
            <span className="font-extrabold text-[15px]">{t.label}</span>
            {t.id === "messages" && unreadCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-[0_4px_12px_rgba(239,68,68,0.3)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
