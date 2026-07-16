"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Trophy, Swords, Medal } from 'lucide-react';
import { Match, Team } from '@/lib/tournament/types';
import { calculateRoundRobinStandings } from '@/lib/tournament/standings-service';
import { WinnerModal } from './WinnerModal';
import { TournamentMatch } from './MatchNode';
import { PlayerAvatar } from './PlayerAvatar';

interface RoundRobinViewProps {
  matches: Match[];
  teams: Team[];
  teamType?: 'SINGLES' | 'DOUBLES';
  onMatchWin?: (matchId: string, winnerId: string) => void;
}

// StandingsEntry removed

export function RoundRobinView({ matches, teams, teamType = 'DOUBLES', onMatchWin }: RoundRobinViewProps) {
  const [tab, setTab] = useState<'standings' | 'matches' | 'completed'>('standings');
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);

  // Calculate Standings using official USAP tiebreaker logic
  const standings = useMemo(() => {
    // We pass [] for games since the store currently does not track granular sub-games.
    // The service gracefully falls back to match.winner_id for W/L and Head-to-Head resolving.
    const calculatedStandings = calculateRoundRobinStandings(teams, matches, []);

    const sorted = calculatedStandings.map((standing, idx) => {
      const team = teams.find(t => t.id === standing.team_id)!;
      return {
        team,
        played: standing.wins + standing.losses,
        won: standing.wins,
        lost: standing.losses,
        // If games don't exist, point differential defaults to 0, but wins are correctly tallied
        points: standing.wins * 3 + standing.point_differential,
        rank: idx + 1
      };
    });

    return sorted;
  }, [matches, teams]);

  // Group Matches by Status and Round
  const { activeRounds, completedMatches } = useMemo(() => {
    const activeMap = new Map<number, Match[]>();
    const completed: Match[] = [];

    matches.forEach(m => {
      if (m.status === 'COMPLETED') {
        completed.push(m);
      } else {
        const r = m.round_number || 1;
        if (!activeMap.has(r)) activeMap.set(r, []);
        activeMap.get(r)!.push(m);
      }
    });

    // Sort completed matches by round_number descending (newest at top)
    completed.sort((a, b) => (b.round_number || 0) - (a.round_number || 0));

    return {
      activeRounds: Array.from(activeMap.entries()).sort((a, b) => a[0] - b[0]),
      completedMatches: completed
    };
  }, [matches]);

  // Map a backend Match to a TournamentMatch for the WinnerModal
  const toTournamentMatch = (m: Match): TournamentMatch => {
    const t1 = teams.find(t => t.id === m.team1_id);
    const t2 = teams.find(t => t.id === m.team2_id);
    return {
      id: m.id,
      round: `Round ${m.round_number}`,
      player1: t1 ? { id: t1.id, name: t1.name } : null,
      player2: t2 ? { id: t2.id, name: t2.name } : null,
      winner_id: m.winner_id,
      status: m.status
    };
  };

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-8 max-w-6xl mx-auto overflow-y-auto hide-scrollbar">
      {/* Toggles */}
      <div className="flex items-center gap-4 mb-8 bg-surface-base p-1.5 rounded-xl self-start border border-border shadow-xl">
        <button
          onClick={() => setTab('standings')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            tab === 'standings' ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 shadow-sm border border-emerald-500/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Trophy className="w-4 h-4" />
          Standings
        </button>
        <button
          onClick={() => setTab('matches')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            tab === 'matches' ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 shadow-sm border border-blue-500/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Swords className="w-4 h-4" />
          Matches
        </button>
        <button
          onClick={() => setTab('completed')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
            tab === 'completed' ? "bg-purple-500/10 text-purple-500 dark:text-purple-400 shadow-sm border border-purple-500/20" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Medal className="w-4 h-4" />
          Completed
          {completedMatches.length > 0 && (
            <span className="ml-1.5 bg-purple-500/20 text-purple-400 py-0.5 px-2 rounded-full text-[10px]">
              {completedMatches.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1"
        >
          {tab === 'standings' ? (
            <div className="bg-surface-base/60 backdrop-blur-xl rounded-2xl border border-border/80 overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-surface-overlay text-sm font-medium tracking-tight border-b border-border/80">
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-5">Player / Team</div>
                <div className="col-span-2 text-center">Played</div>
                <div className="col-span-2 text-center">W - L</div>
                <div className="col-span-2 text-center text-emerald-400">Points</div>
              </div>

              <div className="flex flex-col">
                <AnimatePresence>
                  {standings.map((entry, index) => (
                    <motion.div
                      key={entry.team.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      className="grid grid-cols-12 gap-4 px-8 py-5 items-center border-b border-border/50 hover:bg-surface-interactive/40 transition-colors group"
                    >
                      <div className="col-span-1 flex justify-center">
                        {entry.rank === 1 ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <Medal className="w-5 h-5 text-emerald-400" />
                          </div>
                        ) : entry.rank === 2 ? (
                          <div className="w-10 h-10 rounded-full bg-slate-400/10 flex items-center justify-center border border-slate-400/20">
                            <Medal className="w-5 h-5 text-muted-foreground" />
                          </div>
                        ) : entry.rank === 3 ? (
                          <div className="w-10 h-10 rounded-full bg-amber-700/10 flex items-center justify-center border border-amber-700/20">
                            <Medal className="w-5 h-5 text-amber-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-interactive flex items-center justify-center font-black text-muted-foreground text-lg group-hover:text-foreground transition-colors">
                            {entry.rank}
                          </div>
                        )}
                      </div>
                      <div className="col-span-5 flex items-center gap-4">
                        <PlayerAvatar teamName={entry.team.name} teamType={teamType} size="md" />
                        <span className="font-bold text-white text-base tracking-tight">{entry.team.name}</span>
                      </div>
                      <div className="col-span-2 text-center text-muted-foreground font-medium text-lg">
                        {entry.played}
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-2 text-base font-bold">
                        <span className="text-emerald-400 w-4 text-right">{entry.won}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-red-400/90 w-4 text-left">{entry.lost}</span>
                      </div>
                      <div className="col-span-2 text-center text-2xl font-black text-white tracking-tight">
                        {entry.points}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {standings.length === 0 && (
                  <div className="p-12 text-center text-slate-500 font-medium">No standings available.</div>
                )}
              </div>
            </div>
          ) : tab === 'matches' ? (
            <div className="flex flex-col gap-12 pb-24">

              {/* Active Rounds */}
              {activeRounds.map(([roundNum, roundMatches], rIndex) => (
                <motion.div
                  key={`active-round-${roundNum}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rIndex * 0.1 }}
                >
                  <div className="flex items-center gap-6 mb-8">
                    <h3 className="text-2xl font-black text-white tracking-tight">Round {roundNum}</h3>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {roundMatches.map((match) => renderMatchCard(match))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}

              {activeRounds.length === 0 && (
                <div className="text-center p-8 bg-surface-base rounded-2xl border border-border shadow-lg mb-8">
                  <Trophy className="w-12 h-12 text-emerald-400 mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">Check the standings or the Completed tab.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-12 pb-24">
              {/* Completed Matches Section */}
              {completedMatches.length > 0 ? (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="flex items-center gap-6 mb-8 opacity-80">
                    <h3 className="text-xl font-bold text-muted-foreground tracking-tight">Completed Matches</h3>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {completedMatches.map((match) => renderMatchCard(match, true))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center p-8 bg-surface-base rounded-2xl border border-border shadow-lg mt-4">
                  <div className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50 flex items-center justify-center">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-muted-foreground">Finish some matches in the Matches tab first.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <WinnerModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onConfirm={(matchId, winnerId) => {
          if (selectedMatch && onMatchWin && winnerId) {
            onMatchWin(matchId, winnerId);
            setSelectedMatch(null);
          }
        }}
      />
    </div>
  );

  // Helper function to render a Match Card
  function renderMatchCard(match: Match, isCompletedSection = false) {
    const t1 = teams.find(t => t.id === match.team1_id);
    const t2 = teams.find(t => t.id === match.team2_id);
    const isCompleted = match.status === 'COMPLETED';
    const p1Won = isCompleted && match.winner_id === match.team1_id;
    const p2Won = isCompleted && match.winner_id === match.team2_id;
    const isClickable = t1 && t2 && !!onMatchWin;

    return (
      <motion.div
        layout
        layoutId={`match-card-${match.id}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        key={match.id}
        onClick={() => isClickable ? setSelectedMatch(toTournamentMatch(match)) : undefined}
        whileHover={isClickable ? { y: -4, scale: 1.02 } : {}}
        whileTap={isClickable ? { scale: 0.97 } : {}}
        className={cn(
          "bg-surface-base rounded-2xl p-1 border shadow-xl transition-all duration-300",
          isCompletedSection ? "border-border/40 opacity-70 hover:opacity-100" : "border-border/50",
          isClickable && "cursor-pointer hover:border-slate-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
        )}
      >
        <div className="bg-surface-overlay rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden h-full">
          {/* Shimmer sweep effect if it's completed */}
          {isCompletedSection && (
            <motion.div
              animate={{ x: ["-200%", "300%"] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 z-0 pointer-events-none"
            />
          )}

          {/* P1 Row */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors relative z-10",
            p1Won && "bg-emerald-500/10",
            isCompleted && !p1Won && "opacity-40 grayscale"
          )}>
            {p1Won && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
            <PlayerAvatar teamName={t1?.name} teamType={teamType} size="sm" />
            <span className={cn("font-bold truncate flex-1", p1Won ? "text-emerald-400" : "text-white")}>
              {t1?.name || 'TBD'}
            </span>
            {p1Won && <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />}
          </div>

          <div className="w-full h-px bg-border relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-overlay px-3 py-1 rounded-full text-[10px] font-black text-muted-foreground tracking-tight border border-border/80">
              {isCompletedSection ? `R${match.round_number}` : 'VS'}
            </div>
          </div>

          {/* P2 Row */}
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors relative z-10",
            p2Won && "bg-emerald-500/10",
            isCompleted && !p2Won && "opacity-40 grayscale"
          )}>
            {p2Won && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
            <PlayerAvatar teamName={t2?.name} teamType={teamType} size="sm" />
            <span className={cn("font-bold truncate flex-1", p2Won ? "text-emerald-400" : "text-white")}>
              {t2?.name || 'TBD'}
            </span>
            {p2Won && <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />}
          </div>
        </div>
      </motion.div>
    );
  }
}
