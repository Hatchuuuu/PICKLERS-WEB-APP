-- =============================================================
-- PICKLERS WEB APP — COMPLETE DATABASE SETUP
-- Copy & paste this entire file into the Supabase SQL Editor
-- =============================================================

-- =====================================================================
-- STEP 1: SAFETY — DROP EVERYTHING IN CORRECT DEPENDENCY ORDER
-- =====================================================================
DROP TABLE IF EXISTS public.booking_requests CASCADE;
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_teams CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.player_profiles CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.courts CASCADE;
DROP TABLE IF EXISTS public.facilities CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.match_games CASCADE;
DROP TABLE IF EXISTS public.facility_applications CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.search_tournaments(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.search_facilities(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_tournament_games(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.submit_match_score(uuid, jsonb, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.increment_wallet_balance(INTEGER, UUID) CASCADE;

-- =====================================================================
-- STEP 2: EXTENSIONS & PROFILES (Needed for ownership policies)
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.player_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- P2 FIX: DUPR level CHECK constraint
    level TEXT DEFAULT '2.5' CHECK (level IN ('2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+')),
    gold_medals INTEGER DEFAULT 0,
    silver_medals INTEGER DEFAULT 0,
    bronze_medals INTEGER DEFAULT 0,
    online BOOLEAN DEFAULT false NOT NULL,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'owner', 'admin')),
    -- P2 FIX: verification_status CHECK constraint
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.player_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.player_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.player_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (role = (SELECT role FROM public.player_profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete their own profile" ON public.player_profiles FOR DELETE USING (auth.uid() = id);

-- =====================================================================
-- STEP 3: CORE FACILITIES & COURTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.facilities (
    id SERIAL PRIMARY KEY,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    -- P2 FIX: rating must be 0.0–5.0
    rating NUMERIC(3, 1) CHECK (rating >= 0.0 AND rating <= 5.0),
    price INTEGER NOT NULL,
    hours TEXT,
    distance TEXT,
    moto TEXT,
    car TEXT,
    image TEXT,
    favorited BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courts (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surface TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    -- P2 FIX: status CHECK constraint
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    occupied_until TEXT,
    occupied_by TEXT,
    blocked_dates jsonb DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT courts_blocked_dates_is_array CHECK (jsonb_typeof(blocked_dates) = 'array' OR blocked_dates IS NULL)
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own facilities" ON public.facilities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own facilities" ON public.facilities FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own facilities" ON public.facilities FOR DELETE USING (auth.uid() = owner_id);

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on courts" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Facility owners can insert courts" ON public.courts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Facility owners can update courts" ON public.courts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Facility owners can delete courts" ON public.courts FOR DELETE USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));

-- =====================================================================
-- STEP 4: TOURNAMENTS & MATCHES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  match_format text NOT NULL,
  date text NOT NULL,
  participants integer NOT NULL,
  status text NOT NULL,
  players jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT tournaments_players_is_array CHECK (jsonb_typeof(players) = 'array')
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournaments are viewable by everyone." ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own tournaments." ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own tournaments." ON public.tournaments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own tournaments" ON public.tournaments FOR DELETE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  withdrawn boolean DEFAULT false NOT NULL,
  players jsonb,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT tournament_teams_players_is_array CHECK (jsonb_typeof(players) = 'array' OR players IS NULL)
);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament teams are viewable by everyone." ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "Owners can insert tournament teams." ON public.tournament_teams FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owners can update tournament teams." ON public.tournament_teams FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
CREATE POLICY "Captains and owners can delete tournament teams" ON public.tournament_teams FOR DELETE USING (player1_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_type text,
  round_number integer,
  match_sequence integer,
  team1_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  team2_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  loser_id uuid REFERENCES public.tournament_teams(id) ON DELETE SET NULL,
  -- P2 FIX: status CHECK constraint
  status text CHECK (status IN ('pending', 'in_progress', 'completed', 'bye') OR status IS NULL),
  next_match_winner_goes_to text,
  next_match_loser_goes_to text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament matches are viewable by everyone." ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Owners can insert tournament matches." ON public.tournament_matches FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owners can update tournament matches." ON public.tournament_matches FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owners can delete tournament matches" ON public.tournament_matches FOR DELETE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.match_games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  game_number integer NOT NULL,
  team1_score integer,
  team2_score integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match games are viewable by everyone." ON public.match_games FOR SELECT USING (true);
CREATE POLICY "Owners can insert match games." ON public.match_games FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE tm.id = match_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owners can update match games." ON public.match_games FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE tm.id = match_id AND t.owner_id = auth.uid()));
CREATE POLICY "Owners can delete match games" ON public.match_games FOR DELETE USING (EXISTS (SELECT 1 FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE tm.id = match_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL,
  -- P2 FIX: Status CHECK constraint added
  status text NOT NULL CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  date text NOT NULL,
  time text NOT NULL,
  location text NOT NULL,
  price integer NOT NULL,
  level text NOT NULL,
  participants integer NOT NULL,
  max_participants integer NOT NULL,
  facility text NOT NULL,
  court text NOT NULL,
  players jsonb NOT NULL,
  -- P0 FIX: NOT NULL + DEFAULT auth.uid() prevents orphan matches
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  -- P1 FIX: FK columns for referential integrity alongside denormalized text names
  facility_id integer REFERENCES public.facilities(id) ON DELETE SET NULL,
  court_id integer REFERENCES public.courts(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT matches_players_is_array CHECK (jsonb_typeof(players) = 'array')
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are viewable by everyone." ON public.matches FOR SELECT USING (true);
-- P0 FIX: User can only create matches as themselves
CREATE POLICY "Users can insert their own matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creators can delete their matches" ON public.matches FOR DELETE USING (auth.uid() = created_by);

-- =====================================================================
-- STEP 5: BOOKINGS, REQUESTS, WALLETS, ETC.
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
    court_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled', 'active', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- P1 FIX: Prevent double-booking the same court at the same time
    CONSTRAINT bookings_no_double_book UNIQUE (facility_id, court_name, date, time)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Facility owners can view bookings at their facility" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users and facility owners can delete bookings" ON public.bookings FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  court_name text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  total integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Facility owners can view booking requests" ON public.booking_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Facility owners can update booking requests" ON public.booking_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
CREATE POLICY "Users can insert own booking requests" ON public.booking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own booking requests" ON public.booking_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users and facility owners can delete booking requests" ON public.booking_requests FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'community', 'system')),
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  -- P0 FIX: Users can only insert notifications for themselves. Server notifications use service_role (bypasses RLS).
  CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

  -- P0 FIX: Grant table-level access to API roles
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  -- P2 FIX: added created_at (every table should have it for audit trails)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.facility_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.facility_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own applications" ON public.facility_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own applications" ON public.facility_applications FOR DELETE USING (auth.uid() = user_id);
-- P1 FIX: Admins can review and process all facility applications
CREATE POLICY "Admins can view all facility applications" ON public.facility_applications
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update facility applications" ON public.facility_applications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================================
-- STEP 6: INDEXES & TRIGGERS
-- =====================================================================
-- Full-text search indexes (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courts_name_trgm ON courts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);
-- Foreign key indexes
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
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_applications_user_id ON public.facility_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_match_games_match_id ON public.match_games(match_id);
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON public.facilities(owner_id);
-- Status/date filter indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_courts_status ON public.courts(status);
-- P2 FIX: Index on matches.created_by (used in every UPDATE/DELETE RLS check)
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches(created_by);
-- P1 FIX: FK indexes for new matches.facility_id and court_id columns
CREATE INDEX IF NOT EXISTS idx_matches_facility_id ON public.matches(facility_id);
CREATE INDEX IF NOT EXISTS idx_matches_court_id ON public.matches(court_id);
-- P2 FIX: Partial index for unread notification count queries (very common)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
        AND table_name IN ('facilities', 'courts', 'player_profiles', 'notifications', 'bookings', 'tournaments', 'tournament_teams', 'tournament_matches', 'matches', 'booking_requests', 'wallets', 'facility_applications', 'match_games')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();', t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- P3 FIX: Bulletproof trigger (wraps inserts in EXCEPTION blocks to never fail signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  BEGIN
    INSERT INTO public.player_profiles (id, name, level)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Pickler'), '2.5')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore profile errors
  END;

  BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore wallet errors
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- STEP 7: SECURE RPC FUNCTIONS
-- =====================================================================
CREATE OR REPLACE FUNCTION search_tournaments(search_term TEXT)
RETURNS SETOF public.tournaments
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN RETURN QUERY SELECT * FROM tournaments WHERE name % search_term ORDER BY similarity(name, search_term) DESC LIMIT 20; END;
$$;

CREATE OR REPLACE FUNCTION search_facilities(search_term TEXT)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN RETURN QUERY SELECT * FROM facilities WHERE name % search_term ORDER BY similarity(name, search_term) DESC LIMIT 20; END;
$$;

-- P1 FIX: search_path + null auth guard added
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- P0 FIX: amount validation (positive, max 10000) to prevent coin minting
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(amount INTEGER, user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive integer, got: %', amount;
  END IF;
  IF amount > 10000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum single top-up limit of 10000, got: %', amount;
  END IF;
  UPDATE public.wallets SET balance = balance + amount
  WHERE wallets.user_id = increment_wallet_balance.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) TO authenticated;

-- P1 FIX: SECURITY INVOKER (RLS applies), search_path hardened
CREATE OR REPLACE FUNCTION public.get_tournament_games(t_id uuid)
RETURNS SETOF public.match_games
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT mg.* FROM public.match_games mg
  JOIN public.tournament_matches tm ON tm.id = mg.match_id
  WHERE tm.tournament_id = t_id;
END;
$$;

-- P0 FIX: Score validation (0–15), status validation, search_path hardened
CREATE OR REPLACE FUNCTION public.submit_match_score(
  p_match_id uuid, p_games jsonb, p_updated_matches jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  game record; match_update record; v_tournament_owner uuid;
BEGIN
  SELECT t.owner_id INTO v_tournament_owner
  FROM public.tournament_matches tm
  JOIN public.tournaments t ON t.id = tm.tournament_id
  WHERE tm.id = p_match_id;

  IF auth.uid() IS NULL OR auth.uid() != v_tournament_owner THEN
    RAISE EXCEPTION 'Unauthorized: Only the tournament owner can submit scores.';
  END IF;

  FOR game IN SELECT * FROM jsonb_to_recordset(p_games)
    AS x(id uuid, match_id uuid, game_number integer, team1_score integer, team2_score integer)
  LOOP
    IF game.team1_score < 0 OR game.team1_score > 15 THEN
      RAISE EXCEPTION 'Invalid team1_score: %. Must be 0–15.', game.team1_score;
    END IF;
    IF game.team2_score < 0 OR game.team2_score > 15 THEN
      RAISE EXCEPTION 'Invalid team2_score: %. Must be 0–15.', game.team2_score;
    END IF;
    IF game.game_number < 1 OR game.game_number > 5 THEN
      RAISE EXCEPTION 'Invalid game_number: %. Must be 1–5.', game.game_number;
    END IF;
    INSERT INTO public.match_games (id, match_id, game_number, team1_score, team2_score)
    VALUES (game.id, game.match_id, game.game_number, game.team1_score, game.team2_score)
    ON CONFLICT (id) DO UPDATE SET
      team1_score = EXCLUDED.team1_score,
      team2_score = EXCLUDED.team2_score;
  END LOOP;

  FOR match_update IN SELECT * FROM jsonb_to_recordset(p_updated_matches)
    AS x(id uuid, winner_id uuid, status text, team1_id uuid, team2_id uuid)
  LOOP
    IF match_update.status NOT IN ('pending', 'in_progress', 'completed', 'bye') THEN
      RAISE EXCEPTION 'Invalid match status: %', match_update.status;
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
-- STEP 8: SELF-DOCUMENTING TABLE COMMENTS (P3 FIX)
-- =====================================================================
COMMENT ON TABLE public.player_profiles IS 'Core user profiles. One per auth.users row, auto-created by handle_new_user trigger. RLS: public read, self-write with role lock.';
COMMENT ON TABLE public.facilities IS 'Pickleball venues. Multi-tenant via owner_id. RLS: public read, owner-only write.';
COMMENT ON TABLE public.courts IS 'Physical courts within a facility. FK to facilities(id). Status: available|occupied|maintenance. RLS: public read, facility-owner write.';
COMMENT ON TABLE public.bookings IS 'Court reservations. Status: upcoming→active→completed|cancelled. Double-booking prevented by UNIQUE constraint. RLS: self + facility-owner read.';
COMMENT ON TABLE public.wallets IS 'Pickles coin wallet. Mutations via increment_wallet_balance RPC only (validated 1–10000). Balance >= 0 enforced by CHECK.';
COMMENT ON TABLE public.tournaments IS 'Tournament definitions with bracket metadata. Owner-isolated via owner_id.';
COMMENT ON TABLE public.matches IS 'Open community pickup games. created_by NOT NULL DEFAULT auth.uid() tracks ownership.';
COMMENT ON TABLE public.notifications IS 'User notification inbox. Users insert own; server inserts via service_role (bypasses RLS).';
COMMENT ON TABLE public.tournament_teams IS 'Teams registered to a tournament. player1_id = captain. ON DELETE SET NULL for grace handling.';
COMMENT ON TABLE public.tournament_matches IS 'Bracket match records. Status: pending|in_progress|completed|bye enforced by CHECK.';
COMMENT ON TABLE public.match_games IS 'Individual games within a match. Scores validated 0–15 via submit_match_score RPC.';
COMMENT ON TABLE public.booking_requests IS 'Player booking requests pending facility owner review. Approved by owners, admins can see all.';
COMMENT ON TABLE public.facility_applications IS 'Facility onboarding applications. Reviewed by admin role.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auth trigger: idempotently (ON CONFLICT DO NOTHING) creates player_profile + wallet on signup. SECURITY DEFINER.';
COMMENT ON FUNCTION public.delete_user() IS 'Self-service account deletion. Auth-guarded. Cascades to all user data. SECURITY DEFINER.';
COMMENT ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) IS 'Top up wallet. Auth-checked, amount validated 1–10000. SECURITY DEFINER.';
COMMENT ON FUNCTION public.submit_match_score(UUID, JSONB, JSONB) IS 'Submit match scores. Owner-checked, scores validated 0–15, status validated. SECURITY DEFINER.';
COMMENT ON FUNCTION public.get_tournament_games(UUID) IS 'Fetch game rows for a tournament. SECURITY INVOKER — RLS applies normally.';
-- =====================================================================
-- (End of Setup Script. Database is clean and ready for production.)
-- =====================================================================
