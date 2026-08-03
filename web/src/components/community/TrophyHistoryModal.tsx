"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Calendar, MapPin, Users, Award } from "lucide-react";
import type { CommunityPlayer } from "@/types";

import { DEMO_COMMUNITY_PLAYERS } from "@/lib/demoData";

export interface TrophyRecord {
  id: string;
  tournamentName: string;
  division: string;
  type: "gold" | "silver" | "bronze";
  date: string;
  location: string;
  partner?: string;
  partnerId?: string;
}

interface TrophyHistoryModalProps {
  initialMedal?: "all" | "gold" | "silver" | "bronze";
  player: CommunityPlayer;
  onClose: () => void;
  onSelectPlayer?: (playerId: string) => void;
}

// Generate realistic trophy achievement records for demo players
function generateMockTrophies(player: CommunityPlayer): TrophyRecord[] {
  const goldCount = player.gold || 0;
  const silverCount = player.silver || 0;
  const bronzeCount = player.bronze || 0;

  const sampleTournaments = [
    { name: "Metro Manila Open Championship 2026", location: "Metro Smashers Hub, BGC", partner: "Sarah Williams", partnerId: "demo_p2" },
    { name: "BGC Summer Doubles Invitational", location: "Bonifacio Pickleball Club", partner: "Maria Santos", partnerId: "demo_p2" },
    { name: "Taguig Pickleball Masters Cup", location: "Taguig Sports Complex", partner: "Liza Soberano", partnerId: "demo_p4" },
    { name: "Picklers National Club Championship", location: "Picklers Central Arena", partner: "Paolo Avelino", partnerId: "demo_p5" },
    { name: "Philippine Pickleball League - Season 4", location: "Metro Smashers Hub, BGC", partner: "Anne Curtis", partnerId: "demo_p8" },
    { name: "High Stakes Open Play Tournament", location: "Makati Court Arena", partner: "Carlos Reyes", partnerId: "demo_p3" },
    { name: "Capital City Pickleball Showdown", location: "Quezon City Pickleball Hub", partner: "Dingdong Dantes", partnerId: "demo_p7" },
  ];

  const divisions = [
    "Men's Doubles 4.0+",
    "Mixed Doubles Open",
    "Men's Singles Advanced",
    "Open Doubles Championship",
    "DPR Skill Level 3.5 - 4.5",
  ];

  const dates = [
    "August 2026",
    "July 2026",
    "June 2026",
    "May 2026",
    "April 2026",
    "March 2026",
    "February 2026",
    "January 2026",
  ];

  const trophies: TrophyRecord[] = [];
  let idCounter = 1;

  // Add Gold entries
  for (let i = 0; i < goldCount; i++) {
    const tourney = sampleTournaments[i % sampleTournaments.length];
    // Find partnerId from DEMO_COMMUNITY_PLAYERS
    const foundPartner = DEMO_COMMUNITY_PLAYERS.find(p => p.name === tourney.partner);
    trophies.push({
      id: `gold-${idCounter++}`,
      tournamentName: tourney.name,
      division: divisions[i % divisions.length],
      type: "gold",
      date: dates[i % dates.length],
      location: tourney.location,
      partner: tourney.partner,
      partnerId: foundPartner?.id || tourney.partnerId,
    });
  }

  // Add Silver entries
  for (let i = 0; i < silverCount; i++) {
    const tourney = sampleTournaments[(i + 2) % sampleTournaments.length];
    const foundPartner = DEMO_COMMUNITY_PLAYERS.find(p => p.name === tourney.partner);
    trophies.push({
      id: `silver-${idCounter++}`,
      tournamentName: tourney.name,
      division: divisions[(i + 1) % divisions.length],
      type: "silver",
      date: dates[(i + 1) % dates.length],
      location: tourney.location,
      partner: tourney.partner,
      partnerId: foundPartner?.id || tourney.partnerId,
    });
  }

  // Add Bronze entries
  for (let i = 0; i < bronzeCount; i++) {
    const tourney = sampleTournaments[(i + 4) % sampleTournaments.length];
    const foundPartner = DEMO_COMMUNITY_PLAYERS.find(p => p.name === tourney.partner);
    trophies.push({
      id: `bronze-${idCounter++}`,
      tournamentName: tourney.name,
      division: divisions[(i + 2) % divisions.length],
      type: "bronze",
      date: dates[(i + 3) % dates.length],
      location: tourney.location,
      partner: tourney.partner,
      partnerId: foundPartner?.id || tourney.partnerId,
    });
  }

  return trophies;
}

