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
-- STEP 2: EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- =====================================================================
-- MIGRATION: 20260711000000_create_tournaments_table.sql
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone." ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own tournaments." ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own tournaments." ON public.tournaments FOR UPDATE USING (auth.uid() = owner_id);


-- =====================================================================
-- MIGRATION: 20260715000000_search_indexes.sql
-- =====================================================================
-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING gin (name gin_trgm_ops);

-- Assuming we have courts and facilities
CREATE INDEX IF NOT EXISTS idx_courts_name_trgm ON courts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);

-- RPC for fuzzy searching tournaments
CREATE OR REPLACE FUNCTION search_tournaments(search_term TEXT)
RETURNS SETOF tournaments AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM tournaments
  WHERE name % search_term
  ORDER BY similarity(name, search_term) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- RPC for fuzzy searching facilities/courts
CREATE OR REPLACE FUNCTION search_facilities(search_term TEXT)
RETURNS SETOF facilities AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM facilities
  WHERE name % search_term
  ORDER BY similarity(name, search_term) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;


-- =====================================================================
-- MIGRATION: 20260715000001_create_core_tables.sql
-- =====================================================================
-- Create Facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    rating NUMERIC(3, 1),
    price INTEGER NOT NULL,
    hours TEXT,
    distance TEXT,
    moto TEXT,
    car TEXT,
    image TEXT,
    favorited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Courts table
CREATE TABLE IF NOT EXISTS public.courts (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surface TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    occupied_until TEXT,
    occupied_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Enable RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read for MVP)
CREATE POLICY "Allow public read access on facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Allow public read access on courts" ON public.courts FOR SELECT USING (true);

-- Allow owners to insert/update
CREATE POLICY "Allow owner insert on facilities" ON public.facilities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner update on facilities" ON public.facilities FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner insert on courts" ON public.courts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner update on courts" ON public.courts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));

-- Insert Seed Data for Facilities
INSERT INTO public.facilities (id, name, location, type, rating, price, hours, distance, moto, car, image, favorited) VALUES
(1, 'SM Southmall Picklepark', 'Las Piñas City', 'Indoor', 4.9, 500, '6am – 10pm', '2.1 km', '8 min', '15 min', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format', false),
(2, 'BGC Pickleball Hub', 'Bonifacio Global City, Taguig', 'Outdoor', 4.8, 400, '5am – 11pm', '5.4 km', '18 min', '30 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', true),
(3, 'Ayala Center Cebu Courts', 'Cebu City, Cebu', 'Indoor/Outdoor', 4.7, 350, '7am – 9pm', '1.2 km', '5 min', '10 min', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format', false);

-- Note: We reset the serial sequences based on the hardcoded IDs we just inserted.
SELECT setval('facilities_id_seq', (SELECT MAX(id) FROM facilities));


-- =====================================================================
-- MIGRATION: 20260715000002_create_community_tables.sql
-- =====================================================================
    -- Migration: 20260715000002_create_community_tables.sql
    -- Description: Creates the notifications and player_profiles tables with RLS policies.

    CREATE TABLE IF NOT EXISTS public.player_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        level TEXT DEFAULT '2.5',
        gold_medals INTEGER DEFAULT 0,
        silver_medals INTEGER DEFAULT 0,
        bronze_medals INTEGER DEFAULT 0,
        online BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Profiles are viewable by everyone" ON public.player_profiles
        FOR SELECT USING (true);

    CREATE POLICY "Users can insert their own profile" ON public.player_profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update own profile" ON public.player_profiles
        FOR UPDATE USING (auth.uid() = id);

    -- Notifications Table
    CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('booking', 'community', 'system')),
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view own notifications" ON public.notifications
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "System can insert notifications for users" ON public.notifications
        FOR INSERT WITH CHECK (true); -- Usually restricted to authenticated trigger or admin service key

    -- Function to handle new user signup
    CREATE OR REPLACE FUNCTION public.handle_new_user() 
    RETURNS TRIGGER AS $$
    BEGIN
    INSERT INTO public.player_profiles (id, name, level)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        '2.5'
    );
    RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to automatically create a profile for new users
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- MIGRATION: 20260715000003_create_bookings_table.sql
-- =====================================================================
-- Migration: 20260715000003_create_bookings_table.sql

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
    court_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);


