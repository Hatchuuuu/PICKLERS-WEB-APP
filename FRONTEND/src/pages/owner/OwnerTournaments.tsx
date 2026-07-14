import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays, Users,
  Trophy, Plus, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { useTournamentStore } from "@/store/useTournamentStore";
import { CreateTournamentModal } from "@/components/owner/CreateTournamentModal";

export function OwnerTournaments() {
  const [tab, setTab] = useState<"upcoming" | "ongoing" | "completed">("ongoing");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  // For visual prototyping we'll use the store, but override the status logic 
  // slightly to map to 'upcoming', 'ongoing', 'completed'
  const storeTournaments = useTournamentStore(state => state.tournaments);
  
  // Map our new tabs to store status if needed, or just mock it.
  // The prompt asks for: 'upcoming', 'ongoing', 'completed'
  const filtered = storeTournaments.map(t => {
      // adapt mock data to new tabs if necessary
      let s = t.status.toLowerCase();
      if (s === 'active') s = 'ongoing';
      return { ...t, status: s };
  }).filter(t => t.status === tab);


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen text-foreground">
      {/* Header */}
      <div className="relative h-[68px] mb-4 -mt-[1px] flex items-center justify-between">
        <div>
          <h1 className="text-[26px] min-[390px]:text-[28px] md:text-[32px] font-extrabold tracking-tight leading-none mb-1.5 whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
            Tournaments
          </h1>
          <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Manage and track all your events.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-full mb-8 overflow-x-auto hide-scrollbar gap-8" style={{ borderBottom: "1px solid var(--border-default)" }}>
        {(["ongoing", "upcoming", "completed"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative py-4 text-sm font-semibold capitalize transition-colors whitespace-nowrap"
            style={{ 
              color: tab === t ? "var(--accent-primary)" : "var(--ink-muted)" 
            }}
          >
            {t}
            {tab === t && (
              <motion.div
                layoutId="active-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "var(--accent-primary)", boxShadow: "0 -2px 10px rgba(0,217,139,0.5)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* List Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-full py-24 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center"
            >
              <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No {tab} tournaments</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Get started by creating a new tournament to see it listed here.
              </p>
            </motion.div>
          ) : (
            filtered.map((t) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                key={t.id}
                onClick={() => navigate(`/app/owner/tournaments/${t.id}`)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl p-5 shadow-xl bg-surface-base border border-border dark:bg-white/[0.02] dark:border-white/[0.05] dark:border-t-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,217,139,0.15)] hover:border-emerald-500/30"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00D98B]/0 via-transparent to-[#3B82F6]/0 group-hover:from-[#00D98B]/5 group-hover:to-[#3B82F6]/5 transition-colors duration-500" />

                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1 transition-colors" style={{ color: "var(--ink-primary)" }}>{t.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider" style={{ color: "var(--ink-muted)" }}>
                      <span className="uppercase">{t.format}</span>
                    </div>
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                    tab === 'ongoing' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(52,211,153,0.15)]" :
                    tab === 'upcoming' ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.15)]" :
                    "bg-surface-interactive text-muted-foreground border border-border"
                  )}>
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative z-10 space-y-3 mt-6">
                  <div className="flex items-center gap-3 text-sm" style={{ color: "var(--ink-muted)" }}>
                    <CalendarDays className="w-4 h-4 opacity-70" />
                    <span>{t.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: "var(--ink-muted)" }}>
                    <Users className="w-4 h-4 opacity-70" />
                    <span>{t.teams} / {t.maxTeams || 16} Players</span>
                  </div>
                  
                  {/* Manage Brackets Button */}
                  <div className="pt-4 mt-2 border-t border-border">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/owner/tournaments/${t.id}`);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-sm tracking-wide border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.97]"
                    >
                      Manage Brackets
                      <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Floating Create Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-[110px] right-6 md:bottom-8 md:right-8 flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-2xl active:scale-[0.97] z-30 transition-all"
        style={{
          background: "var(--accent-success)",
          boxShadow: "0 8px 32px rgba(0,217,139,0.4)",
        }}
      >
        <Plus className="w-5 h-5" />
        Create
      </button>

      <CreateTournamentModal isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}
