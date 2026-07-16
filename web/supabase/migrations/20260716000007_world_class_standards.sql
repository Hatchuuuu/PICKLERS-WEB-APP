-- =====================================================================
-- MIGRATION: 20260716000007_world_class_standards.sql
-- Description: Security lockdown, index performance, and auto-updating timestamps.
-- =====================================================================

-- ---------------------------------------------------------
-- 1. DATA INTEGRITY: Auto-updating timestamps
-- ---------------------------------------------------------
-- Function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at columns where missing
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.tournament_teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.facility_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.match_games ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create triggers
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
        AND table_name IN ('facilities', 'courts', 'player_profiles', 'notifications', 'bookings', 'tournaments', 'tournament_teams', 'tournament_matches', 'matches', 'booking_requests', 'wallets', 'facility_applications', 'match_games')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------
-- 2. PERFORMANCE: Foreign Key Indexes
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tournaments_owner_id ON public.tournaments(owner_id);
CREATE INDEX IF NOT EXISTS idx_courts_facility_id ON public.courts(facility_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON public.bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament_id ON public.tournament_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_player1_id ON public.tournament_teams(player1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_team1_id ON public.tournament_matches(team1_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_team2_id ON public.tournament_matches(team2_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_facility_id ON public.booking_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_applications_user_id ON public.facility_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_games_match_id ON public.match_games(match_id);

-- ---------------------------------------------------------
-- 3. SECURITY: Fix RLS Vulnerabilities
-- ---------------------------------------------------------

-- WALLETS
-- Remove extremely insecure 'FOR ALL USING (true)' policy
DROP POLICY IF EXISTS "Service can update wallets" ON public.wallets;

-- TOURNAMENT TEAMS & MATCHES
-- Drop insecure "true" policies
DROP POLICY IF EXISTS "Owners can insert tournament teams." ON public.tournament_teams;
DROP POLICY IF EXISTS "Owners can update tournament teams." ON public.tournament_teams;
DROP POLICY IF EXISTS "Owners can insert tournament matches." ON public.tournament_matches;
DROP POLICY IF EXISTS "Owners can update tournament matches." ON public.tournament_matches;

CREATE POLICY "Owners can insert tournament teams." ON public.tournament_teams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);
CREATE POLICY "Owners can update tournament teams." ON public.tournament_teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);
CREATE POLICY "Owners can insert tournament matches." ON public.tournament_matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);
CREATE POLICY "Owners can update tournament matches." ON public.tournament_matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- SECURE increment_wallet_balance RPC
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(amount INTEGER, user_id UUID)
RETURNS void AS $$
BEGIN
  -- Security check: users can only increment their OWN wallet
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.wallets 
  SET balance = balance + amount 
  WHERE wallets.user_id = increment_wallet_balance.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURE submit_match_score RPC
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id uuid,
  p_games jsonb,
  p_updated_matches jsonb
)
RETURNS void AS $$
DECLARE
  game record;
  match_update record;
  v_tournament_owner uuid;
BEGIN
  -- Security check: Verify caller owns the tournament the match belongs to
  SELECT t.owner_id INTO v_tournament_owner
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON t.id = tm.tournament_id
  WHERE tm.id = p_match_id;

  IF auth.uid() IS NULL OR auth.uid() != v_tournament_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only the tournament owner can submit scores.';
  END IF;

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
