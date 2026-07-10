import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check
} from "lucide-react";
import { OPEN_MATCHES } from "@/data/mockData";
import { MatchCard } from "@/components/shared/MatchCard";


import { useApp } from "@/contexts/AppContext";

export function ExploreTab() {
  const [filter, setFilter] = useState("All");
  const { joinedMatches: joined, setJoinedMatches: setJoined, setBookings } = useApp();
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];
  const filtered = filter === "All" ? OPEN_MATCHES : OPEN_MATCHES.filter(m => m.level === filter);
  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <AnimatePresence>
          <motion.div 
            key="title" 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0"
          >
            <h1 className="text-[32px] font-extrabold tracking-tight leading-none mb-1.5" style={{ color: "var(--ink-primary)" }}>
              Open Play
            </h1>
            <p className="text-sm text-muted-foreground">Connect, compete, and play without the hassle.</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {joined.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", bounce: 0.4 }} className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-400">You've joined {joined.size} match{joined.size > 1 ? "es" : ""}! Payment will be collected at the venue.</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {levels.map(l => (
          <motion.button key={l} onClick={() => setFilter(l)}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              backgroundColor: filter === l ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.04)",
              color: filter === l ? "var(--surface-base)" : "var(--ink-secondary)",
              borderColor: filter === l ? "var(--accent-primary)" : "rgba(255, 255, 255, 0.08)",
              boxShadow: filter === l ? "0 4px 12px rgba(0, 217, 139, 0.3)" : "0 0px 0px rgba(0,0,0,0)"
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide border border-solid relative overflow-hidden"
            style={{ backdropFilter: "blur(12px)" }}>
            {l}
          </motion.button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.04, ease: "easeOut" }}>
              <MatchCard m={m} joined={joined.has(m.id)} onJoin={() => {
                setJoined(prev => new Set(prev).add(m.id));
                setBookings(prev => {
                  if (joined.has(m.id)) return prev;
                  const newBooking = {
                    id: `PKL-OP-${m.id}${Date.now().toString().slice(-3)}`,
                    court: `Open Play • ${m.level}`,
                    facility: m.facility,
                    date: m.date,
                    time: m.time,
                    total: m.price,
                    status: "upcoming",
                    payment: "Pay at Venue",
                    isNew: true // For animation
                  };
                  return [newBooking, ...prev];
                });
              }} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
