import { Match, Game, Team } from './types';
import { determineWinner } from './tournament-service';

export interface TeamStanding {
    team_id: string;
    wins: number;
    losses: number;
    points_for: number;
    points_against: number;
    point_differential: number;
}

export function calculateRoundRobinStandings(teams: Team[], rrMatches: Match[], allGames: Game[]): TeamStanding[] {
    // 1. Initialize standings map
    const standingsMap = new Map<string, TeamStanding>();
    for (const team of teams) {
        standingsMap.set(team.id, {
            team_id: team.id,
            wins: 0,
            losses: 0,
            points_for: 0,
            points_against: 0,
            point_differential: 0
        });
    }

    // 2. Tally Wins, Losses, and Points from completed matches
    for (const match of rrMatches) {
        if (match.status !== 'COMPLETED') continue;
        if (!match.team1_id || !match.team2_id) continue;

        const matchGames = allGames.filter(g => g.match_id === match.id);

        try {
            // Fallback to native match.winner_id if no sub-games exist
            const winner_id = matchGames.length > 0 ? determineWinner(match, matchGames).winner_id : match.winner_id;
            const loser_id = matchGames.length > 0 ? determineWinner(match, matchGames).loser_id : match.loser_id;
            
            if (winner_id && loser_id) {
                // Tally W/L
                const winnerStanding = standingsMap.get(winner_id);
                const loserStanding = standingsMap.get(loser_id);
                
                if (winnerStanding) winnerStanding.wins += 1;
                if (loserStanding) loserStanding.losses += 1;
            }

            // Tally Points ONLY if games exist
            if (matchGames.length > 0) {
                for (const game of matchGames) {
                    const s1 = game.team1_score ?? 0;
                    const s2 = game.team2_score ?? 0;
                    
                    const t1Standing = standingsMap.get(match.team1_id);
                    const t2Standing = standingsMap.get(match.team2_id);
                    
                    if (t1Standing) {
                        t1Standing.points_for += s1;
                        t1Standing.points_against += s2;
                        t1Standing.point_differential = t1Standing.points_for - t1Standing.points_against;
                    }
                    if (t2Standing) {
                        t2Standing.points_for += s2;
                        t2Standing.points_against += s1;
                        t2Standing.point_differential = t2Standing.points_for - t2Standing.points_against;
                    }
                }
            }
        } catch (e) {
            // Ignore matches with invalid data
        }
    }

    // 3. Sort according to USAP rules:
    // Rule 1: Win/Loss Record
    // Rule 2: Head-to-Head (if 2 teams are tied)
    // Rule 3: Point Differential
    // Rule 4: Points Against

    const standingsArray = Array.from(standingsMap.values());

    standingsArray.sort((a, b) => {
        // Rule 1: Win % (or total wins)
        if (a.wins !== b.wins) return b.wins - a.wins;

        // Note: Head-to-Head is complex for 3+ way ties. 
        // For simplicity and standard basic implementation, we check if it's a 2-way tie 
        // by seeing if they played each other and who won.
        const headToHeadMatch = rrMatches.find(m => 
            m.status === 'COMPLETED' && 
            ((m.team1_id === a.team_id && m.team2_id === b.team_id) || 
             (m.team1_id === b.team_id && m.team2_id === a.team_id))
        );

        if (headToHeadMatch && headToHeadMatch.winner_id) {
            if (headToHeadMatch.winner_id === a.team_id) return -1;
            if (headToHeadMatch.winner_id === b.team_id) return 1;
        }

        // Rule 3: Point Differential
        if (a.point_differential !== b.point_differential) return b.point_differential - a.point_differential;

        // Rule 4: Points Against
        return a.points_against - b.points_against;
    });

    return standingsArray;
}
