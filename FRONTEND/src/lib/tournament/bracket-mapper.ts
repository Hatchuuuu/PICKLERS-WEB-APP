import { Match, Team } from './types';
import { TournamentMatch, TournamentPlayer } from '@/components/tournament/MatchNode';

export function mapToBracketTree(matches: Match[], teams: Team[]): {
    winnersRounds: TournamentMatch[][];
    losersRounds: TournamentMatch[][];
    grandFinalRounds: TournamentMatch[][];
} {
    const winnersRounds: TournamentMatch[][] = [];
    const losersRounds: TournamentMatch[][] = [];
    const grandFinalRounds: TournamentMatch[][] = [];

    // Helper to get player object
    const getPlayer = (teamId: string | null): TournamentPlayer | null => {
        if (!teamId) return null;
        const team = teams.find(t => t.id === teamId);
        if (!team) return null;
        return {
            id: team.id,
            name: team.name,
        };
    };

    // Helper to format Match to TournamentMatch
    const formatMatch = (match: Match, prefix: string): TournamentMatch => {
        // Find if it's a final
        const isFinal = match.bracket_type === 'FINAL';
        
        let roundName = `${prefix} Round ${match.round_number}`;
        if (isFinal) {
            roundName = 'Grand Final';
        } else if (match.bracket_type === '3RD_PLACE') {
            roundName = '3rd Place Playoff';
        }

        // A BYE is a completed match where one team is null
        const isBye = match.status === 'COMPLETED' &&
            ((match.team1_id && !match.team2_id) || (!match.team1_id && match.team2_id) || (match.team1_id === 'BYE' || match.team2_id === 'BYE'));

        return {
            id: match.id,
            round: roundName,
            player1: getPlayer(match.team1_id === 'BYE' ? null : match.team1_id),
            player2: getPlayer(match.team2_id === 'BYE' ? null : match.team2_id),
            winner_id: match.winner_id,
            loser_id: match.loser_id,
            next_match_winner_goes_to: match.next_match_winner_goes_to,
            next_match_loser_goes_to: match.next_match_loser_goes_to,
            status: match.status,
            isBye
        };
    };

    // Group matches — detect format
    const loserMatches = matches.filter(m => m.bracket_type === 'LOSER');
    const isSingleElim = loserMatches.length === 0;

    // For single elim: treat FINAL as part of winners bracket (keeps bracket visually continuous)
    const winnerMatchesAll = isSingleElim
        ? matches.filter(m => m.bracket_type === 'WINNER' || m.bracket_type === 'FINAL' || m.bracket_type === '3RD_PLACE')
        : matches.filter(m => m.bracket_type === 'WINNER');
    const finalMatches = isSingleElim
        ? []
        : matches.filter(m => m.bracket_type === 'FINAL');

    // Group Winners into rounds
    if (winnerMatchesAll.length > 0) {
        const maxWRound = Math.max(...winnerMatchesAll.map(m => m.round_number));
        for (let r = 1; r <= maxWRound; r++) {
            const round = winnerMatchesAll.filter(m => m.round_number === r).sort((a, b) => (a.match_sequence || 0) - (b.match_sequence || 0));
            if (round.length > 0) {
                const formattedRound = round.map(m => {
                    const formatted = formatMatch(m, 'W-');
                    if (m.bracket_type === '3RD_PLACE') {
                        // Keep '3rd Place Playoff'
                    } else if (r === maxWRound) {
                        formatted.round = isSingleElim ? 'Championship' : 'W-Final';
                    } else if (r === maxWRound - 1 && maxWRound > 1) {
                        formatted.round = isSingleElim ? 'Semifinals' : 'W-Semifinal';
                    } else if (r === maxWRound - 2 && maxWRound > 2) {
                        formatted.round = isSingleElim ? 'Quarterfinals' : 'W-Quarterfinal';
                    }
                    return formatted;
                });
                winnersRounds.push(formattedRound);
            }
        }
    }

    // Group Losers into rounds
    if (loserMatches.length > 0) {
        const maxLRound = Math.max(...loserMatches.map(m => m.round_number));
        for (let r = 1; r <= maxLRound; r++) {
            const round = loserMatches.filter(m => m.round_number === r).sort((a, b) => (a.match_sequence || 0) - (b.match_sequence || 0));
            if (round.length > 0) {
                const formattedRound = round.map(m => {
                    const formatted = formatMatch(m, 'L-');
                    if (r === maxLRound) formatted.round = 'L-Final';
                    else if (r === maxLRound - 1 && maxLRound > 1) formatted.round = 'L-Semifinal';
                    return formatted;
                });
                losersRounds.push(formattedRound);
            }
        }
    }

    // Grand Finals (only for double elimination)
    if (finalMatches.length > 0) {
        const sortedFinals = finalMatches.sort((a, b) => a.round_number - b.round_number);
        sortedFinals.forEach(m => {
            grandFinalRounds.push([formatMatch(m, '')]);
        });
    }

    return { winnersRounds, losersRounds, grandFinalRounds };
}
