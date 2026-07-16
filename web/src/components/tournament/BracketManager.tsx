"use client";

import { Match } from '@/lib/tournament/types';
import { MatchNode } from '@/components/tournament/MatchNode';
import { useTournamentStore } from '@/store/useTournamentStore';

interface BracketManagerProps {
    matches: Match[];
}

export function BracketManager({ matches }: BracketManagerProps) {
    const teams = useTournamentStore(state => state.teams);
    const winnerMatches = matches.filter(m => m.bracket_type === 'WINNER' || m.bracket_type === 'FINAL');
    const loserMatches = matches.filter(m => m.bracket_type === 'LOSER' || m.bracket_type === 'TIEBREAKER');
    const playoffMatches = matches.filter(m => m.bracket_type === 'PLAYOFF');
    const rrMatches = matches.filter(m => m.bracket_type === 'ROUND_ROBIN');

    const getRoundName = (roundNum: number, rounds: number[], isLosers: boolean) => {
        const isFinal = roundNum === rounds[rounds.length - 1];
        const isSemi = rounds.length > 1 && roundNum === rounds[rounds.length - 2];
        const isQuarter = rounds.length > 2 && roundNum === rounds[rounds.length - 3];
        
        let actualRound = roundNum > 50 ? roundNum - 100 : roundNum;
        if (actualRound < 0) actualRound = Math.abs(actualRound);

        if (isFinal) return isLosers ? "Loser's Bracket Final" : "Championship";
        if (isSemi) return isLosers ? "Loser's Bracket Semifinal" : "Semifinals";
        if (isQuarter) return isLosers ? "Loser's Bracket Quarterfinal" : "Quarterfinals";
        
        return isLosers ? `Loser's Round ${actualRound}` : `Round ${actualRound}`;
    };

    const renderBracketSection = (title: string, sectionMatches: Match[]) => {
        if (sectionMatches.length === 0) return null;
        const rounds = [...new Set(sectionMatches.map(m => m.round_number))].sort((a, b) => a - b);
        const isLosers = title.includes("Loser");
        
        return (
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 text-foreground tracking-tight">{title}</h2>
                <div className="flex gap-16 min-w-max relative">
                    {rounds.map(roundNum => {
                        const roundMatches = sectionMatches.filter(m => m.round_number === roundNum).sort((a, b) => (a.match_sequence || 0) - (b.match_sequence || 0));
                        return (
                            <div key={roundNum} className="flex flex-col gap-8 justify-around">
                                <h3 className="text-center font-semibold text-muted-foreground mb-4 uppercase tracking-wider text-xs">
                                    {getRoundName(roundNum, rounds, isLosers)}
                                </h3>
                                {roundMatches.map(match => {
                                    const team1 = teams.find(t => t.id === match.team1_id);
                                    const team2 = teams.find(t => t.id === match.team2_id);
                                    
                                    const mappedMatch = {
                                        id: match.id,
                                        round: getRoundName(roundNum, rounds, isLosers),
                                        player1: team1 ? { id: team1.id, name: team1.name } : null,
                                        player2: team2 ? { id: team2.id, name: team2.name } : null,
                                        winner_id: match.winner_id,
                                        loser_id: match.loser_id,
                                        status: match.status,
                                        isBye: !match.team1_id || !match.team2_id
                                    };

                                    return (
                                        <div key={match.id} className="relative">
                                            <MatchNode match={mappedMatch} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="relative">
            <div className="overflow-x-auto pb-10 scrollbar-hide">
                {renderBracketSection(rrMatches.length > 0 ? "Pool Play (Round Robin)" : "Main Bracket", winnerMatches.length > 0 ? winnerMatches : rrMatches)}
                {renderBracketSection(loserMatches.length > 0 ? "Losers / Consolation Bracket" : "", loserMatches)}
                {renderBracketSection(playoffMatches.length > 0 ? "Playoff Bracket" : "", playoffMatches)}
            </div>
            {/* Horizontal scroll fade indicator for premium feel */}
            <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
}
