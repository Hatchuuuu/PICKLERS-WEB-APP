-- =====================================================================
-- MIGRATION: 20260718000002_p0_p1_security_fixes.sql
-- Description: Applies all P0 (Critical) and P1 (High) findings from
--              the microscopic 360-degree database audit.
-- =====================================================================

-- =====================================================================
-- P0 #1: Fix cross-user notification injection
-- Restrict INSERT to own user_id only. Server notifications must use
-- the Supabase service_role key (bypasses RLS).
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;

CREATE POLICY "Users can insert own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- P0 #2: Fix matches.created_by — enforce NOT NULL + INSERT check
-- =====================================================================
-- Set NOT NULL with server-side default so frontend never needs to send it
ALTER TABLE public.matches ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Backfill existing NULL rows so NOT NULL can be applied cleanly
-- (Assigns system-sentinel value for pre-existing orphan rows)
UPDATE public.matches SET created_by = '00000000-0000-0000-0000-000000000000' WHERE created_by IS NULL;

-- Now enforce NOT NULL
ALTER TABLE public.matches ALTER COLUMN created_by SET NOT NULL;

-- Tighten the INSERT policy: user can only create matches as themselves
DROP POLICY IF EXISTS "Authenticated users can insert matches." ON public.matches;
CREATE POLICY "Users can insert their own matches" ON public.matches
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =====================================================================
-- P0 #3: Fix increment_wallet_balance — add amount validation
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(amount INTEGER, user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auth check: only the wallet owner can top up
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Amount must be strictly positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive integer, got: %', amount;
  END IF;

  -- Cap single top-up to prevent runaway coin minting
  IF amount > 10000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum single top-up limit of 10000, got: %', amount;
  END IF;

  UPDATE public.wallets
  SET balance = balance + amount
  WHERE wallets.user_id = increment_wallet_balance.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) TO authenticated;

-- =====================================================================
-- P0 #4: Fix submit_match_score — add score and status validation
-- =====================================================================
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id uuid,
  p_games jsonb,
  p_updated_matches jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game record;
  match_update record;
  v_tournament_owner uuid;
BEGIN
  -- Auth: verify caller owns the tournament this match belongs to
  SELECT t.owner_id INTO v_tournament_owner
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON t.id = tm.tournament_id
  WHERE tm.id = p_match_id;

  IF auth.uid() IS NULL OR auth.uid() != v_tournament_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only the tournament owner can submit scores.';
  END IF;

  -- Insert/update games with score validation
  FOR game IN SELECT * FROM jsonb_to_recordset(p_games)
    AS x(id uuid, match_id uuid, game_number integer, team1_score integer, team2_score integer)
  LOOP
    -- Pickleball scores: 0–15 per game
    IF game.team1_score < 0 OR game.team1_score > 15 THEN
      RAISE EXCEPTION 'Invalid team1_score: %. Must be between 0 and 15.', game.team1_score;
    END IF;
    IF game.team2_score < 0 OR game.team2_score > 15 THEN
      RAISE EXCEPTION 'Invalid team2_score: %. Must be between 0 and 15.', game.team2_score;
    END IF;
    IF game.game_number < 1 OR game.game_number > 5 THEN
      RAISE EXCEPTION 'Invalid game_number: %. Must be between 1 and 5.', game.game_number;
    END IF;

    INSERT INTO public.match_games (id, match_id, game_number, team1_score, team2_score)
    VALUES (game.id, game.match_id, game.game_number, game.team1_score, game.team2_score)
    ON CONFLICT (id) DO UPDATE SET
      team1_score = EXCLUDED.team1_score,
      team2_score = EXCLUDED.team2_score;
  END LOOP;

  -- Update match bracket state with status validation
  FOR match_update IN SELECT * FROM jsonb_to_recordset(p_updated_matches)
    AS x(id uuid, winner_id uuid, status text, team1_id uuid, team2_id uuid)
  LOOP
    IF match_update.status NOT IN ('pending', 'in_progress', 'completed', 'bye') THEN
      RAISE EXCEPTION 'Invalid match status: %. Must be pending|in_progress|completed|bye.', match_update.status;
    END IF;

    UPDATE public.tournament_matches SET
      winner_id = match_update.winner_id,
      status    = match_update.status,
      team1_id  = match_update.team1_id,
      team2_id  = match_update.team2_id
    WHERE id = match_update.id;
  END LOOP;
END;
$$;

-- =====================================================================
-- P1 #5: Fix get_tournament_games — remove unnecessary SECURITY DEFINER,
--        add search_path hardening
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_tournament_games(t_id uuid)
RETURNS SETOF public.match_games
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mg.*
  FROM public.match_games mg
  JOIN public.tournament_matches tm ON tm.id = mg.match_id
  WHERE tm.tournament_id = t_id;
END;
$$;

