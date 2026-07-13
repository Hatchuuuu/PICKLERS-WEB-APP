import { Team, Match, BracketType, MatchStatus } from './types';
import { propagateByes } from './bracket-state';

function generateId(): string {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Generates the standard seeding pattern for a bracket of size P (power of 2)
 * For P=8: [1, 8, 4, 5, 2, 7, 3, 6]
 */
function getSeedingArray(p: number): number[] {
    let seeds = [1, 2];
    for (let i = 4; i <= p; i *= 2) {
        const nextSeeds: number[] = [];
        for (let j = 0; j < seeds.length; j++) {
            nextSeeds.push(seeds[j], i + 1 - seeds[j]);
        }
        seeds = nextSeeds;
    }
    return seeds;
}

export function generateSingleElimination(
    teams: Team[],
    tournamentId: string,
    divisionId: string | null
): Match[] {
    const N = teams.length;
    if (N < 2) return [];

    const P = Math.pow(2, Math.ceil(Math.log2(N))); // Next power of 2
    const numRounds = Math.log2(P);
    const seeding = getSeedingArray(P);

    const matches: Match[] = [];

    // We will build the bracket from Round 1 to the Final.
    // roundMatches[roundNumber] = array of Match objects for that round
    const roundMatches: Match[][] = Array.from({ length: numRounds }, () => []);

    // Generate matches per round
    for (let r = 0; r < numRounds; r++) {
        const roundNum = r + 1;
        const matchesInRound = P / Math.pow(2, r + 1);

        for (let m = 0; m < matchesInRound; m++) {
            roundMatches[r].push({
                id: generateId(),
                tournament_id: tournamentId,
                division_id: divisionId,
                bracket_type: roundNum === numRounds ? 'FINAL' : 'WINNER',
                round_number: roundNum,
                match_sequence: m + 1,
                team1_id: null,
                team2_id: null,
                winner_id: null,
                loser_id: null,
                next_match_winner_goes_to: null,
                next_match_loser_goes_to: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        }
    }

    // Link the matches (winner goes to next round)
    for (let r = 0; r < numRounds - 1; r++) {
        const currentRound = roundMatches[r];
        const nextRound = roundMatches[r + 1];

        for (let m = 0; m < currentRound.length; m++) {
            const currentMatch = currentRound[m];
            const nextMatch = nextRound[Math.floor(m / 2)];
            currentMatch.next_match_winner_goes_to = nextMatch.id;
        }
    }

    // Seed Round 1
    for (let m = 0; m < roundMatches[0].length; m++) {
        const match = roundMatches[0][m];

        // Seeds for this match
        const seed1 = seeding[m * 2];
        const seed2 = seeding[m * 2 + 1];

        // teams array is 0-indexed, seeds are 1-indexed
        const team1 = seed1 <= N ? teams[seed1 - 1] : null;
        const team2 = seed2 <= N ? teams[seed2 - 1] : null;

        match.team1_id = team1 ? team1.id : null;
        match.team2_id = team2 ? team2.id : null;

        // Handle BYES
        if (team1 && !team2) {
            match.winner_id = team1.id;
            match.status = 'COMPLETED';
        } else if (!team1 && team2) {
            match.winner_id = team2.id;
            match.status = 'COMPLETED';
        } else if (!team1 && !team2) {
            match.status = 'CANCELLED'; // Should not happen in strict power of 2 math, but safe fallback
        }
    }

    // Flatten matches array
    for (let r = 0; r < numRounds; r++) {
        matches.push(...roundMatches[r]);
    }

    // Add 3rd place match if we have semifinals
    if (numRounds >= 2) {
        const thirdPlaceMatch: Match = {
            id: generateId(),
            tournament_id: tournamentId,
            division_id: divisionId,
            bracket_type: '3RD_PLACE',
            round_number: numRounds,
            match_sequence: 2, // Final is 1, 3rd place is 2
            team1_id: null,
            team2_id: null,
            winner_id: null,
            loser_id: null,
            next_match_winner_goes_to: null,
            next_match_loser_goes_to: null,
            status: 'PENDING',
            created_at: new Date().toISOString()
        };
        const semiFinals = roundMatches[numRounds - 2];
        semiFinals[0].next_match_loser_goes_to = thirdPlaceMatch.id;
        semiFinals[1].next_match_loser_goes_to = thirdPlaceMatch.id;
        matches.push(thirdPlaceMatch);
    }

    return propagateByes(matches);
}

export function generateSingleEliminationWithConsolation(
    teams: Team[],
    tournamentId: string,
    divisionId: string | null
): Match[] {
    // 1. Generate Main Bracket
    const matches = generateSingleElimination(teams, tournamentId, divisionId);
    
    // 2. Identify Round 1 matches in Main Bracket
    const r1Matches = matches.filter(m => m.round_number === 1 && m.bracket_type === 'WINNER');
    
    // 3. Create Consolation Bracket (size is exactly half of main bracket's starting size)
    const numLosers = r1Matches.length;
    if (numLosers < 2) return matches;
    
    const numConsolationRounds = Math.log2(numLosers);
    const consolationMatches: Match[][] = Array.from({ length: numConsolationRounds }, () => []);
    
    for (let r = 0; r < numConsolationRounds; r++) {
        const matchesInRound = numLosers / Math.pow(2, r + 1);
        for (let m = 0; m < matchesInRound; m++) {
            consolationMatches[r].push({
                id: generateId(),
                tournament_id: tournamentId,
                division_id: divisionId,
                bracket_type: 'LOSER', // Consolation bracket
                round_number: r + 1,
                match_sequence: m + 1,
                team1_id: null,
                team2_id: null,
                winner_id: null,
                loser_id: null,
                next_match_winner_goes_to: null,
                next_match_loser_goes_to: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        }
    }
    
    // Link Consolation matches
    for (let r = 0; r < numConsolationRounds - 1; r++) {
        for (let m = 0; m < consolationMatches[r].length; m++) {
            consolationMatches[r][m].next_match_winner_goes_to = consolationMatches[r + 1][Math.floor(m / 2)].id;
        }
    }
    
    // Map Round 1 Main losers to Consolation Round 1
    for (let m = 0; m < r1Matches.length; m++) {
        const targetMatch = Math.floor(m / 2);
        r1Matches[m].next_match_loser_goes_to = consolationMatches[0][targetMatch].id;
    }
    
    for (let r = 0; r < numConsolationRounds; r++) {
        matches.push(...consolationMatches[r]);
    }
    
    return matches;
}

export function generateDoubleElimination(
    teams: Team[],
    tournamentId: string,
    divisionId: string | null
): Match[] {
    const N = teams.length;
    if (N < 2) return [];

    const P = Math.pow(2, Math.ceil(Math.log2(N))); // Next power of 2
    const numWinnerRounds = Math.log2(P);
    const numLoserRounds = 2 * numWinnerRounds - 2;

    const matches: Match[] = [];

    // 1. Generate Winners Bracket (identical to Single Elim except no 'FINAL' status yet)
    const winnerMatches: Match[][] = Array.from({ length: numWinnerRounds }, () => []);
    for (let r = 0; r < numWinnerRounds; r++) {
        const matchesInRound = P / Math.pow(2, r + 1);
        for (let m = 0; m < matchesInRound; m++) {
            winnerMatches[r].push({
                id: generateId(),
                tournament_id: tournamentId,
                division_id: divisionId,
                bracket_type: 'WINNER',
                round_number: r + 1,
                match_sequence: m + 1,
                team1_id: null,
                team2_id: null,
                winner_id: null,
                loser_id: null,
                next_match_winner_goes_to: null,
                next_match_loser_goes_to: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        }
    }

    for (let r = 0; r < numWinnerRounds - 1; r++) {
        for (let m = 0; m < winnerMatches[r].length; m++) {
            winnerMatches[r][m].next_match_winner_goes_to = winnerMatches[r + 1][Math.floor(m / 2)].id;
        }
    }

    const seeding = getSeedingArray(P);
    for (let m = 0; m < winnerMatches[0].length; m++) {
        const match = winnerMatches[0][m];
        const seed1 = seeding[m * 2];
        const seed2 = seeding[m * 2 + 1];

        const team1 = seed1 <= N ? teams[seed1 - 1] : null;
        const team2 = seed2 <= N ? teams[seed2 - 1] : null;

        match.team1_id = team1 ? team1.id : null;
        match.team2_id = team2 ? team2.id : null;

        if ((team1 && !team2) || (!team1 && team2)) {
            match.winner_id = team1 ? team1.id : team2!.id;
            match.status = 'COMPLETED';
        } else if (!team1 && !team2) {
            match.status = 'CANCELLED';
        }
    }

    // 2. Generate Losers Bracket
    const loserMatches: Match[][] = Array.from({ length: numLoserRounds }, () => []);
    let currentLoserMatches = P / 4; // In L1, P/2 losers from W1 play each other -> P/4 matches

    for (let r = 0; r < numLoserRounds; r++) {
        // Every even round (0, 2, 4...) is a Major round where W-bracket losers drop into L-bracket.
        // Wait, L1 is r=0. It's a Minor round (W1 losers play each other).
        // L2 is r=1. It's a Major round (L1 winners play W2 losers). Stays same.
        // L3 is r=2. Minor round. Halves.
        // So it halves on r > 0 when r is EVEN.
        if (r > 0 && r % 2 === 0) {
            currentLoserMatches = currentLoserMatches / 2;
        }

        for (let m = 0; m < currentLoserMatches; m++) {
            loserMatches[r].push({
                id: generateId(),
                tournament_id: tournamentId,
                division_id: divisionId,
                bracket_type: 'LOSER',
                round_number: r + 1,
                match_sequence: m + 1,
                team1_id: null,
                team2_id: null,
                winner_id: null,
                loser_id: null,
                next_match_winner_goes_to: null,
                next_match_loser_goes_to: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        }
    }

    // Link Loser Matches
    for (let r = 0; r < numLoserRounds - 1; r++) {
        const isMinorToMajor = r % 2 === 0; // r=0,2,4 are minor → next is major (same count)
        for (let m = 0; m < loserMatches[r].length; m++) {
            const nextM = isMinorToMajor ? m : Math.floor(m / 2);
            if (loserMatches[r + 1] && loserMatches[r + 1][nextM]) {
                loserMatches[r][m].next_match_winner_goes_to = loserMatches[r + 1][nextM].id;
            }
        }
    }

    // 3. Map Winners Bracket Losers to Losers Bracket (Cross-Seeding Drop Logic)
    // W-Round 1 losers → L-Round 1 (minor). Two W losers feed one L match.
    // W-Round r > 1 losers → L-Round (2r-1) (major). One W loser feeds one L match.
    for (let wr = 0; wr < numWinnerRounds; wr++) {
        const dropLr = wr === 0 ? 0 : wr * 2 - 1;
        if (dropLr >= numLoserRounds) continue;

        const wMatches = winnerMatches[wr];
        const lMatches = loserMatches[dropLr];
        if (!lMatches || lMatches.length === 0) continue;

        for (let m = 0; m < wMatches.length; m++) {
            // For W-Round 1: two losers share one L-Round 1 match
            // For W-Round r>1: one loser goes to one L match (seeded in reverse to avoid rematches)
            let targetL: number;
            if (wr === 0) {
                targetL = Math.floor(m / 2);
            } else {
                // Reverse seeding: top W bracket loser goes to BOTTOM L match to avoid immediate rematch
                targetL = lMatches.length - 1 - m;
            }
            // Clamp to valid range
            targetL = Math.max(0, Math.min(targetL, lMatches.length - 1));
            wMatches[m].next_match_loser_goes_to = lMatches[targetL].id;
        }
    }

    // 4. Generate Grand Final
    const grandFinal: Match = {
        id: generateId(),
        tournament_id: tournamentId,
        division_id: divisionId,
        bracket_type: 'FINAL',
        round_number: numWinnerRounds + 1,
        match_sequence: 1,
        team1_id: null,
        team2_id: null,
        winner_id: null,
        loser_id: null,
        next_match_winner_goes_to: null,
        next_match_loser_goes_to: null,
        status: 'PENDING',
        created_at: new Date().toISOString()
    };

    // Link Winners & Losers Bracket Champions to Grand Final
    winnerMatches[numWinnerRounds - 1][0].next_match_winner_goes_to = grandFinal.id;
    loserMatches[numLoserRounds - 1][0].next_match_winner_goes_to = grandFinal.id;

    // Add all to matches array
    for (const round of winnerMatches) matches.push(...round);
    for (const round of loserMatches) matches.push(...round);
    matches.push(grandFinal);

    return propagateByes(matches);
}

export function generateRoundRobin(
    teams: Team[],
    tournamentId: string,
    divisionId: string | null
): Match[] {
    const matches: Match[] = [];
    const N = teams.length;
    if (N < 2) return [];

    const isOdd = N % 2 !== 0;
    const numTeams = isOdd ? N + 1 : N;

    // Create an array of indices
    const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const homeIdx = teamIndices[match];
            const awayIdx = teamIndices[numTeams - 1 - match];

            // If one of the indices is the dummy team (N), it's a BYE match
            if (homeIdx === N || awayIdx === N) {
                const realTeamIdx = homeIdx === N ? awayIdx : homeIdx;
                matches.push({
                    id: generateId(),
                    tournament_id: tournamentId,
                    division_id: divisionId,
                    bracket_type: 'ROUND_ROBIN',
                    round_number: round + 1,
                    match_sequence: match + 1,
                    team1_id: teams[realTeamIdx].id,
                    team2_id: null,
                    winner_id: teams[realTeamIdx].id,
                    loser_id: null,
                    next_match_winner_goes_to: null,
                    next_match_loser_goes_to: null,
                    status: 'COMPLETED',
                    created_at: new Date().toISOString()
                });
                continue;
            }

            matches.push({
                id: generateId(),
                tournament_id: tournamentId,
                division_id: divisionId,
                bracket_type: 'ROUND_ROBIN',
                round_number: round + 1,
                match_sequence: match + 1,
                team1_id: teams[homeIdx].id,
                team2_id: teams[awayIdx].id,
                winner_id: null,
                loser_id: null,
                next_match_winner_goes_to: null,
                next_match_loser_goes_to: null,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
        }

        // Rotate the array for the circle method: keep index 0 fixed, shift others right
        const last = teamIndices.pop()!;
        teamIndices.splice(1, 0, last);
    }

    return matches;
}

export function generateRoundRobinWithPlayoffs(
    teams: Team[],
    tournamentId: string,
    divisionId: string | null,
    playoffSize: number = 4
): Match[] {
    const matches = generateRoundRobin(teams, tournamentId, divisionId);
    
    const dummyTeams = Array.from({ length: playoffSize }, (_, i) => ({
        id: `dummy_${i}`,
        name: `Seed ${i+1}`
    } as Team));
    
    const playoffMatches = generateSingleElimination(dummyTeams, tournamentId, divisionId);
    
    for (const match of playoffMatches) {
        match.bracket_type = match.bracket_type === 'FINAL' ? 'FINAL' : 'PLAYOFF';
        match.team1_id = null;
        match.team2_id = null;
        match.status = 'PENDING';
        match.round_number += 100;
    }
    
    matches.push(...playoffMatches);
    
    return matches;
}
