import { supabase } from '../supabase';
import { Match, Team, Game } from './types';

export const TournamentAPI = {
  // Fetch a tournament and all its relational data
  async getTournamentData(tournamentId: string) {
    // We run parallel fetches for maximum performance
    const [tournamentsRes, teamsRes, matchesRes, gamesRes] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId),
      supabase.from('matches').select('*').eq('tournament_id', tournamentId),
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
  async createTournament(tournament: any, teams: Team[], matches: Match[]) {
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
      const { error: mError } = await supabase.from('matches').insert(
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
  async submitMatchScore(_matchId: string, games: Game[], updatedMatches: Match[]) {
    // In a real app we'd use a Postgres Function (RPC) to handle this transactionally.
    // Here we will batch update.
    
    // 1. Insert Games
    if (games.length > 0) {
        await supabase.from('match_games').insert(games.map(g => ({
            id: g.id,
            match_id: g.match_id,
            game_number: g.game_number,
            team1_score: g.team1_score,
            team2_score: g.team2_score
        })));
    }

    // 2. Upsert Matches (the current match + the next match that got advanced)
    // Supabase upsert requires all primary keys
    await Promise.all(
        updatedMatches.map(match => 
            supabase.from('matches').update({
                winner_id: match.winner_id,
                status: match.status,
                team1_id: match.team1_id,
                team2_id: match.team2_id
            }).eq('id', match.id)
        )
    );
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
