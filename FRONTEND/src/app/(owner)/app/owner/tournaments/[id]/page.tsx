"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { ArrowLeft, ZoomIn, ZoomOut, Maximize, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { mapToBracketTree } from '@/lib/tournament/bracket-mapper';
import { processMatchResult } from '@/lib/tournament/bracket-state';

import { BracketCanvas } from '@/components/tournament/BracketCanvas';
import { BracketSkeleton } from '@/components/tournament/BracketSkeleton';
import { RoundRobinView } from '@/components/tournament/RoundRobinView';
import { ChampionshipCelebration } from '@/components/tournament/ChampionshipCelebration';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import { useTournamentStore } from '@/store/useTournamentStore';
import { TournamentAPI } from '@/lib/tournament/tournament-api';

type Format = 'SINGLE' | 'DOUBLE' | 'ROUND_ROBIN';

export default function OwnerBracket() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  
  const getTournament = useTournamentStore(state => state.tournaments.find(t => t.id === id));
  const storeTeams = useTournamentStore(state => state.teams);
  const storeMatches = useTournamentStore(state => state.matches);

  const [format, setFormat] = useState<Format>('DOUBLE');
  const [teamType, setTeamType] = useState<'SINGLES' | 'DOUBLES'>('DOUBLES');
  const [teamCount, setTeamCount] = useState<number>(8);
  const [tournamentName, setTournamentName] = useState<string>("Loading...");
  const [isInitializing, setIsInitializing] = useState(true);

  // Read directly from store
  const teams = useMemo(() => storeTeams.filter(t => t.tournament_id === id), [storeTeams, id]);
  const matches = useMemo(() => storeMatches.filter(m => m.tournament_id === id), [storeMatches, id]);

  // Simulate network fetching for skeleton load
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (id && getTournament) {
      setTournamentName(getTournament.name);
      setTeamCount(getTournament.teams || getTournament.maxTeams || 8);
      
      const formatStr = getTournament.format.toLowerCase();
      if (formatStr.includes('round_robin')) setFormat('ROUND_ROBIN');
      else if (formatStr.includes('double')) setFormat('DOUBLE');
      else setFormat('SINGLE');

      setTeamType(getTournament.play_type === 'singles' ? 'SINGLES' : 'DOUBLES');
    }
  }, [id, getTournament]);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      const t = useTournamentStore.getState().teams.filter(team => team.tournament_id === id);
      const m = useTournamentStore.getState().matches.filter(match => match.tournament_id === id);
      
      if (t.length === 0 || m.length === 0) {
        // Fallback: If page was refreshed, store is empty. Fetch from DB.
        TournamentAPI.getTournamentData(id).then(data => {
            if (isMounted && data) {
                useTournamentStore.setState(state => ({
                    teams: [...state.teams.filter(st => st.tournament_id !== id), ...(data.teams || [])],
                    matches: [...state.matches.filter(sm => sm.tournament_id !== id), ...(data.matches || [])]
                }));
                if (!useTournamentStore.getState().tournaments.find(t => t.id === id) && data.tournament) {
                    setTournamentName(data.tournament.name);
                    setTeamCount(data.tournament.teams_count || data.tournament.maxTeams || 8);
                    const formatStr = data.tournament.format.toLowerCase();
                    if (formatStr.includes('round_robin')) setFormat('ROUND_ROBIN');
                    else if (formatStr.includes('double')) setFormat('DOUBLE');
                    else setFormat('SINGLE');
                    setTeamType(data.tournament.play_type === 'singles' ? 'SINGLES' : 'DOUBLES');
                }
            }
        }).catch(err => console.error("Failed to load tournament data:", err));
      }
    }
    return () => { isMounted = false; };
  }, [id]);

  const { winnersRounds, losersRounds, grandFinalRounds } = useMemo(() => {
    return mapToBracketTree(matches, teams);
  }, [matches, teams]);

  const { awardMedals } = useApp();

  const tournamentMedalists = useMemo(() => {
    let goldId = null;
    let silverId = null;
    let bronzeId = null;

    if (format === 'SINGLE') {
      const finalMatch = matches.find(m => m.bracket_type === 'FINAL');
      const bronzeMatch = matches.find(m => m.bracket_type === '3RD_PLACE');
      
      if (finalMatch?.status === 'COMPLETED' && finalMatch.winner_id) {
        goldId = finalMatch.winner_id;
        silverId = finalMatch.winner_id === finalMatch.team1_id ? finalMatch.team2_id : finalMatch.team1_id;
      }
      if (bronzeMatch?.status === 'COMPLETED' && bronzeMatch.winner_id) {
        bronzeId = bronzeMatch.winner_id;
      }
    } else if (format === 'DOUBLE') {
      const finalMatches = matches.filter(m => m.bracket_type === 'FINAL' || m.bracket_type === 'TIEBREAKER');
      const lastFinal = finalMatches.sort((a,b) => b.round_number - a.round_number)[0];
      const maxLRound = Math.max(...matches.filter(m => m.bracket_type === 'LOSER').map(m => m.round_number));
      const losersFinal = matches.find(m => m.bracket_type === 'LOSER' && m.round_number === maxLRound);

      if (lastFinal?.status === 'COMPLETED' && lastFinal.winner_id) {
        goldId = lastFinal.winner_id;
        silverId = lastFinal.winner_id === lastFinal.team1_id ? lastFinal.team2_id : lastFinal.team1_id;
      }
      // Loser of Loser's Final gets Bronze
      if (losersFinal?.status === 'COMPLETED' && losersFinal.winner_id) {
        bronzeId = losersFinal.winner_id === losersFinal.team1_id ? losersFinal.team2_id : losersFinal.team1_id;
      }
    }
    
    const getTeamName = (id: string | null) => teams.find(t => t.id === id)?.name || null;
    return {
      gold: getTeamName(goldId),
      silver: getTeamName(silverId),
      bronze: getTeamName(bronzeId),
      isComplete: !!goldId // For now, if we have gold we consider it complete
    };
  }, [matches, format, teams]);

  const champion = useMemo(() => {
    if (tournamentMedalists.gold) {
       return { id: tournamentMedalists.gold, name: tournamentMedalists.gold };
    }
    return null;
  }, [tournamentMedalists.gold]);

  const [showCelebration, setShowCelebration] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    if (champion && !hasCelebrated) {
      setShowCelebration(true);
      setHasCelebrated(true);
      
      // Award medals to global player profiles
      if (tournamentMedalists.gold && tournamentMedalists.silver && tournamentMedalists.bronze) {
        awardMedals(tournamentMedalists.gold, tournamentMedalists.silver, tournamentMedalists.bronze);
      }
    } else if (!champion) {
      setHasCelebrated(false);
    }
  }, [champion, hasCelebrated, tournamentMedalists, awardMedals]);

  const handleMatchWin = (matchId: string, winnerId: string | null) => {
    const newMatches = processMatchResult(matches, matchId, winnerId);
    useTournamentStore.setState(state => {
      const otherMatches = state.matches.filter(m => m.tournament_id !== id);
      return { matches: [...otherMatches, ...newMatches] };
    });
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[100dvh] sm:h-screen overflow-hidden bg-background text-foreground font-sans">

        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border shrink-0">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/app/owner/tournaments')}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="h-4 w-px bg-border shrink-0" />
            <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">{tournamentName}</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-tight text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full shrink-0">
              Active
            </span>
          </div>

          {/* Right: Read-only format info */}
          <div className="flex items-center gap-3 shrink-0 hidden sm:flex">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-interactive/50 border border-border text-xs font-semibold text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Winners Bracket</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-interactive/50 border border-border text-xs font-semibold text-muted-foreground">
              <Trophy className="w-3.5 h-3.5 text-red-400" />
              <span>Losers Bracket</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-interactive/50 border border-border text-xs font-semibold text-muted-foreground">
              {teamCount} Teams
            </div>
          </div>
        </header>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${format}-${teamCount}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0"
            >
              {isInitializing ? (
                <BracketSkeleton />
              ) : format === 'ROUND_ROBIN' ? (
                <RoundRobinView
                  matches={matches}
                  teams={teams}
                  teamType={teamType}
                  onMatchWin={handleMatchWin}
                />
              ) : (
                <TransformWrapper
                  initialScale={teamCount >= 12 ? 0.55 : 0.75}
                  minScale={0.1}
                  maxScale={2.5}
                  centerOnInit={true}
                  wheel={{ step: 0.08 }}
                  limitToBounds={false}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      {/* Zoom Controls */}
                      <div className="absolute top-3 right-3 z-50 flex flex-col gap-1.5 bg-surface-overlay/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-border/60 shadow-xl">
                        <button onClick={() => zoomIn()} className="p-1.5 hover:bg-surface-interactive rounded-lg transition-colors text-foreground" title="Zoom In">
                          <ZoomIn className="w-5 h-5" />
                        </button>
                        <button onClick={() => zoomOut()} className="p-1.5 hover:bg-surface-interactive rounded-lg transition-colors text-foreground" title="Zoom Out">
                          <ZoomOut className="w-5 h-5" />
                        </button>
                        <div className="w-full h-px bg-border" />
                        <button onClick={() => resetTransform()} className="p-1.5 hover:bg-surface-interactive rounded-lg transition-colors text-foreground" title="Reset View">
                          <Maximize className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      {/* Format/Team Info Pill */}
                      <div className="absolute top-3 left-3 z-50 flex items-center gap-2 bg-surface-overlay/80 dark:bg-slate-900/80 backdrop-blur-md border border-border/60 rounded-full px-3 py-1.5 shadow-xl text-foreground">
                        <span className="text-[10px] font-bold text-slate-500 tracking-tight">
                          {format === 'DOUBLE' ? 'Double Elim' : 'Single Elim'} · {teamCount} Teams · {teamType === 'DOUBLES' ? '2v2' : '1v1'}
                        </span>
                      </div>

                      <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-auto !h-auto p-16">
                        <BracketCanvas
                          winnersRounds={winnersRounds}
                          losersRounds={losersRounds}
                          grandFinalRounds={grandFinalRounds}
                          teamType={teamType}
                          onMatchWin={handleMatchWin}
                        />
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Championship Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && champion && (
            <ChampionshipCelebration
              champion={champion}
              tournamentName={tournamentName}
              onDismiss={() => setShowCelebration(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