-- =====================================================================
-- MIGRATION: 20260715000004_create_matches_and_teams.sql
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player1_id uuid REFERENCES auth.users(id),
  withdrawn boolean DEFAULT false,
  players jsonb,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament teams are viewable by everyone." ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "Owners can insert tournament teams." ON public.tournament_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update tournament teams." ON public.tournament_teams FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_type text,
  round_number integer,
  match_sequence integer,
  team1_id uuid REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  team2_id uuid REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  winner_id uuid REFERENCES public.tournament_teams(id),
  loser_id uuid REFERENCES public.tournament_teams(id),
  status text,
  next_match_winner_goes_to text,
  next_match_loser_goes_to text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tournament matches are viewable by everyone." ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Owners can insert tournament matches." ON public.tournament_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update tournament matches." ON public.tournament_matches FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
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
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Matches are viewable by everyone." ON public.matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert matches." ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update matches." ON public.matches FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id bigint REFERENCES public.facilities(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  court_name text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  total integer NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking requests are viewable by facility owners." ON public.booking_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert booking requests." ON public.booking_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners can update booking requests." ON public.booking_requests FOR UPDATE USING (true);


-- =====================================================================
-- MIGRATION: 20260716000000_create_wallets_and_rpc.sql
-- =====================================================================
-- Add wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can update wallets" ON public.wallets FOR ALL USING (true);

-- Add delete_user RPC
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Update trigger to also create wallet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_profiles (id, name, level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    '2.5'
  );
  
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- MIGRATION: 20260716000001_add_role_to_profiles.sql
-- =====================================================================
-- Add role to player_profiles
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';


-- =====================================================================
-- MIGRATION: 20260716000002_create_facility_applications.sql
-- =====================================================================
CREATE TABLE public.facility_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.facility_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own applications" ON public.facility_applications FOR SELECT USING (auth.uid() = user_id);


-- =====================================================================
-- MIGRATION: 20260716000003_add_increment_wallet_balance_rpc.sql
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(amount INTEGER, user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance + amount 
  WHERE wallets.user_id = increment_wallet_balance.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- MIGRATION: 20260716000004_create_match_games.sql
-- =====================================================================
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


-- =====================================================================
-- MIGRATION: 20260716000005_add_blocked_dates_to_courts.sql
-- =====================================================================
ALTER TABLE public.courts
ADD COLUMN IF NOT EXISTS blocked_dates jsonb DEFAULT '[]'::jsonb;


-- =====================================================================
-- MIGRATION: 20260716000006_add_verification_to_profiles.sql
-- =====================================================================
ALTER TABLE public.player_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';



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


-- =====================================================================
-- MIGRATION: 20260716000009_multi_tenant_architecture.sql
-- Description: Multi-tenant facility isolation, booking request tracking, 
--              and type mismatch resolution.
-- =====================================================================

-- ---------------------------------------------------------
-- 1. Resolve Type Mismatch
-- ---------------------------------------------------------
-- Downcast booking_requests.facility_id from BIGINT to INTEGER to match facilities.id
ALTER TABLE public.booking_requests ALTER COLUMN facility_id TYPE INTEGER USING facility_id::INTEGER;

-- ---------------------------------------------------------
-- 2. Multi-Tenant Facility Isolation
-- ---------------------------------------------------------
-- Add owner_id to facilities
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON public.facilities(owner_id);

-- Rewrite Facility RLS to strictly check owner_id instead of generic role='owner'
DROP POLICY IF EXISTS "Allow owner insert on facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow owner update on facilities" ON public.facilities;

CREATE POLICY "Owners can insert their own facilities" ON public.facilities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own facilities" ON public.facilities FOR UPDATE USING (auth.uid() = owner_id);

-- Rewrite Courts RLS to ensure court modifiers own the parent facility
DROP POLICY IF EXISTS "Allow owner insert on courts" ON public.courts;
DROP POLICY IF EXISTS "Allow owner update on courts" ON public.courts;

CREATE POLICY "Facility owners can insert courts" ON public.courts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);
CREATE POLICY "Facility owners can update courts" ON public.courts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- Rewrite Booking Requests RLS for owners
DROP POLICY IF EXISTS "Booking requests are viewable by facility owners." ON public.booking_requests;
DROP POLICY IF EXISTS "Owners can update booking requests." ON public.booking_requests;

