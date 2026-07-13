import { Match, Game, Team, ScoringFormat } from './types';

export function validateScores(games: Game[], isTiebreaker: boolean = false, format: ScoringFormat = 'BEST_OF_3_TO_11'): boolean {
    if (games.length === 0) return false;
    let requiredWinScore = 11;
    let requiredGamesToWin = 2;
    if (isTiebreaker) {
        requiredWinScore = 15;
        requiredGamesToWin = 1;
    } else if (format === 'SINGLE_GAME_TO_15') {
        requiredWinScore = 15;
        requiredGamesToWin = 1;
    } else if (format === 'SINGLE_GAME_TO_21') {
        requiredWinScore = 21;
        requiredGamesToWin = 1;
    }
    for (const game of games) {
        const s1 = game.team1_score ?? 0;
        const s2 = game.team2_score ?? 0;
        if (s1 < requiredWinScore && s2 < requiredWinScore) return false;
        if (Math.abs(s1 - s2) < 2) return false;
    }
    let t1Wins = 0, t2Wins = 0;
    for (const game of games) {
        const s1 = game.team1_score ?? 0;
        const s2 = game.team2_score ?? 0;
        if (s1 > s2) t1Wins++;
        else if (s2 > s1) t2Wins++;
    }
    if (t1Wins < requiredGamesToWin && t2Wins < requiredGamesToWin) return false;
    return true;
}

export function determineWinner(match: Match, games: Game[]): { winner_id: string, loser_id: string } {
    let t1Wins = 0, t2Wins = 0;
    for (const game of games) {
        const s1 = game.team1_score ?? 0;
        const s2 = game.team2_score ?? 0;
        if (s1 > s2) t1Wins++;
        else if (s2 > s1) t2Wins++;
    }
    if (!match.team1_id || !match.team2_id) throw new Error("Match must have two teams to determine a winner.");
    return t1Wins > t2Wins ? { winner_id: match.team1_id, loser_id: match.team2_id } : { winner_id: match.team2_id, loser_id: match.team1_id };
}

export function processMatchSubmission(allMatches: Match[], matchId: string, gamesInput: Game[], scoringFormat: ScoringFormat = 'BEST_OF_3_TO_11'): Match[] {
    const matches = [...allMatches.map(m => ({ ...m }))];
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) throw new Error("Match not found");
    const match = matches[matchIndex];
    if (match.status === 'COMPLETED' || match.status === 'FORFEITED') throw new Error("Match already finished");
    if (!match.team1_id || !match.team2_id) throw new Error("Match is missing a team");
    const isTiebreaker = match.bracket_type === 'TIEBREAKER';
    if (!validateScores(gamesInput, isTiebreaker, scoringFormat)) throw new Error("Invalid scores submitted");
    const { winner_id, loser_id } = determineWinner(match, gamesInput);

    let cancelTiebreaker = false;
    if (match.bracket_type === 'FINAL' && match.next_match_winner_goes_to) {
        const nextMatch = matches.find(m => m.id === match.next_match_winner_goes_to);
        if (nextMatch?.bracket_type === 'TIEBREAKER') {
            // USAP True Final Logic: We must identify the Winner's Bracket champion.
            // We find the match in the WINNER bracket that feeds into this FINAL.
            const winnerBracketFinal = matches.find(m => m.bracket_type === 'WINNER' && m.next_match_winner_goes_to === match.id);
            const winnerBracketChampId = winnerBracketFinal?.winner_id;
            
            // If the Winner's Bracket Champion wins the Grand Final, the tournament is over (no tiebreaker)
            if (winnerBracketChampId && winner_id === winnerBracketChampId) {
                cancelTiebreaker = true;
            }
        }
    }

    match.winner_id = winner_id;
    match.loser_id = loser_id;
    match.status = 'COMPLETED';

    if (cancelTiebreaker) {
        const tbIndex = matches.findIndex(m => m.id === match.next_match_winner_goes_to);
        if (tbIndex !== -1) matches[tbIndex].status = 'CANCELLED';
    } else {
        if (match.next_match_winner_goes_to) pushTeamToNextMatch(matches, match.next_match_winner_goes_to, winner_id);
    }
    if (match.next_match_loser_goes_to && !cancelTiebreaker) {
        pushTeamToNextMatch(matches, match.next_match_loser_goes_to, loser_id);
    }
    return matches;
}

function pushTeamToNextMatch(matches: Match[], nextMatchId: string, teamId: string) {
    const nextMatch = matches.find(m => m.id === nextMatchId);
    if (!nextMatch) return;
    if (!nextMatch.team1_id) nextMatch.team1_id = teamId;
    else if (!nextMatch.team2_id && nextMatch.team1_id !== teamId) nextMatch.team2_id = teamId;
}
