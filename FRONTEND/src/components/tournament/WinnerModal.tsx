import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TournamentMatch } from './MatchNode';
import { PlayerAvatar } from './PlayerAvatar';

interface WinnerModalProps {
  match: TournamentMatch | null;
  teamType?: 'SINGLES' | 'DOUBLES';
  onConfirm: (matchId: string, winnerId: string | null) => void;
  onClose: () => void;
}

export function WinnerModal({ match, teamType = 'DOUBLES', onConfirm, onClose }: WinnerModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // Re-sync when modal opens
  useEffect(() => {
    if (match) setSelected(match.winner_id || null);
  }, [match]);

  if (!match) return null;

  const handleConfirm = () => {
    if (selected && match) {
      onConfirm(match.id, selected);
      onClose();
    }
  };

  const handleReset = () => {
    if (match) {
      onConfirm(match.id, null);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  const isCompleted = match.status === 'COMPLETED';

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="relative bg-surface-base border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{isCompleted ? 'Edit Match Result' : 'Select Winner'}</h3>
                  <p className="text-xs text-muted-foreground">{match.round}</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-interactive transition-colors text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Selection */}
            <div className="px-6 py-4 space-y-3">
              {[match.player1, match.player2].map((player) => {
                if (!player) return null;
                const isSelected = selected === player.id;
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelected(player.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-150 ease-out active:scale-[0.97]",
                      isSelected 
                        ? "border-[#32D74B] bg-[#32D74B]/10 ring-1 ring-[#32D74B]/50 shadow-[0_0_20px_rgba(50,215,75,0.15)]"
                        : "border-border bg-surface-interactive/30 hover:border-border/80 hover:bg-surface-interactive/50"
                    )}
                  >
                    <PlayerAvatar teamName={player.name} teamType={teamType} size="md" />
                    <span className={cn(
                      "text-sm font-semibold flex-1 text-left",
                      isSelected ? "text-foreground" : "text-foreground"
                    )}>
                      {player.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-6 h-6 rounded-full bg-[#32D74B] flex items-center justify-center"
                      >
                        <Check className="w-3.5 h-3.5 text-black" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-2 flex flex-col gap-3">
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={handleClose}
                  className="w-full sm:flex-1 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold text-muted-foreground bg-surface-interactive/50 border border-border hover:bg-surface-interactive transition-colors active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selected || (isCompleted && selected === match.winner_id)}
                  className={cn(
                    "w-full sm:flex-1 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2",
                    selected && (!isCompleted || selected !== match.winner_id)
                      ? "bg-[#32D74B] hover:bg-[#28B33E] text-white shadow-[0_0_20px_rgba(50,215,75,0.3)] active:scale-[0.97]"
                      : "bg-surface-interactive text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isCompleted ? 'Update Winner' : 'Confirm Winner'}
                </button>
              </div>
              
              {isCompleted && (
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                >
                  Reset Match
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
