"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Calendar, Users, Award, Search, Check, Sparkles } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { DEMO_TOURNAMENTS } from "@/lib/demoData";
import { useTournamentStore } from "@/store/useTournamentStore";

export default function PlayerTournamentsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [search, setSearch] = useState("");
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [selectedBracket, setSelectedBracket] = useState<any | null>(null);

  const storeTournaments = useTournamentStore((state) => state.tournaments);
  const tournaments = storeTournaments.length > 0 ? storeTournaments : (DEMO_TOURNAMENTS as any[]);

  const filtered = tournaments.filter((t) => {
    const matchesTab = tab === "all" || t.status?.toLowerCase() === tab;
    const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) || t.level?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function handleRegister(id: string, name: string) {
    if (registeredIds.has(id)) {
      showToast(`You are already registered for '${name}'.`, "success");
      return;
    }
    setRegisteredIds((prev) => new Set(prev).add(id));
    showToast(`Successfully registered for '${name}'! Registration details sent to your notifications.`, "success");
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] md:text-[34px] font-extrabold tracking-tight leading-none mb-1.5 flex items-center gap-3" style={{ color: "var(--ink-primary)" }}>
            Tournaments
            <Trophy className="w-7 h-7 text-amber-400" />
          </h1>
          <p className="text-[13px] font-medium leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Browse official tournaments, sign up with your team, and track brackets live.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments by name or level..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-base text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "upcoming", "ongoing", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                tab === t
                  ? "bg-emerald-500 text-white shadow-md"
                  : "bg-surface-base border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-bold">No tournaments found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search query or filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const isReg = registeredIds.has(t.id);
            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-surface-base border border-border shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      {t.level || "All Levels"}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      t.status === "ongoing" || t.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    }`}>
                      {t.status || "Upcoming"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2 group-hover:text-amber-400 transition-colors">
                    {t.name}
                  </h3>

                  <div className="space-y-2 text-xs text-muted-foreground mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t.date || "Aug 15-16, 2026"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>Participants: <strong className="text-foreground">{t.participants || 32} Teams</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>Prize Pool: <strong className="text-emerald-500 font-bold">₱25,000</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-2">
                  <button
                    onClick={() => handleRegister(t.id, t.name)}
                    disabled={isReg}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                      isReg
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {isReg ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Registered
                      </>
                    ) : (
                      "Register Team"
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedBracket(t)}
                    className="px-3 py-2.5 rounded-xl border border-border bg-surface-interactive hover:bg-surface-raised text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Brackets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bracket Modal */}
      <AnimatePresence>
        {selectedBracket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-surface-raised border border-border rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-lg">{selectedBracket.name} — Brackets</h3>
                    <p className="text-xs text-muted-foreground">{selectedBracket.level} • Live Tournament Tree</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBracket(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* Bracket Tree Placeholder */}
              <div className="py-12 px-4 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center bg-surface-base">
                <Sparkles className="w-10 h-10 text-amber-400 mb-2" />
                <h4 className="font-bold text-sm">Bracket Seeding in Progress</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Matchups and seedings will lock 2 hours before official tournament start time. Check back soon for live court assignments!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
