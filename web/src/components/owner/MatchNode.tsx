"use client";

import { useTournamentStore } from '@/store/useTournamentStore';
import { motion } from 'motion/react';

export function MatchNode({ matchId, onMatchClick }: { matchId: string, onMatchClick?: (matchId: string) => void }) {
  const match = useTournamentStore(state => state.getMatch(matchId));
  const getTeam = useTournamentStore(state => state.getTeam);

  if (!match) return null;

  const team1 = getTeam(match.team1_id);
  const team2 = getTeam(match.team2_id);

  const isPlayable = match.status === 'PENDING' && team1 && team2;
  const isCompleted = match.status === 'COMPLETED';
  const isClickable = isPlayable || isCompleted;
  const isChampionship = match.bracket_type === 'FINAL' || match.bracket_type === 'TIEBREAKER';

  const handleMatchClick = () => {
    if (!isClickable) return;
    if (onMatchClick) onMatchClick(match.id);
  };

  return (
    <motion.div 
      onClick={handleMatchClick}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      className={`w-48 rounded-md shadow-sm overflow-hidden flex flex-col text-sm border transition-all duration-300 relative group 
          ${isClickable ? 'cursor-pointer hover:border-primary/80' : 'opacity-90'} 
          ${isChampionship ? 'bg-background/95 backdrop-blur-md border-amber-400/70 shadow-amber-500/20 shadow-lg' : isPlayable ? 'bg-card/90 backdrop-blur-sm border-primary/50' : 'bg-card/90 backdrop-blur-sm border-border'}`}
      style={{
          boxShadow: isChampionship ? '0 0 15px rgba(251, 191, 36, 0.2), inset 0 0 0 1px rgba(251, 191, 36, 0.4)' : 
                     isPlayable ? 'inset 0 0 0 1px rgba(34, 197, 94, 0.15)' : undefined
      }}
    >
      {/* Subtle entrance shimmer for playable matches */}
      {isPlayable && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          />
      )}

      <div className={`px-2 py-1 text-[10px] font-semibold flex justify-between z-10 relative ${isChampionship ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
          <span className="flex items-center gap-1">
              {isChampionship && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
              {isChampionship ? 'Championship' : `Match ${match.match_sequence}`}
          </span>
          <span className={isPlayable ? (isChampionship ? 'text-amber-600' : 'text-primary') : ''}>{match.status}</span>
      </div>

      {/* Team 1 Row */}
      <motion.div 
          className={`px-3 py-2 border-b border-border flex justify-between items-center z-10 relative
            ${match.winner_id === team1?.id ? 'bg-primary/10 font-bold text-primary' : ''}
          `}
          animate={{
              opacity: (isCompleted && match.winner_id !== team1?.id) ? 0.4 : 1,
              filter: (isCompleted && match.winner_id !== team1?.id) ? 'grayscale(100%)' : 'grayscale(0%)'
          }}
      >
          <span className="truncate">{team1 ? team1.name : 'TBD'}</span>
          {match.winner_id === team1?.id && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">✓</motion.span>
          )}
      </motion.div>

      {/* Team 2 Row */}
      <motion.div 
          className={`px-3 py-2 flex justify-between items-center z-10 relative
            ${match.winner_id === team2?.id ? 'bg-primary/10 font-bold text-primary' : ''}
          `}
          animate={{
              opacity: (isCompleted && match.winner_id !== team2?.id) ? 0.4 : 1,
              filter: (isCompleted && match.winner_id !== team2?.id) ? 'grayscale(100%)' : 'grayscale(0%)'
          }}
      >
          <span className="truncate">{team2 ? team2.name : 'TBD'}</span>
          {match.winner_id === team2?.id && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">✓</motion.span>
          )}
      </motion.div>
    </motion.div>
  );
}
