import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Users,
  Trophy, Plus, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOURNAMENTS } from "@/data/mockData";


export function OwnerTournaments() {
  const [tab, setTab] = useState("Active");
  const filtered = TOURNAMENTS.filter(t => t.status === tab.toLowerCase());
  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
              Tournaments
            </h1>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              Manage and track your events
            </p>
          </motion.div>
      </div>
      <div className="flex gap-1 border-b border-border mb-6">
        {["Active", "Upcoming", "Completed"].map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{ color: tab === t ? "var(--accent-primary)" : "var(--ink-muted)" }}>
            {t}
            {tab === t && <motion.div layoutId="tourn-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "var(--accent-primary)" }} />}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {tab.toLowerCase()} tournaments</p>
          </div>
        ) : filtered.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease: "easeOut" }}
            className="rounded-xl p-5" style={{ background: "var(--surface-raised)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-foreground text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.format}</div>
              </div>
              <Trophy className={cn("w-5 h-5 shrink-0", t.status === "completed" ? "text-amber-400" : "text-cyan-400")} />
            </div>
            <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{t.date}</div>
              <div className="flex items-center gap-1"><Users className="w-3 h-3" />{t.teams}/{t.maxTeams} Teams · {t.division}</div>
              <div className="flex items-center gap-1"><CreditCard className="w-3 h-3" />Prize: {t.prize}</div>
            </div>
            <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-1.5 rounded-full" style={{ width: `${(t.teams / t.maxTeams) * 100}%`, background: "var(--accent-primary)" }} />
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-medium active:scale-[0.97] transition-all"
              style={{ background: "var(--accent-primary-muted)", border: "1px solid var(--border-emphasis)", color: "var(--accent-primary)" }}>
              {t.status === "completed" ? "View Results" : "Manage Bracket"}
            </button>
          </motion.div>
        ))}
      </div>

      <button
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-2xl active:scale-[0.97] z-30"
        style={{ background: "var(--accent-success)", color: "#fff", boxShadow: "0 8px 32px rgba(34,197,94,0.4)", transition: "opacity 150ms ease-out, transform 100ms ease-out" }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        <Plus className="w-5 h-5" />Create
      </button>
    </div>
  );
}
