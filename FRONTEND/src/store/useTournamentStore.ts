import { create } from 'zustand';
import { Match, Team, ScoringFormat, Game } from '../lib/tournament/types';
import { generateSingleElimination, generateDoubleElimination, generateRoundRobin, generateSingleEliminationWithConsolation, generateRoundRobinWithPlayoffs } from '../lib/tournament/bracket-generator';
import { processMatchSubmission } from '../lib/tournament/tournament-service';
import { TournamentAPI } from '../lib/tournament/tournament-api';

interface TournamentState {
  matches: Match[];
  teams: Team[];
  tournaments: any[]; // Track tournaments globally for UI
  isHydrating: boolean;
  hydrateFromSupabase: () => Promise<void>;
  generateBracket: (tournamentId: string, format: string, numTeams: number) => void;
  addTournament: (tournamentId: string, name: string, format: string, numTeams: number, options?: any) => void;
  updateTeam: (teamId: string, name: string, playerId?: string) => void;
  submitScore: (matchId: string, games: Game[], scoringFormat?: ScoringFormat) => void;
  undoMatchResult: (matchId: string) => void;
  getMatch: (matchId: string) => Match | undefined;
  getTeam: (teamId: string | null) => Team | undefined;
  advanceToPlayoffs: (tournamentId: string, topTeamIds: string[]) => void;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  matches: [],
  teams: [],
  tournaments: [],
  isHydrating: false,

  hydrateFromSupabase: async () => {
      set({ isHydrating: true });
      try {
          const dbTournaments = await TournamentAPI.getAllTournaments();
          if (dbTournaments && dbTournaments.length > 0) {
              set({ tournaments: dbTournaments });
          }
      } catch (e) {
          console.warn("Supabase hydration failed, using local mock data", e);
      } finally {
          set({ isHydrating: false });
      }
  },
  
  generateBracket: (tournamentId: string, format: string, numTeams: number) => {
    // Wrapper for the demo generate button (defaults to standard single elim)
    get().addTournament(tournamentId, "Generated Tournament", format, numTeams, {});
  },

  addTournament: (tournamentId: string, name: string, format: string, numTeams: number, options: any = {}) => {
    // Check if we need to add to the tournaments array
    if (!get().tournaments.find(t => t.id === tournamentId)) {
      set(state => ({
        tournaments: [...state.tournaments, {
          id: tournamentId, 
          name, 
          format, 
          division: "Open", 
          date: options.date || new Date().toLocaleDateString(), 
          teams: numTeams, 
          maxTeams: numTeams, 
          status: "active", 
          prize: options.prize || "TBD",
          play_type: options.playType || "doubles",
          scoring_format: options.scoringFormat || 'BEST_OF_3_TO_11'
        }]
      }));
    }

    const teams = Array.from({ length: numTeams }, (_, i) => {
      const customName = options.customTeamNames?.[i];
      return {
          id: `team_${i + 1}_${tournamentId}`,
          tournament_id: tournamentId,
          division_id: 'div_1',
          name: (customName && customName.trim() !== '') ? customName.trim() : `Team ${i + 1}`,
          withdrawn: false,
          created_at: new Date().toISOString()
      };
    });

    let newMatches: Match[] = [];
    if (format === 'single_consolation') {
      newMatches = generateSingleEliminationWithConsolation(teams, tournamentId, 'div_1');
    } else if (format === 'single') {
      newMatches = generateSingleElimination(teams, tournamentId, 'div_1');
    } else if (format === 'double') {
      newMatches = generateDoubleElimination(teams, tournamentId, 'div_1');
    } else if (format === 'round_robin_playoffs') {
      newMatches = generateRoundRobinWithPlayoffs(teams, tournamentId, 'div_1', options.playoffSize || 4);
    } else if (format === 'round_robin') {
      newMatches = generateRoundRobin(teams, tournamentId, 'div_1');
    }

    set(state => {
      // Remove any existing matches/teams for this tournament if we are regenerating
      const filteredTeams = state.teams.filter(t => t.tournament_id !== tournamentId);
      const filteredMatches = state.matches.filter(m => m.tournament_id !== tournamentId);
      return {
        teams: [...filteredTeams, ...teams],
        matches: [...filteredMatches, ...newMatches]
      }
    });

    // Fire and forget persistence to Supabase
    TournamentAPI.createTournament({
        id: tournamentId,
        name: name || "New Tournament",
        format,
        teams_count: numTeams,
        status: "active",
        date: options.date || null,
        prize: options.prize || null,
        play_type: options.playType || "doubles",
        scoring_format: options.scoringFormat || 'BEST_OF_3_TO_11'
    }, teams, newMatches).catch(e => console.warn("Could not save tournament to Supabase:", e));
  },

