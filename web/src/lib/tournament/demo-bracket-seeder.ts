import { Team, Match } from './types';
import { generateSingleElimination, generateDoubleElimination, generateRoundRobin } from './bracket-generator';
import { processMatchSubmission } from './tournament-service';

export function seedDemoBracketData(
  tournamentId: string,
  formatStr: string = 'double',
  numTeams: number = 8
): { teams: Team[]; matches: Match[] } {
  const teamNames = [
    "Metro Manila Picklers",
    "BGC Titans",
    "QC Smashers",
    "Makati Volley Co.",
    "Alabang Aces",
    "Ortigas Spinners",
    "Cebu DUPR 4.5",
    "Davao Court Kings",
    "Pasig Paddlers",
    "Taguig Net Rippers",
    "Southern Volley",
    "Northern Lights",
    "Central Smashers",
    "East Coast Dinks",
    "Westside Drivers",
    "Island Picklers"
  ];

  const count = Math.max(4, Math.min(numTeams, 16));

  const teams: Team[] = Array.from({ length: count }, (_, i) => ({
    id: `team_${i + 1}_${tournamentId}`,
    tournament_id: tournamentId,
    division_id: 'div_1',
    name: teamNames[i % teamNames.length] || `Team ${i + 1}`,
    withdrawn: false,
    created_at: new Date().toISOString()
  }));

  const fmt = (formatStr || '').toLowerCase();
  let matches: Match[] = [];

  if (fmt.includes('round_robin')) {
    matches = generateRoundRobin(teams, tournamentId, 'div_1');
  } else if (fmt.includes('single')) {
    matches = generateSingleElimination(teams, tournamentId, 'div_1');
  } else {
    matches = generateDoubleElimination(teams, tournamentId, 'div_1');
  }

  // Pre-fill completed match scores for demo active tournaments so the bracket looks alive!
  if (tournamentId === 'tourney_2' || tournamentId === 'tourney_3' || tournamentId.startsWith('tourney_')) {
    const round1WinnerMatches = matches.filter(
      m => m.bracket_type === 'WINNER' && m.round_number === 1 && m.team1_id && m.team2_id
    );

    if (round1WinnerMatches.length > 0) {
      const m1 = round1WinnerMatches[0];
      matches = processMatchSubmission(
        matches,
        m1.id,
        [
          { id: `g1_${m1.id}`, match_id: m1.id, game_number: 1, team1_score: 11, team2_score: 7 },
          { id: `g2_${m1.id}`, match_id: m1.id, game_number: 2, team1_score: 11, team2_score: 9 }
        ],
        'BEST_OF_3_TO_11'
      );
    }

    if (round1WinnerMatches.length > 1) {
      const m2 = round1WinnerMatches[1];
      const updatedM2 = matches.find(m => m.id === m2.id);
      if (updatedM2 && updatedM2.team1_id && updatedM2.team2_id) {
        matches = processMatchSubmission(
          matches,
          m2.id,
          [
            { id: `g3_${m2.id}`, match_id: m2.id, game_number: 1, team1_score: 8, team2_score: 11 },
            { id: `g4_${m2.id}`, match_id: m2.id, game_number: 2, team1_score: 11, team2_score: 8 },
            { id: `g5_${m2.id}`, match_id: m2.id, game_number: 3, team1_score: 11, team2_score: 5 }
          ],
          'BEST_OF_3_TO_11'
        );
      }
    }
  }

  return { teams, matches };
}
