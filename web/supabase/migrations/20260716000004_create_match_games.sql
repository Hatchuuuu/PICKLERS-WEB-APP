CREATE TABLE IF NOT EXISTS public.match_games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  game_number integer NOT NULL,
  team1_score integer,
  team2_score integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match games are viewable by everyone." ON public.match_games FOR SELECT USING (true);
CREATE POLICY "Owners can insert match games." ON public.match_games FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Owners can update match games." ON public.match_games FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));

CREATE OR REPLACE FUNCTION public.get_tournament_games(t_id uuid)
RETURNS SETOF public.match_games AS $$
BEGIN
  RETURN QUERY
  SELECT mg.*
  FROM public.match_games mg
  JOIN public.tournament_matches tm ON tm.id = mg.match_id
  WHERE tm.tournament_id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id uuid,
  p_games jsonb,
  p_updated_matches jsonb
)
RETURNS void AS $$
DECLARE
  game record;
  match_update record;
BEGIN
  -- Insert games
  FOR game IN SELECT * FROM jsonb_to_recordset(p_games) AS x(id uuid, match_id uuid, game_number integer, team1_score integer, team2_score integer)
  LOOP
    INSERT INTO public.match_games (id, match_id, game_number, team1_score, team2_score)
    VALUES (game.id, game.match_id, game.game_number, game.team1_score, game.team2_score)
    ON CONFLICT (id) DO UPDATE SET 
      team1_score = EXCLUDED.team1_score,
      team2_score = EXCLUDED.team2_score;
  END LOOP;

  -- Update matches
  FOR match_update IN SELECT * FROM jsonb_to_recordset(p_updated_matches) AS x(id uuid, winner_id uuid, status text, team1_id uuid, team2_id uuid)
  LOOP
    UPDATE public.tournament_matches
    SET 
      winner_id = match_update.winner_id,
      status = match_update.status,
      team1_id = match_update.team1_id,
      team2_id = match_update.team2_id
    WHERE id = match_update.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
