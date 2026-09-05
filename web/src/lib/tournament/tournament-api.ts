import { supabase } from '../supabase';
import { Match, Team, Game } from './types';

export const TournamentAPI = {
  // Fetch a tournament and all its relational data
  async getTournamentData(tournamentId: string) {
    // We run parallel fetches for maximum performance
    const [tournamentsRes, teamsRes, matchesRes, gamesRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId),
      supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId),
      // In a real app we'd join games to matches, but here we fetch games for the tournament
      // using an inner join or fetching all games for the matches.
      supabase.rpc('get_tournament_games', { t_id: tournamentId }).then(res => res.error ? { data: [] } : res)
    ]);

    return {
      tournament: tournamentsRes.data,
      teams: teamsRes.data || [],
      matches: matchesRes.data || [],
      games: gamesRes.data || []
    };
  },

  // Save the entire newly generated tournament
  async createTournament(tournament: Record<string, unknown>, teams: Team[], matches: Match[]) {
    // 1. Insert Tournament
    const { error: tError } = await supabase.from('tournaments').insert([tournament]);
    if (tError) throw tError;

    // 2. Insert Teams
    if (teams.length > 0) {
      const { error: teamError } = await supabase.from('tournament_teams').insert(
        teams.map(t => ({
          id: t.id,
          tournament_id: t.tournament_id,
          name: t.name,
          player1_id: t.player_id,
          withdrawn: t.withdrawn
        }))
      );
      if (teamError) throw teamError;
    }

    // 3. Insert Matches
    if (matches.length > 0) {
      const { error: mError } = await supabase.from('tournament_matches').insert(
        matches.map(m => ({
          id: m.id,
          tournament_id: m.tournament_id,
          bracket_type: m.bracket_type,
          round_number: m.round_number,
          match_sequence: m.match_sequence,
          team1_id: m.team1_id,
          team2_id: m.team2_id,
          winner_id: m.winner_id,
          loser_id: m.loser_id,
          status: m.status,
          next_match_winner_goes_to: m.next_match_winner_goes_to,
          next_match_loser_goes_to: m.next_match_loser_goes_to
        }))
      );
      if (mError) throw mError;
    }
  },

  // Update a team (assign a player)
  async updateTeam(teamId: string, name: string, playerId?: string) {
    const { error } = await supabase
      .from('tournament_teams')
      .update({ name, player1_id: playerId })
      .eq('id', teamId);
    if (error) throw error;
  },

  // Submit score and advance bracket
  async submitMatchScore(matchId: string, games: Game[], updatedMatches: Match[]) {
    const { error } = await supabase.rpc('submit_match_score', {
      p_match_id: matchId,
      p_games: games.map(g => ({
          id: g.id,
          match_id: g.match_id,
          game_number: g.game_number,
          team1_score: g.team1_score,
          team2_score: g.team2_score
      })),
      p_updated_matches: updatedMatches.map(match => ({
          id: match.id,
          winner_id: match.winner_id,
          status: match.status,
          team1_id: match.team1_id,
          team2_id: match.team2_id
      }))
    });

    if (error) {
      console.error("Failed to submit match score via RPC:", error);
      throw error;
    }
  },

  async updateMatch(matchId: string, updates: Partial<Match>) {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.winner_id !== undefined) dbUpdates.winner_id = updates.winner_id;
    if (updates.loser_id !== undefined) dbUpdates.loser_id = updates.loser_id;
    if (updates.team1_id !== undefined) dbUpdates.team1_id = updates.team1_id;
    if (updates.team2_id !== undefined) dbUpdates.team2_id = updates.team2_id;

    const { error } = await supabase
      .from('tournament_matches')
      .update(dbUpdates)
      .eq('id', matchId);
    if (error) {
      console.error("Failed to update tournament match:", error);
      throw error;
    }
  },

  async undoMatch(matchId: string, revertedMatches: Match[]) {
    if (revertedMatches.length === 0) return;
    await Promise.all(
      revertedMatches.map(m =>
        supabase
          .from('tournament_matches')
          .update({
            status: m.status,
            winner_id: m.winner_id,
            loser_id: m.loser_id,
            team1_id: m.team1_id,
            team2_id: m.team2_id,
          })
          .eq('id', m.id)
      )
    );
    await supabase.from('tournament_games').delete().eq('match_id', matchId);
  },

  async getAllTournaments() {
    const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Supabase error:", error);
        return [];
    }
    return data;
  }
};
