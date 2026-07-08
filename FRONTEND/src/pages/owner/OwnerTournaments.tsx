import { useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, Users,
  Trophy, Plus, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TOURNAMENTS } from "@/data/mockData";


export function OwnerTournaments() {
  const [tab, setTab] = useState("Active");
  const filtered = TOURNAMENTS.filter(t => t.status === tab.toLowerCase());
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>TOURNAMENTS</h1>
          <p className="text-sm text-muted-foreground">Manage and track your events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.97] transition-all"
          style={{ background: "#22c55e", color: "#fff" }}>
          <Plus className="w-4 h-4" /> Create
        </button>
      </div>
      <div className="flex gap-1 border-b border-border mb-6">
        {["Active", "Upcoming", "Completed"].map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{ color: tab === t ? "#00d4ff" : "#6b82b8" }}>
            {t}
            {tab === t && <motion.div layoutId="tourn-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#00d4ff" }} />}
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
            className="rounded-xl p-5" style={{ background: "#0f1d47", border: "1px solid rgba(0,212,255,0.12)" }}>
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
              <div className="h-1.5 rounded-full" style={{ width: `${(t.teams / t.maxTeams) * 100}%`, background: "#00d4ff" }} />
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-medium active:scale-[0.97] transition-all"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>
              {t.status === "completed" ? "View Results" : "Manage Bracket"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
