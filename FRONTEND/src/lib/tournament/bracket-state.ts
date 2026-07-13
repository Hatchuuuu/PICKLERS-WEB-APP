import { Match } from './types';

function invalidatePath(matches: Match[], nextMatchId: string | null, teamIdToRemove: string | null) {
    if (!nextMatchId || !teamIdToRemove) return;

    const nextMatch = matches.find(m => m.id === nextMatchId);
    if (!nextMatch) return;

    let wasRemoved = false;
    if (nextMatch.team1_id === teamIdToRemove) {
        nextMatch.team1_id = null;
        wasRemoved = true;
    }
    if (nextMatch.team2_id === teamIdToRemove) {
        nextMatch.team2_id = null;
        wasRemoved = true;
    }

    if (wasRemoved && nextMatch.status === 'COMPLETED') {
        const oldWinner = nextMatch.winner_id;
        const oldLoser = nextMatch.loser_id;
        
        nextMatch.status = 'PENDING';
        nextMatch.winner_id = null;
        nextMatch.loser_id = null;

        if (oldWinner) invalidatePath(matches, nextMatch.next_match_winner_goes_to, oldWinner);
        if (oldLoser) invalidatePath(matches, nextMatch.next_match_loser_goes_to, oldLoser);
    }
}

/**
 * Processes a match result and properly routes the winner (and loser if double elim)
 * to their next respective matches, maintaining bracket state immutability.
 */
export function processMatchResult(matches: Match[], matchId: string, winnerId: string | null): Match[] {
    const updated = [...matches.map(m => ({ ...m }))]; // Deep copy for React state immutability

    const match = updated.find(m => m.id === matchId);
    if (!match) return updated;

    // Handle Undo/Reset
    if (winnerId === null) {
        if (match.status === 'COMPLETED') {
            invalidatePath(updated, match.next_match_winner_goes_to, match.winner_id);
            invalidatePath(updated, match.next_match_loser_goes_to, match.loser_id);
            match.winner_id = null;
            match.loser_id = null;
            match.status = 'PENDING';
        }
        return updated;
    }

    const isTeam1Winner = match.team1_id === winnerId;
    const isTeam2Winner = match.team2_id === winnerId;
    
    if (!isTeam1Winner && !isTeam2Winner) return updated; // Invalid winner

    const loserId = isTeam1Winner ? match.team2_id : match.team1_id;

    // Detect if the result is being changed retroactively
    if (match.status === 'COMPLETED' && match.winner_id !== winnerId) {
        invalidatePath(updated, match.next_match_winner_goes_to, match.winner_id);
        invalidatePath(updated, match.next_match_loser_goes_to, match.loser_id);
    }

    // 1. Update the current match
    match.winner_id = winnerId;
    match.loser_id = loserId;
    match.status = 'COMPLETED';

    // 2. Route the Winner
    if (match.next_match_winner_goes_to) {
        const nextMatch = updated.find(m => m.id === match.next_match_winner_goes_to);
        if (nextMatch) {
            if (nextMatch.bracket_type === 'FINAL') {
                // W-bracket champ takes top slot, L-bracket champ takes bottom slot
                if (match.bracket_type === 'WINNER') nextMatch.team1_id = winnerId;
                else nextMatch.team2_id = winnerId;
            }
            else if (match.bracket_type === 'WINNER' && nextMatch.bracket_type === 'WINNER') {
                const seq = match.match_sequence || 1;
                if (seq % 2 !== 0) nextMatch.team1_id = winnerId;
                else nextMatch.team2_id = winnerId;
            } 
            else if (match.bracket_type === 'LOSER' && nextMatch.bracket_type === 'LOSER') {
                const isMajorRound = updated.some(m => m.next_match_loser_goes_to === nextMatch.id);
                if (isMajorRound) {
                    // L-bracket survivor advancing to face a dropping W-bracket team takes the BOTTOM slot
                    nextMatch.team2_id = winnerId;
                } else {
                    // Minor round L-bracket to L-bracket
                    const seq = match.match_sequence || 1;
                    if (seq % 2 !== 0) nextMatch.team1_id = winnerId;
                    else nextMatch.team2_id = winnerId;
                }
            }
            else {
                // Fallback for single elim / standard progression
                const seq = match.match_sequence || 1;
                if (seq % 2 !== 0) nextMatch.team1_id = winnerId;
                else nextMatch.team2_id = winnerId;
            }
        }
    }

    // 3. Route the Loser (for Double Elimination)
    if (match.next_match_loser_goes_to) {
        // If loserId is null but the match is COMPLETED (it's a BYE match), we route 'BYE' string
        const routedLoser = loserId || (match.status === 'COMPLETED' ? 'BYE' : null);
        
        if (routedLoser) {
            const nextMatch = updated.find(m => m.id === match.next_match_loser_goes_to);
            if (nextMatch) {
                if (nextMatch.round_number === 1) {
                    // Round 1 of Losers bracket receives TWO dropping teams from Winners bracket
                    const seq = match.match_sequence || 1;
                    if (seq % 2 !== 0) {
                        nextMatch.team1_id = routedLoser;
                    } else {
                        nextMatch.team2_id = routedLoser;
                    }
                } else {
                    // Major rounds: W-bracket losers dropping to L-bracket ALWAYS take the TOP slot
                    nextMatch.team1_id = routedLoser;
                }
            }
        }
    }

    return updated;
}

/**
 * Propagates Byes recursively through a generated bracket.
 * Any match that has one team but no opponent and is marked COMPLETED is a Bye.
 * The winner is routed forward automatically.
 */
export function propagateByes(matches: Match[]): Match[] {
    let currentMatches = [...matches];
    let changed = true;
    let iterations = 0;

    while (changed && iterations < 100) {
        changed = false;
        iterations++;
        
        for (const match of currentMatches) {
            // Standard propagation of completed matches
            if (match.status === 'COMPLETED' && match.winner_id && match.next_match_winner_goes_to) {
                const nextMatch = currentMatches.find(m => m.id === match.next_match_winner_goes_to);
                if (nextMatch && nextMatch.team1_id !== match.winner_id && nextMatch.team2_id !== match.winner_id) {
                    currentMatches = processMatchResult(currentMatches, match.id, match.winner_id);
                    changed = true;
                    break;
                }
            }

            // Ghost BYE auto-completion
            if (match.status !== 'COMPLETED') {
                if (match.team1_id === 'BYE' && match.team2_id && match.team2_id !== 'BYE') {
                    match.winner_id = match.team2_id;
                    match.loser_id = 'BYE';
                    match.status = 'COMPLETED';
                    changed = true;
                    break;
                } else if (match.team2_id === 'BYE' && match.team1_id && match.team1_id !== 'BYE') {
                    match.winner_id = match.team1_id;
                    match.loser_id = 'BYE';
                    match.status = 'COMPLETED';
                    changed = true;
                    break;
                } else if (match.team1_id === 'BYE' && match.team2_id === 'BYE') {
                    match.winner_id = 'BYE';
                    match.loser_id = 'BYE';
                    match.status = 'COMPLETED';
                    changed = true;
                    break;
                }
            }
        }
    }

    if (iterations >= 100) {
        console.error("Infinite loop detected in propagateByes!");
    }

    return currentMatches;
}
