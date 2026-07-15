"use client";

import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from './PlayerAvatar';
import { Trophy, Star, RotateCcw } from 'lucide-react';

export interface TournamentPlayer {
  id: string;
  name: string;
  avatar?: string;
}

export interface TournamentMatch {
  id: string;
  round: string;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winner_id?: string | null;
  loser_id?: string | null;
  next_match_winner_goes_to?: string | null;
  next_match_loser_goes_to?: string | null;
  status?: string;
  isBye?: boolean;
}

interface MatchNodeProps {
  match: TournamentMatch;
  teamType?: 'SINGLES' | 'DOUBLES';
  onClick?: (match: TournamentMatch) => void;
  onRevert?: (matchId: string) => void;
  showRoundLabel?: boolean;
  animationDelay?: number;
}

export const MatchNode = memo(function MatchNode({
  match,
  teamType = 'DOUBLES',
  onClick,
  onRevert,
  showRoundLabel = true,
  animationDelay = 0
}: MatchNodeProps) {
  const isCompleted = match.status === 'COMPLETED';
  const isCancelled = match.status === 'CANCELLED';
  const isBye = match.isBye || (isCompleted && (!match.player1 || !match.player2));
  const isClickable = !isCancelled && !isBye && match.player1 && match.player2 && !!onClick;

  const p1IsWinner = isCompleted && match.winner_id === match.player1?.id;
  const p2IsWinner = isCompleted && match.winner_id === match.player2?.id;

  const isChampionshipMatch = match.round === 'Grand Final' || match.round === 'If Necessary';
  const isChampion = isCompleted && isChampionshipMatch && match.winner_id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: animationDelay, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col w-[260px] relative group"
    >
      {/* Round Label */}
      {isChampionshipMatch ? (
        <div className="flex items-center justify-center gap-1.5 mb-2 -mt-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/40 blur-[8px] rounded-full" />
            <Trophy className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] relative z-10" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
            Championship
          </span>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/40 blur-[8px] rounded-full" />
            <Star className="w-3.5 h-3.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] relative z-10" />
          </div>
        </div>
      ) : showRoundLabel ? (
        <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600 mb-1.5 px-1 truncate">
          {match.round}
        </div>
      ) : null}

      {/* Match Card */}
      <div
        onClick={isClickable ? () => onClick?.(match) : undefined}
        className={cn(
          "rounded-xl border overflow-hidden transition-all duration-300 ease-out relative",
          isBye ? "border-dashed border-border bg-surface-interactive/30" :
            isCancelled ? "border-border/50 bg-surface-interactive/50 opacity-40" :
              "bg-card",
          isClickable && "cursor-pointer active:scale-[0.97]",
          !isChampion && !isBye && !isCancelled && "border-border hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.08)]",
          isChampion && "border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50"
        )}
      >
        {/* Undo Button for Completed Matches */}
        {isCompleted && !isBye && onRevert && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRevert(match.id);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-surface-base/80 hover:bg-red-500/20 border border-border hover:border-red-500/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-red-500 dark:hover:text-red-400 backdrop-blur-sm"
            title="Revert Match Result"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Player 1 Row */}
        <TeamRow
          player={match.player1}
          isWinner={p1IsWinner}
          isLoser={isCompleted && !p1IsWinner && !!match.player1}
          isBye={isBye && !match.player1}
          teamType={teamType}
          isChampion={!!(isChampion && p1IsWinner)}
        />

        <div className={cn(
          "h-px mx-3",
          isChampion ? "bg-amber-500/20" : "bg-border/60"
        )} />

        {/* Player 2 Row */}
        <TeamRow
          player={match.player2}
          isWinner={p2IsWinner}
          isLoser={isCompleted && !p2IsWinner && !!match.player2}
          isBye={isBye && !match.player2}
          teamType={teamType}
          isChampion={!!(isChampion && p2IsWinner)}
        />
      </div>
    </motion.div>
  );
}, (prev, next) => {
  // Deep equality check for React.memo to prevent massive DOM lag
  if (prev.teamType !== next.teamType) return false;
  if (prev.showRoundLabel !== next.showRoundLabel) return false;

  const m1 = prev.match;
  const m2 = next.match;
  if (m1.id !== m2.id) return false;
  if (m1.status !== m2.status) return false;
  if (m1.winner_id !== m2.winner_id) return false;
  if (m1.loser_id !== m2.loser_id) return false;
  if (m1.round !== m2.round) return false;
  if (m1.player1?.id !== m2.player1?.id) return false;
  if (m1.player2?.id !== m2.player2?.id) return false;
  if (m1.player1?.name !== m2.player1?.name) return false;
  if (m1.player2?.name !== m2.player2?.name) return false;

  return true;
});

function TeamRow({
  player,
  isWinner,
  isLoser,
  isBye,
  teamType,
  isChampion,
}: {
  player: TournamentPlayer | null;
  isWinner: boolean;
  isLoser: boolean;
  isBye: boolean;
  teamType: 'SINGLES' | 'DOUBLES';
  isChampion?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 transition-all relative",
        isWinner && !isChampion && "bg-[#32D74B]/8",
        isChampion && "bg-gradient-to-r from-amber-500/10 to-amber-500/5",
        isLoser && "opacity-35 grayscale"
      )}
    >
      {/* Winner indicator bar */}
      {isWinner && !isChampion && (
        <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-[#32D74B] shadow-[0_0_8px_rgba(50,215,75,0.5)]" />
      )}
      {isChampion && (
        <div className="absolute left-0 top-1 bottom-1 w-[4px] rounded-r-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
      )}

      <PlayerAvatar teamName={player?.name} teamType={teamType} size="sm" />

      <span className={cn(
        "text-[13px] font-semibold truncate flex-1",
        isBye ? "text-muted-foreground italic text-[11px] tracking-wide" :
          !player ? "text-muted-foreground italic" :
            isChampion ? "text-amber-500 dark:text-amber-400 drop-shadow-sm" :
              isWinner ? "text-[#16A34A] dark:text-[#32D74B]" :
                "text-foreground"
      )}>
        {isBye ? 'BYE' : (player ? player.name : 'TBD')}
      </span>
    </div>
  );
}
