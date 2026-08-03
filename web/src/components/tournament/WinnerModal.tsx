"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Check, RotateCcw } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-sync when modal opens
  useEffect(() => {
    if (match) setSelected(match.winner_id || null);
  }, [match]);

  if (!match || !mounted) return null;

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

  return createPortal(
    (
      <AnimatePresence>
        {match && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Glassmorphism Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative bg-[#0B1524]/95 border border-white/15 rounded-[24px] w-full max-w-md shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden z-10 backdrop-blur-2xl"
            >
              {/* Top Accent Gradient Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground" style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
                      {isCompleted ? 'Edit Match Result' : 'Select Winner'}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-400/90 tracking-wide uppercase">
                      {match.round}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Team Selection Options */}
              <div className="px-6 py-5 space-y-3">
                {[match.player1, match.player2].map((player, idx) => {
                  if (!player) return null;
                  const isSelected = selected === player.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => setSelected(player.id)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl border-2 transition-all duration-200 ease-out active:scale-[0.98] relative overflow-hidden group",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-[0_0_24px_rgba(0,217,139,0.2)]"
                          : "border-white/10 bg-white/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                      )}
                    >
                      <PlayerAvatar teamName={player.name} teamType={teamType} size="md" />
                      <div className="flex flex-col text-left flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-wider">
                          Seed #{idx + 1}
                        </span>
                        <span className={cn(
                          "text-[15px] font-bold truncate",
                          isSelected ? "text-emerald-400" : "text-foreground"
                        )}>
                          {player.name}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(0,217,139,0.6)]"
                        >
                          <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-foreground/80 bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!selected || (isCompleted && selected === match.winner_id)}
                    className={cn(
                      "flex-1 py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 relative overflow-hidden group shadow-lg",
                      selected && (!isCompleted || selected !== match.winner_id)
                        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_20px_rgba(0,217,139,0.4)] active:scale-[0.98]"
                        : "bg-white/5 text-foreground/30 border border-white/5 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? 'Update Winner' : 'Confirm Winner'}
                  </button>
                </div>

                {isCompleted && (
                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-red-400/90 hover:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Match Results
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    ),
    document.body
  );
}