  updateTeam: (teamId: string, name: string, playerId?: string) => {
    set(state => ({
        teams: state.teams.map(t => t.id === teamId ? { ...t, name, player_id: playerId } : t)
    }));
    TournamentAPI.updateTeam(teamId, name, playerId).catch(e => console.warn("Supabase updateTeam failed:", e));
  },

  submitScore: (matchId: string, games: Game[]) => {
    const { matches, tournaments } = get();
    try {
      const matchToUpdate = matches.find(m => m.id === matchId);
      const tournament = tournaments.find(t => t.id === matchToUpdate?.tournament_id);
      const scoringFormat = tournament?.scoring_format || 'BEST_OF_3_TO_11';

      const newMatches = processMatchSubmission(matches, matchId, games, scoringFormat);
      set({ matches: newMatches });

      // Find the specific matches that were mutated to update Supabase efficiently
      const changedMatches = newMatches.filter(newM => {
          const oldM = matches.find(m => m.id === newM.id);
          return !oldM || oldM.winner_id !== newM.winner_id || oldM.status !== newM.status || oldM.team1_id !== newM.team1_id || oldM.team2_id !== newM.team2_id;
      });

      TournamentAPI.submitMatchScore(matchId, games, changedMatches).catch(e => console.warn("Supabase submitScore failed:", e));

    } catch (e: any) {
      throw e; // Throw so the UI can catch and display the error inline
    }
  },


  undoMatchResult: (matchId: string) => {
      set(state => {
          const newMatches = [...state.matches];
          const matchIndex = newMatches.findIndex(m => m.id === matchId);
          if (matchIndex === -1) return state;

          const match = newMatches[matchIndex];
          if (match.status !== 'COMPLETED') return state;

          const oldWinner = match.winner_id;

          // Revert current match
          newMatches[matchIndex] = {
              ...match,
              status: 'PENDING',
              winner_id: null,
              loser_id: null
          };

          // Remove winner from next match if they are there
          if (match.next_match_winner_goes_to && oldWinner) {
              const nextIndex = newMatches.findIndex(m => m.id === match.next_match_winner_goes_to);
              if (nextIndex !== -1) {
                  const nextMatch = { ...newMatches[nextIndex] };
                  if (nextMatch.team1_id === oldWinner) nextMatch.team1_id = null;
                  if (nextMatch.team2_id === oldWinner) nextMatch.team2_id = null;
                  newMatches[nextIndex] = nextMatch;
              }
          }

          return { matches: newMatches };
      });
  },

  getMatch: (matchId: string) => get().matches.find(m => m.id === matchId),
  getTeam: (teamId: string | null) => {
    if (!teamId) return undefined;
    return get().teams.find(t => t.id === teamId);
  },

  advanceToPlayoffs: (tournamentId: string, topTeamIds: string[]) => {
      set(state => {
          const newMatches = [...state.matches];
          
          // Find the round 101 playoff matches for this tournament
          const playoffR1 = newMatches.filter(m => m.tournament_id === tournamentId && m.bracket_type === 'PLAYOFF' && m.round_number === 101).sort((a, b) => (a.match_sequence || 0) - (b.match_sequence || 0));
          
          if (playoffR1.length === 2 && topTeamIds.length >= 4) {
              // Match 1: Seed 1 vs Seed 4
              playoffR1[0].team1_id = topTeamIds[0];
              playoffR1[0].team2_id = topTeamIds[3];
              
              // Match 2: Seed 2 vs Seed 3
              playoffR1[1].team1_id = topTeamIds[1];
              playoffR1[1].team2_id = topTeamIds[2];
          }

          return { matches: newMatches };
      });
  }
}));
