import { create } from 'zustand';
import { Match, Team, ScoringFormat, Game } from '../lib/tournament/types';
import { generateSingleElimination, generateDoubleElimination, generateRoundRobin, generateSingleEliminationWithConsolation, generateRoundRobinWithPlayoffs } from '../lib/tournament/bracket-generator';
import { processMatchSubmission } from '../lib/tournament/tournament-service';
import { TournamentAPI } from '../lib/tournament/tournament-api';

export interface UITournament {
  id: string;
  name: string;
  format: string;
  division?: string;
  date?: string;
  teams?: number;
  maxTeams?: number;
  status: string;
  prize?: string;
  play_type?: string;
  scoring_format?: string;
}

interface TournamentState {
  matches: Match[];
  teams: Team[];
  tournaments: UITournament[]; // Track tournaments globally for UI
  isHydrating: boolean;
  hydrateFromSupabase: () => Promise<void>;
  generateBracket: (tournamentId: string, format: string, numTeams: number) => void;
  addTournament: (tournamentId: string, name: string, format: string, numTeams: number, options?: { date?: string; prize?: string; playType?: string; scoringFormat?: ScoringFormat; playoffSize?: number; customTeamNames?: string[]; teamsData?: {name: string, p1?: string, p2?: string}[] }) => Promise<void>;
  updateTeam: (teamId: string, name: string, playerId?: string) => Promise<void>;
  submitScore: (matchId: string, games: Game[], scoringFormat?: ScoringFormat) => Promise<void>;
  undoMatchResult: (matchId: string) => Promise<void>;
  getMatch: (matchId: string) => Match | undefined;
  getTeam: (teamId: string | null) => Team | undefined;
  advanceToPlayoffs: (tournamentId: string, topTeamIds: string[]) => Promise<void>;
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
          console.warn("Supabase hydration failed", e);
      } finally {
          set({ isHydrating: false });
      }
  },
  
  generateBracket: (tournamentId: string, format: string, numTeams: number) => {
    // Wrapper for the demo generate button (defaults to standard single elim)
    get().addTournament(tournamentId, "Generated Tournament", format, numTeams, {});
  },

  addTournament: async (tournamentId: string, name: string, format: string, numTeams: number, options: { date?: string; prize?: string; playType?: string; scoringFormat?: ScoringFormat; playoffSize?: number; customTeamNames?: string[]; teamsData?: {name: string, p1?: string, p2?: string}[] } = {}) => {
    const validNumTeams = Math.max(2, Math.min(256, numTeams || 4));
    const teams = Array.from({ length: validNumTeams }, (_, i) => {
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

    try {
      await TournamentAPI.createTournament({
          id: tournamentId,
          name: name || "New Tournament",
          format,
          teams_count: validNumTeams,
          status: "active",
          date: options.date || null,
          prize: options.prize || null,
          play_type: options.playType || "doubles",
          scoring_format: options.scoringFormat || 'BEST_OF_3_TO_11'
      }, teams, newMatches);

      // Check if we need to add to the tournaments array
      if (!get().tournaments.find(t => t.id === tournamentId)) {
        set(state => ({
          tournaments: [...state.tournaments, {
            id: tournamentId, 
            name, 
            format, 
            division: "Open", 
            date: options.date || new Date().toLocaleDateString(), 
            teams: validNumTeams, 
            maxTeams: validNumTeams, 
            status: "active", 
            prize: options.prize || "TBD",
            play_type: options.playType || "doubles",
            scoring_format: options.scoringFormat || 'BEST_OF_3_TO_11'
          }]
        }));
      }

      set(state => {
        const otherMatches = state.matches.filter(m => m.tournament_id !== tournamentId);
        const otherTeams = state.teams.filter(t => t.tournament_id !== tournamentId);
        return {
          matches: [...otherMatches, ...newMatches],
          teams: [...otherTeams, ...teams]
        };
      });
    } catch (e: unknown) {
      console.warn("Supabase createTournament failed, keeping local state:", e);
      // Fallback local memory state
      set(state => ({
        matches: [...state.matches.filter(m => m.tournament_id !== tournamentId), ...newMatches],
        teams: [...state.teams.filter(t => t.tournament_id !== tournamentId), ...teams]
      }));
    }
  },

  updateTeam: async (teamId: string, name: string, playerId?: string) => {
    set(state => ({
      teams: state.teams.map(t => t.id === teamId ? { ...t, name, player_id: playerId } : t)
    }));
    try {
      await TournamentAPI.updateTeam(teamId, name, playerId);
    } catch (e: unknown) {
      console.warn("Supabase updateTeam failed:", e);
    }
  },

  submitScore: async (matchId: string, games: Game[], formatOverride?: ScoringFormat) => {
    try {
      const { matches, tournaments } = get();
      const matchToUpdate = matches.find(m => m.id === matchId);
      const tournament = tournaments.find(t => t.id === matchToUpdate?.tournament_id);
      const scoringFormat = (formatOverride || tournament?.scoring_format || 'BEST_OF_3_TO_11') as ScoringFormat;

      const newMatches = processMatchSubmission(matches, matchId, games, scoringFormat);
      
      // Find the specific matches that were mutated to update Supabase efficiently
      const changedMatches = newMatches.filter(newM => {
          const oldM = matches.find(m => m.id === newM.id);
          return !oldM || oldM.winner_id !== newM.winner_id || oldM.status !== newM.status || oldM.team1_id !== newM.team1_id || oldM.team2_id !== newM.team2_id;
      });

      await TournamentAPI.submitMatchScore(matchId, games, changedMatches);
      set({ matches: newMatches });

    } catch (e: unknown) {
      console.warn("Supabase submitScore failed:", e);
      throw e; // Throw so the UI can catch and display the error inline
    }
  },


  undoMatchResult: async (matchId: string) => {
      const changedMatches: Match[] = [];
      set(state => {
          const matchIndex = state.matches.findIndex(m => m.id === matchId);
          if (matchIndex === -1) return state;

          const match = state.matches[matchIndex];
          if (match.status !== 'COMPLETED') return state;

          const oldWinner = match.winner_id;

          // Revert current match immutably
          const revertedMatch: Match = {
              ...match,
              status: 'PENDING',
              winner_id: null,
              loser_id: null
          };
          changedMatches.push(revertedMatch);

          const newMatches = state.matches.map((m, idx) => {
            if (idx === matchIndex) return revertedMatch;
            if (match.next_match_winner_goes_to && m.id === match.next_match_winner_goes_to && oldWinner) {
              const nextMatch: Match = { ...m };
              if (nextMatch.team1_id === oldWinner) nextMatch.team1_id = null;
              if (nextMatch.team2_id === oldWinner) nextMatch.team2_id = null;
              changedMatches.push(nextMatch);
              return nextMatch;
            }
            return m;
          });

          return { matches: newMatches };
      });

      if (changedMatches.length > 0) {
        try {
          await TournamentAPI.undoMatch(matchId, changedMatches);
        } catch (err) {
          console.warn("Failed to sync undoMatchResult to database:", err);
        }
      }
  },

  getMatch: (matchId: string) => get().matches.find(m => m.id === matchId),
  getTeam: (teamId: string | null) => {
    if (!teamId) return undefined;
    return get().teams.find(t => t.id === teamId);
  },

  advanceToPlayoffs: async (tournamentId: string, topTeamIds: string[]) => {
      const changedMatches: Match[] = [];
      set(state => {
          if (topTeamIds.length < 4) return state;

          // Find the round 101 playoff matches for this tournament
          const playoffR1 = state.matches
            .filter(m => m.tournament_id === tournamentId && m.bracket_type === 'PLAYOFF' && m.round_number === 101)
            .sort((a, b) => (a.match_sequence || 0) - (b.match_sequence || 0));
          
          if (playoffR1.length === 2) {
              // Match 1: Seed 1 vs Seed 4
              const updatedM1: Match = {
                ...playoffR1[0],
                team1_id: topTeamIds[0],
                team2_id: topTeamIds[3]
              };
              // Match 2: Seed 2 vs Seed 3
              const updatedM2: Match = {
                ...playoffR1[1],
                team1_id: topTeamIds[1],
                team2_id: topTeamIds[2]
              };
              changedMatches.push(updatedM1, updatedM2);

              const newMatches = state.matches.map(m => {
                if (m.id === updatedM1.id) return updatedM1;
                if (m.id === updatedM2.id) return updatedM2;
                return m;
              });

              return { matches: newMatches };
          }

          return state;
      });

      if (changedMatches.length > 0) {
        try {
          await Promise.all(
            changedMatches.map(m =>
              TournamentAPI.updateMatch(m.id, {
                team1_id: m.team1_id,
                team2_id: m.team2_id
              })
            )
          );
        } catch (err) {
          console.warn("Failed to sync advanceToPlayoffs to database:", err);
        }
      }
  }
}));