-- =====================================================================
-- P1 #6: Fix delete_user — add search_path + null auth guard
-- =====================================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- =====================================================================
-- P1 #7: Add admin review policies for facility_applications
-- =====================================================================
DROP POLICY IF EXISTS "Admins can view all facility applications" ON public.facility_applications;
DROP POLICY IF EXISTS "Admins can update facility applications" ON public.facility_applications;

CREATE POLICY "Admins can view all facility applications" ON public.facility_applications
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update facility applications" ON public.facility_applications
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================================
-- P1 #8: Add FK columns to matches for facility/court referential integrity
-- =====================================================================
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS facility_id INTEGER REFERENCES public.facilities(id) ON DELETE SET NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS court_id INTEGER REFERENCES public.courts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_facility_id ON public.matches(facility_id);
CREATE INDEX IF NOT EXISTS idx_matches_court_id    ON public.matches(court_id);

-- =====================================================================
-- P1 #9: Prevent double-bookings at the database level
-- =====================================================================
ALTER TABLE public.bookings ADD CONSTRAINT IF NOT EXISTS bookings_no_double_book
UNIQUE (facility_id, court_name, date, time);

-- =====================================================================
-- BONUS: P2 quick wins included here (low effort, high value)
-- =====================================================================

-- Missing index on matches.created_by (used in every RLS UPDATE/DELETE check)
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches(created_by);

-- Partial index on notifications for unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON public.notifications(user_id, read) WHERE read = false;

-- Add created_at to wallets (every table should have it)
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- CHECK constraints for unconstrained status/level columns
ALTER TABLE public.player_profiles ADD CONSTRAINT IF NOT EXISTS player_profiles_level_check
  CHECK (level IN ('2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+'));

ALTER TABLE public.player_profiles ADD CONSTRAINT IF NOT EXISTS player_profiles_verification_status_check
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE public.facilities ADD CONSTRAINT IF NOT EXISTS facilities_rating_range
  CHECK (rating >= 0.0 AND rating <= 5.0);

ALTER TABLE public.courts ADD CONSTRAINT IF NOT EXISTS courts_status_check
  CHECK (status IN ('available', 'occupied', 'maintenance'));

ALTER TABLE public.tournament_matches ADD CONSTRAINT IF NOT EXISTS tournament_matches_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'bye') OR status IS NULL);

ALTER TABLE public.matches ADD CONSTRAINT IF NOT EXISTS matches_status_check
  CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled'));

-- Fix handle_new_user trigger to be idempotent (ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.player_profiles (id, name, level)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), '2.5')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Self-documenting table comments
COMMENT ON TABLE public.player_profiles IS 'Core user profiles. One per auth.users row, auto-created by handle_new_user trigger. RLS: public read, self-write with role lock.';
COMMENT ON TABLE public.facilities IS 'Pickleball venues. Multi-tenant via owner_id. RLS: public read, owner-only write.';
COMMENT ON TABLE public.courts IS 'Physical courts within a facility. FK to facilities(id). RLS: public read, facility-owner write.';
COMMENT ON TABLE public.bookings IS 'Court reservations. Status: upcoming → active → completed|cancelled. RLS: self + facility-owner read.';
COMMENT ON TABLE public.wallets IS 'Pickles coin wallet. Mutations via increment_wallet_balance RPC only. Balance >= 0 enforced by CHECK constraint.';
COMMENT ON TABLE public.tournaments IS 'Tournament definitions with bracket metadata. Owner-isolated via owner_id.';
COMMENT ON TABLE public.matches IS 'Open community pickup games. created_by tracks ownership for edit/delete. NOT NULL, defaults to auth.uid().';
COMMENT ON TABLE public.notifications IS 'User notification inbox. Users insert own; server inserts via service_role (bypasses RLS).';
COMMENT ON TABLE public.tournament_teams IS 'Teams registered to a tournament. player1_id = captain. ON DELETE SET NULL for grace handling.';
COMMENT ON TABLE public.tournament_matches IS 'Bracket match records. Status: pending → in_progress → completed|bye.';
COMMENT ON TABLE public.match_games IS 'Individual games within a tournament match. Scores validated 0–15 via submit_match_score RPC.';
COMMENT ON TABLE public.booking_requests IS 'Player booking requests pending facility owner review.';
COMMENT ON TABLE public.facility_applications IS 'Facility owner onboarding applications. Reviewed by admin role.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auth trigger: idempotently creates player_profile + wallet on signup. SECURITY DEFINER.';
COMMENT ON FUNCTION public.delete_user() IS 'Self-service account deletion. Auth-guarded. Cascades to all user data. SECURITY DEFINER.';
COMMENT ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) IS 'Top up wallet. Auth-checked, amount 1–10000. SECURITY DEFINER.';
COMMENT ON FUNCTION public.submit_match_score(UUID, JSONB, JSONB) IS 'Submit tournament match scores. Owner-checked, scores validated 0–15, status validated. SECURITY DEFINER.';
COMMENT ON FUNCTION public.get_tournament_games(UUID) IS 'Fetch all game rows for a tournament. SECURITY INVOKER — RLS applies normally.';