export default function TrophyHistoryModal({
  initialMedal = "all",
  player,
  onClose,
  onSelectPlayer,
}: TrophyHistoryModalProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "gold" | "silver" | "bronze">(initialMedal);

  const trophies = useMemo(() => generateMockTrophies(player), [player]);

  const filteredTrophies = trophies.filter(
    (t) => activeFilter === "all" || t.type === activeFilter
  );

  const goldCount = trophies.filter((t) => t.type === "gold").length;
  const silverCount = trophies.filter((t) => t.type === "silver").length;
  const bronzeCount = trophies.filter((t) => t.type === "bronze").length;

  return (
    <AnimatePresence>
      <motion.div
        key="trophy-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150]"
      />
      <motion.div
        key="trophy-modal-content"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:max-w-[460px] md:mx-auto h-[80vh] md:h-[600px] bg-background/95 dark:bg-[#0d1527]/95 backdrop-blur-2xl rounded-t-[32px] md:rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.8)] z-[160] border border-white/20 dark:border-white/[0.15] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-interactive/30 dark:bg-white/[0.04] backdrop-blur-md z-10 p-4 px-5 border-b border-border/40 dark:border-white/[0.1] flex justify-between items-center shrink-0">
          <div className="w-12 h-1 bg-white/20 rounded-full absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" />
            <h3
              className="text-base font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
            >
              {player.name}&apos;s Trophies
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 dark:bg-white/15 hover:bg-black/40 dark:hover:bg-white/30 active:scale-90 transition-all text-foreground flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1.5 mx-5 mt-4 rounded-xl bg-surface-interactive/40 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.08] shrink-0">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeFilter === "all"
                ? "bg-emerald-500 text-slate-950 shadow-[0_2px_10px_rgba(0,217,139,0.3)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {trophies.length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("gold")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeFilter === "gold"
                ? "bg-amber-400 text-slate-950 shadow-[0_2px_10px_rgba(251,191,36,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Gold</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {goldCount}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("silver")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeFilter === "silver"
                ? "bg-slate-200 text-slate-950 shadow-[0_2px_10px_rgba(226,232,240,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Silver</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {silverCount}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter("bronze")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 ${
              activeFilter === "bronze"
                ? "bg-amber-600 text-white shadow-[0_2px_10px_rgba(217,119,6,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Bronze</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 font-bold">
              {bronzeCount}
            </span>
          </button>
        </div>

        {/* Trophy History Scroll Container */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 hide-scrollbar">
          {filteredTrophies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-interactive/40 dark:bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-muted-foreground">
                <Award className="w-7 h-7 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-foreground">No {activeFilter} trophies yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Participate in tournament events to earn trophies!
              </p>
            </div>
          ) : (
            filteredTrophies.map((t, i) => {
              const isGold = t.type === "gold";
              const isSilver = t.type === "silver";

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03 }}
                  className="p-4 rounded-2xl bg-surface-interactive/30 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Top Row: Tournament Title + Placement Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-sm font-extrabold text-foreground leading-snug line-clamp-1"
                        style={{ fontFamily: "var(--font-outfit), var(--font-montserrat), sans-serif" }}
                      >
                        {t.tournamentName}
                      </h4>
                      <span className="text-[11.5px] font-bold text-emerald-400">
                        {t.division}
                      </span>
                    </div>

                    {/* Medal Placement Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shrink-0 border shadow-sm ${
                        isGold
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : isSilver
                          ? "bg-slate-300/15 border-slate-300/30 text-slate-200"
                          : "bg-amber-600/15 border-amber-600/30 text-amber-500"
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isGold ? "1st Place" : isSilver ? "2nd Place" : "3rd Place"}</span>
                    </div>
                  </div>

                  {/* Metadata Rows: Location, Date & Partner */}
                  <div className="flex flex-col gap-1 text-[11.5px] text-muted-foreground pt-1 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{t.location}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>{t.date}</span>
                      </div>
                      {t.partner && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            if (t.partnerId && onSelectPlayer) {
                              onSelectPlayer(t.partnerId);
                            }
                          }}
                          className="flex items-center gap-1.5 font-bold text-foreground hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer active:scale-95 px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 shadow-sm"
                        >
                          <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>w/ {t.partner}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
