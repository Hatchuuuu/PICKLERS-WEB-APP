import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import { TournamentPlayer } from '@/lib/tournament/types';
import { PlayerAvatar } from './PlayerAvatar';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface ChampionshipCelebrationProps {
  champion: TournamentPlayer | null;
  tournamentName: string;
  onDismiss: () => void;
}

export function ChampionshipCelebration({ champion, tournamentName, onDismiss }: ChampionshipCelebrationProps) {
  useEffect(() => {
    if (champion) {
      const duration = 8000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [champion]);

  if (!champion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(40px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80"
    >
      {/* Dismiss Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        onClick={onDismiss}
        className="absolute top-8 right-8 z-50 p-3 rounded-full bg-surface-overlay/50 hover:bg-surface-interactive/80 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-6 h-6" />
      </motion.button>

      <div className="relative z-20 flex flex-col items-center max-w-3xl w-full px-6 text-center">
        {/* Top Trophy Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="mb-8 p-6 rounded-full bg-amber-500/20 shadow-[0_0_80px_rgba(245,158,11,0.3)] border border-amber-500/30"
        >
          <Trophy className="w-16 h-16 text-amber-500" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          className="mb-2"
        >
          <h2 className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm sm:text-base">
            Champion of {tournamentName}
          </h2>
        </motion.div>

        {/* Champion Name */}
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.6 }}
          className="relative mb-12"
        >
          {/* Subtle text glow */}
          <div className="absolute -inset-x-10 inset-y-0 bg-emerald-500/20 blur-[80px] rounded-full" />
          <h1 className="relative text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-2xl">
            {champion.name}
          </h1>
        </motion.div>

        {/* Avatar Display */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.9 }}
          className="relative"
        >
          <div className="absolute -inset-10 bg-emerald-500/30 blur-3xl rounded-full" />
          <div className="relative p-4 rounded-full bg-surface-base/80 border border-border shadow-2xl backdrop-blur-sm">
            <PlayerAvatar teamName={champion.name} teamType="DOUBLES" size="xl" />
          </div>
        </motion.div>

        {/* Return Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          onClick={onDismiss}
          className="mt-16 px-8 py-3.5 bg-surface-interactive hover:bg-border border border-border rounded-full text-sm font-semibold tracking-wide text-foreground transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          Return to Bracket
        </motion.button>
      </div>
    </motion.div>
  );
}
