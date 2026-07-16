-- =====================================================================
-- MIGRATION: 20260716000008_10x_world_class_refinements.sql
-- Description: JSONB constraints, Enum State Machines, ON DELETE SET NULL, 
--              Strict Booleans, Match Games RLS Lockdown, Query Indexes
-- =====================================================================

-- ---------------------------------------------------------
-- 1. SECURITY: Patch match_games RLS Vulnerability
-- ---------------------------------------------------------
-- Drop the generic owner checks
DROP POLICY IF EXISTS "Owners can update match games." ON public.match_games;
DROP POLICY IF EXISTS "Owners can insert match games." ON public.match_games;

-- Restrict to the specific tournament owner via deep JOIN
CREATE POLICY "Owners can insert match games." ON public.match_games FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tournament_matches tm
    JOIN public.tournaments t ON t.id = tm.tournament_id
    WHERE tm.id = match_id AND t.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update match games." ON public.match_games FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.tournament_matches tm
    JOIN public.tournaments t ON t.id = tm.tournament_id
    WHERE tm.id = match_id AND t.owner_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- 2. DATA INTEGRITY: Strict JSONB Array Validation
-- ---------------------------------------------------------
-- Prevent frontend .map() crashes by ensuring players and blocked_dates are always valid arrays
ALTER TABLE public.tournaments ADD CONSTRAINT tournaments_players_is_array CHECK (jsonb_typeof(players) = 'array');
ALTER TABLE public.tournament_teams ADD CONSTRAINT tournament_teams_players_is_array CHECK (jsonb_typeof(players) = 'array' OR players IS NULL);
ALTER TABLE public.matches ADD CONSTRAINT matches_players_is_array CHECK (jsonb_typeof(players) = 'array');
ALTER TABLE public.courts ADD CONSTRAINT courts_blocked_dates_is_array CHECK (jsonb_typeof(blocked_dates) = 'array' OR blocked_dates IS NULL);

-- ---------------------------------------------------------
-- 3. DATA INTEGRITY: Orphaned Row Crash Prevention (ON DELETE SET NULL)
-- ---------------------------------------------------------
-- Drop existing constraints that default to NO ACTION
ALTER TABLE public.tournament_teams DROP CONSTRAINT IF EXISTS tournament_teams_player1_id_fkey;
ALTER TABLE public.tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_winner_id_fkey;
ALTER TABLE public.tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_loser_id_fkey;

-- Recreate with ON DELETE SET NULL to gracefully handle deleted teams/players
ALTER TABLE public.tournament_teams ADD CONSTRAINT tournament_teams_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.tournament_teams(id) ON DELETE SET NULL;
ALTER TABLE public.tournament_matches ADD CONSTRAINT tournament_matches_loser_id_fkey FOREIGN KEY (loser_id) REFERENCES public.tournament_teams(id) ON DELETE SET NULL;

-- ---------------------------------------------------------
-- 4. DATA INTEGRITY: State Machine Enums & Booleans
-- ---------------------------------------------------------
-- Eliminate Tri-state Booleans (ensure NOT NULL)
-- Facilities
UPDATE public.facilities SET favorited = false WHERE favorited IS NULL;
ALTER TABLE public.facilities ALTER COLUMN favorited SET NOT NULL;
ALTER TABLE public.facilities ALTER COLUMN favorited SET DEFAULT false;

-- Player Profiles
UPDATE public.player_profiles SET online = false WHERE online IS NULL;
ALTER TABLE public.player_profiles ALTER COLUMN online SET NOT NULL;
ALTER TABLE public.player_profiles ALTER COLUMN online SET DEFAULT false;

-- Notifications
UPDATE public.notifications SET read = false WHERE read IS NULL;
ALTER TABLE public.notifications ALTER COLUMN read SET NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN read SET DEFAULT false;

-- Tournament Teams
UPDATE public.tournament_teams SET withdrawn = false WHERE withdrawn IS NULL;
ALTER TABLE public.tournament_teams ALTER COLUMN withdrawn SET NOT NULL;
ALTER TABLE public.tournament_teams ALTER COLUMN withdrawn SET DEFAULT false;


-- Add CHECK constraints for State Machines
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('upcoming', 'completed', 'cancelled', 'active', 'pending'));
ALTER TABLE public.booking_requests ADD CONSTRAINT booking_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.facility_applications ADD CONSTRAINT facility_applications_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_role_check CHECK (role IN ('player', 'owner', 'admin'));

-- ---------------------------------------------------------
-- 5. PERFORMANCE: High-Frequency Query Indexes
-- ---------------------------------------------------------
-- Indexes on columns frequently used in WHERE clauses for dashboard filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_courts_status ON public.courts(status);
