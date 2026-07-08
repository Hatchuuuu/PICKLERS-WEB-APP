import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check
} from "lucide-react";
import { OPEN_MATCHES } from "@/data/mockData";
import { MatchCard } from "@/components/shared/MatchCard";


export function ExploreTab() {
  const [filter, setFilter] = useState("All");
  const [joined, setJoined] = useState<Set<number>>(new Set());
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];
  const filtered = filter === "All" ? OPEN_MATCHES : OPEN_MATCHES.filter(m => m.level === filter);
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>OPEN PLAY</h1>
        <p className="text-sm text-muted-foreground">Join a match, split the cost</p>
      </div>
      {joined.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-400">You've joined {joined.size} match{joined.size > 1 ? "es" : ""}! Payment will be collected at the venue.</span>
        </motion.div>
      )}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {levels.map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className="shrink-0 px-4 py-2.5 rounded-full text-sm font-medium active:scale-[0.97]"
            style={{
              background: filter === l ? "#00d4ff" : "rgba(26,45,110,0.5)",
              color: filter === l ? "#080f2e" : "#6b82b8",
              border: "1px solid",
              borderColor: filter === l ? "transparent" : "rgba(0,212,255,0.12)",
              transition: "background-color 150ms ease-out, color 150ms ease-out, border-color 150ms ease-out",
            }}>
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((m, i) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.04, ease: "easeOut" }}>
              <MatchCard m={m} joined={joined.has(m.id)} onJoin={() => setJoined(prev => new Set(prev).add(m.id))} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
