"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTournamentStore } from '@/store/useTournamentStore';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '@/lib/tournament/types';

export function MatchResolutionModal({ 
    matchId, 
    isOpen, 
    onClose 
}: { 
    matchId: string | null; 
    isOpen: boolean; 
    onClose: () => void; 
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const match = useTournamentStore(state => state.getMatch(matchId || ''));
    const tournaments = useTournamentStore(state => state.tournaments);
    const tournament = tournaments.find(t => t.id === match?.tournament_id);
    const scoringFormat = tournament?.scoring_format || 'BEST_OF_3_TO_11';
    
    const numGames = scoringFormat.startsWith('SINGLE_GAME') ? 1 : 3;

    const getTeam = useTournamentStore(state => state.getTeam);
    const submitScore = useTournamentStore(state => state.submitScore);
    const undoMatchResult = useTournamentStore(state => state.undoMatchResult);

    const [games, setGames] = useState<Partial<Game>[]>(
        Array.from({ length: numGames }, (_, i) => ({ game_number: i + 1 }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setGames(Array.from({ length: numGames }, (_, i) => ({ game_number: i + 1 })));
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, numGames]);

    if (!isOpen || !match || !mounted) return null;

    const team1 = getTeam(match.team1_id);
    const team2 = getTeam(match.team2_id);
    const isEditMode = match.status === 'COMPLETED';

    const handleScoreChange = (gameIndex: number, team: 1 | 2, value: string) => {
        const parsed = value === '' ? undefined : parseInt(value);
        if (value !== '' && (isNaN(parsed!) || parsed! < 0 || parsed! > 99)) return;

        setGames(prev => {
            const next = [...prev];
            if (team === 1) next[gameIndex].team1_score = parsed;
            else next[gameIndex].team2_score = parsed;
            return next;
        });
        setError(null);
    };

    const handleConfirm = () => {
        if (!team1 || !team2) return;
        setIsSubmitting(true);
        setError(null);
        
        // Filter out empty games
        const validGames = games.filter(g => g.team1_score !== undefined && g.team2_score !== undefined) as Game[];
        
        if (validGames.length === 0) {
            setError("Please enter at least one valid game score.");
            setIsSubmitting(false);
            return;
        }

        // Add IDs and match_id
        const submissionGames = validGames.map((g, i) => ({
            ...g,
            id: Date.now().toString() + i,
            match_id: match.id,
        }));

        setTimeout(() => {
            try {
                submitScore(match.id, submissionGames);
                handleClose();
            } catch (e: unknown) {
                const err = e as Error;
                setError(err.message || "Failed to submit score. USAP rules require a win by 2 margin.");
            } finally {
                setIsSubmitting(false);
            }
        }, 400);
    };

    const handleUndo = () => {
        undoMatchResult(match.id);
        handleClose();
    };

    const handleClose = () => {
        onClose();
    };

    const isLocked = !team1 || !team2;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/50"
                    onClick={handleClose}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative bg-surface-overlay dark:bg-[#13223F] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] border border-border dark:border-white/12 w-full max-w-lg overflow-hidden flex flex-col z-10 text-foreground"
                >
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-interactive/30">
                        <h2 className="text-lg font-bold tracking-tight text-foreground">Match Scorecard</h2>
                        <button onClick={handleClose} className="p-2 rounded-full bg-surface-interactive hover:bg-surface-interactive/80 border border-border transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-lg tracking-tight text-foreground">{isEditMode ? 'Edit Match Result' : 'Enter Official Scores'}</h3>
                            <p className="text-sm text-muted-foreground">
                                {isLocked ? 'Waiting for teams to advance to this match.' : 
                                 scoringFormat === 'BEST_OF_3_TO_11' ? 'USAP Rules: Best of 3 to 11. Must win by 2 points.' :
                                 scoringFormat === 'SINGLE_GAME_TO_15' ? 'USAP Rules: 1 Game to 15. Must win by 2 points.' :
                                 'USAP Rules: 1 Game to 21. Must win by 2 points.'}
                            </p>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-500 dark:text-red-400 text-left">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">{error}</p>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-center">
                            <div className="font-semibold text-sm text-muted-foreground invisible">Game</div>
                            <div className="font-bold text-center truncate px-2 text-emerald-500 dark:text-emerald-400">{team1 ? team1.name : 'TBD'}</div>
                            <div className="font-bold text-center truncate px-2 text-emerald-500 dark:text-emerald-400">{team2 ? team2.name : 'TBD'}</div>

                            {Array.from({ length: numGames }).map((_, i) => (
                                <React.Fragment key={i}>
                                    <div className="font-semibold text-sm text-muted-foreground">Game {i + 1}</div>
                                    <input 
                                        type="number"
                                        placeholder="-"
                                        className="w-full h-12 text-center text-xl font-bold bg-surface-interactive border border-border rounded-xl text-foreground focus:outline-none focus-visible:ring-2 focus:ring-emerald-500 transition-all"
                                        value={games[i]?.team1_score ?? ''}
                                        onChange={e => handleScoreChange(i, 1, e.target.value)}
                                        disabled={isEditMode}
                                    />
                                    <input 
                                        type="number"
                                        placeholder="-"
                                        className="w-full h-12 text-center text-xl font-bold bg-surface-interactive border border-border rounded-xl text-foreground focus:outline-none focus-visible:ring-2 focus:ring-emerald-500 transition-all"
                                        value={games[i]?.team2_score ?? ''}
                                        onChange={e => handleScoreChange(i, 2, e.target.value)}
                                        disabled={isEditMode}
                                    />
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-surface-overlay border-t border-border flex justify-between items-center">
                        {isEditMode ? (
                            <button onClick={handleUndo} className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-[0.97] flex items-center gap-2 cursor-pointer">
                                <RotateCcw className="w-4 h-4" /> Undo Match Result
                            </button>
                        ) : (
                            <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-interactive rounded-xl transition-all active:scale-[0.97] cursor-pointer">
                                Cancel
                            </button>
                        )}
                        
                        {!isEditMode && (
                            <button 
                                disabled={isLocked || isSubmitting}
                                onClick={handleConfirm}
                                className={`px-6 py-2.5 flex items-center justify-center min-w-[140px] gap-2 text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer ${isLocked || isSubmitting ? 'bg-surface-interactive text-muted-foreground opacity-50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
                            >
                                {isSubmitting ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    'Submit Scores'
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
