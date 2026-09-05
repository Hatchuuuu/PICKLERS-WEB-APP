"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Calendar, Users, Award, Search, Check, Sparkles, UserPlus, X, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { DEMO_TOURNAMENTS } from "@/lib/demoData";

interface Tournament {
  id: string;
  name: string;
  level?: string;
  status?: string;
  date?: string;
  participants?: number;
  max_teams?: number;
  prize_pool?: number | string;
  location?: string;
  description?: string;
}

export default function PlayerTournamentsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");
  const [search, setSearch] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());
  const [selectedBracket, setSelectedBracket] = useState<Tournament | null>(null);
  const [registeringTournament, setRegisteringTournament] = useState<Tournament | null>(null);
  
  // Registration form modal state
  const [teamName, setTeamName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [playerLevel, setPlayerLevel] = useState("2.5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from("tournaments")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const formatted: Tournament[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            level: t.level || "All Levels",
            status: (t.status || "upcoming").toLowerCase(),
            date: t.date || (t.start_date ? new Date(t.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Upcoming"),
            participants: t.participants || 16,
            max_teams: t.max_teams || 32,
            prize_pool: t.prize_pool || "₱25,000",
            location: t.location || "Metro Manila",
            description: t.description || "",
          }));
          setTournaments(formatted);
        } else {
          setTournaments(DEMO_TOURNAMENTS as any[]);
        }

        // Fetch user's registrations
        if (user?.id) {
          const { data: regData } = await supabase
            .from("tournament_registrations")
            .select("tournament_id")
            .eq("user_id", user.id);

          if (regData && regData.length > 0) {
            setRegisteredIds(new Set(regData.map((r: any) => r.tournament_id)));
          }
        }
      } else {
        setTournaments(DEMO_TOURNAMENTS as any[]);
      }
    } catch (err) {
      console.warn("[Tournaments] Fetch fallback to demo:", err);
      setTournaments(DEMO_TOURNAMENTS as any[]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const filtered = tournaments.filter((t) => {
    const matchesTab = tab === "all" || t.status?.toLowerCase() === tab;
    const matchesSearch =
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.level?.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  async function handleConfirmRegistration(e: React.FormEvent) {
    e.preventDefault();
    if (!registeringTournament) return;
    if (!teamName.trim()) {
      showToast("Please enter a team name", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tournaments/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: registeringTournament.id,
          teamName: teamName.trim(),
          partnerName: partnerName.trim() || undefined,
          playerLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegisteredIds((prev) => new Set(prev).add(registeringTournament.id));
      showToast(`Team '${teamName}' registered for ${registeringTournament.name}! 🏆`, "success");
      setRegisteringTournament(null);
      setTeamName("");
      setPartnerName("");
    } catch (err: any) {
      console.error("[Tournament Reg] Error:", err);
      showToast(err.message || "Failed to register", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] md:text-[34px] font-extrabold tracking-tight leading-none mb-1.5 flex items-center gap-3 text-foreground">
            Tournaments
            <Trophy className="w-7 h-7 text-amber-500" />
          </h1>
          <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
            Browse official tournaments, sign up with your team, and track live tournament brackets.
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-surface-base border border-border space-y-4">
              <div className="h-5 w-24 bg-surface-interactive rounded-full" />
              <div className="h-6 w-3/4 bg-surface-interactive rounded" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-surface-interactive rounded" />
                <div className="h-4 w-2/3 bg-surface-interactive rounded" />
              </div>
              <div className="h-10 w-full bg-surface-interactive rounded-xl pt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
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
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {t.level || "All Levels"}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      t.status === "ongoing" || t.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}>
                      {t.status || "Upcoming"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                    {t.name}
                  </h3>

                  <div className="space-y-2 text-xs text-muted-foreground mb-5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{t.date || "Upcoming"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Participants: <strong className="text-foreground">{t.participants || 16} / {t.max_teams || 32} Teams</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Prize Pool: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{typeof t.prize_pool === "number" ? `₱${t.prize_pool.toLocaleString()}` : t.prize_pool}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isReg) {
                        showToast(`You are already registered for '${t.name}'.`, "success");
                        return;
                      }
                      setRegisteringTournament(t);
                    }}
                    disabled={isReg}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                      isReg
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {isReg ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Registered
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Register Team
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBracket(t)}
                    className="px-3 py-2.5 rounded-xl border border-border bg-surface-interactive hover:bg-surface-raised text-xs font-semibold transition-colors flex items-center gap-1 text-foreground"
                  >
                    Brackets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      <AnimatePresence>
        {registeringTournament && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden z-[610]"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Register for Tournament</h3>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">{registeringTournament.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRegisteringTournament(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-colors cursor-pointer"
                  aria-label="Close registration modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manila Smashers"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Partner / Teammate Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Reyes"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Skill Level
                  </label>
                  <select
                    value={playerLevel}
                    onChange={(e) => setPlayerLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-interactive text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {["2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5+"].map((lvl) => (
                      <option key={lvl} value={lvl}>DUPR {lvl}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRegisteringTournament(null)}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-surface-interactive text-foreground text-xs font-semibold hover:bg-surface-interactive/80 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering...
                      </>
                    ) : (
                      "Confirm Entry"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bracket Modal */}
      <AnimatePresence>
        {selectedBracket && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] dark:bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-surface-overlay dark:bg-[#13223F] border border-border dark:border-white/12 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden text-foreground z-[610]"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-lg">{selectedBracket.name} — Brackets</h3>
                    <p className="text-xs text-muted-foreground">{selectedBracket.level} • Live Tournament Tree</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBracket(null)}
                  className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-colors cursor-pointer"
                  aria-label="Close brackets modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bracket Tree */}
              <div className="py-12 px-4 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center bg-surface-interactive">
                <Sparkles className="w-10 h-10 text-amber-500 mb-2" />
                <h4 className="font-bold text-sm">Bracket Seeding in Progress</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Matchups and seedings lock 2 hours before official tournament start time. Check back soon for live court assignments!
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