CREATE POLICY "Facility owners can view booking requests" ON public.booking_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);
CREATE POLICY "Facility owners can update booking requests" ON public.booking_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 3. Player Booking Request Tracking
-- ---------------------------------------------------------
-- Add user_id to booking requests
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);

-- Ensure users can insert requests tied to their own ID and view their own requests
DROP POLICY IF EXISTS "Authenticated users can insert booking requests." ON public.booking_requests;

CREATE POLICY "Users can insert own booking requests" ON public.booking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own booking requests" ON public.booking_requests FOR SELECT USING (auth.uid() = user_id);


-- =====================================================================
-- MIGRATION: 20260716000010_delete_policies.sql
-- Description: Implement missing FOR DELETE RLS policies across the 
--              entire database to enable proper CRUD functionality.
-- =====================================================================

-- ---------------------------------------------------------
-- 1. Core Platform (Facilities & Courts)
-- ---------------------------------------------------------
-- Facilities: Owners can delete their own facilities
DROP POLICY IF EXISTS "Owners can delete their own facilities" ON public.facilities;
CREATE POLICY "Owners can delete their own facilities" ON public.facilities FOR DELETE USING (auth.uid() = owner_id);

-- Courts: Facility owners can delete their courts
DROP POLICY IF EXISTS "Facility owners can delete courts" ON public.courts;
CREATE POLICY "Facility owners can delete courts" ON public.courts FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 2. Bookings & Requests
-- ---------------------------------------------------------
-- Booking Requests: Users can delete their own requests (withdraw), Facility owners can delete requests
DROP POLICY IF EXISTS "Users and facility owners can delete booking requests" ON public.booking_requests;
CREATE POLICY "Users and facility owners can delete booking requests" ON public.booking_requests FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- Bookings: Users can delete their own bookings (cancel), Facility owners can delete bookings
DROP POLICY IF EXISTS "Users and facility owners can delete bookings" ON public.bookings;
CREATE POLICY "Users and facility owners can delete bookings" ON public.bookings FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 3. Tournaments & Matches
-- ---------------------------------------------------------
-- Tournaments: Owners can delete their own tournaments
DROP POLICY IF EXISTS "Owners can delete their own tournaments" ON public.tournaments;
CREATE POLICY "Owners can delete their own tournaments" ON public.tournaments FOR DELETE USING (auth.uid() = owner_id);

-- Tournament Teams: Team captain (player1) can withdraw, or tournament owner can remove
DROP POLICY IF EXISTS "Captains and owners can delete tournament teams" ON public.tournament_teams;
CREATE POLICY "Captains and owners can delete tournament teams" ON public.tournament_teams FOR DELETE USING (
    player1_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- Tournament Matches: Tournament owner can delete
DROP POLICY IF EXISTS "Owners can delete tournament matches" ON public.tournament_matches;
CREATE POLICY "Owners can delete tournament matches" ON public.tournament_matches FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- Match Games: Tournament owner can delete
DROP POLICY IF EXISTS "Owners can delete match games" ON public.match_games;
CREATE POLICY "Owners can delete match games" ON public.match_games FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.tournament_matches tm
        JOIN public.tournaments t ON t.id = tm.tournament_id
        WHERE tm.id = match_id AND t.owner_id = auth.uid()
    )
);

-- Matches: Owners can delete matches
DROP POLICY IF EXISTS "Owners can delete matches" ON public.matches;
CREATE POLICY "Owners can delete matches" ON public.matches FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 4. Social & Profile
-- ---------------------------------------------------------
-- Notifications: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Facility Applications: Users can delete their own applications
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.facility_applications;
CREATE POLICY "Users can delete their own applications" ON public.facility_applications FOR DELETE USING (auth.uid() = user_id);
