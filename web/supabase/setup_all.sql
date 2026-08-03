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
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.processed_webhooks CASCADE;
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
    avatar_url TEXT,
    -- P2 FIX: DUPR level CHECK constraint
    level TEXT DEFAULT '2.5' CHECK (level IN ('2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.5+')),
    gold_medals INTEGER DEFAULT 0,
    silver_medals INTEGER DEFAULT 0,
    bronze_medals INTEGER DEFAULT 0,
    online BOOLEAN DEFAULT false NOT NULL,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'owner', 'admin', 'demo')),
    -- P2 FIX: verification_status CHECK constraint
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    is_demo BOOLEAN DEFAULT false NOT NULL,
    is_seed BOOLEAN DEFAULT false NOT NULL,
    facility_setup_complete BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.player_profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.player_profiles FOR SELECT USING (
  is_demo = FALSE OR (auth.jwt() ->> 'email') IN ('demoaccount@gmail.com', 'owner@demo.com') OR auth.uid() = id
);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.player_profiles;
CREATE POLICY "Users can insert their own profile" ON public.player_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.player_profiles;
CREATE POLICY "Users can update own profile" ON public.player_profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.player_profiles;
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
    is_demo BOOLEAN DEFAULT false NOT NULL,
    is_seed BOOLEAN DEFAULT false NOT NULL,
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
    occupied_from TEXT,
    occupied_until TEXT,
    occupied_by TEXT,
    blocked_dates jsonb DEFAULT '[]'::jsonb,
    is_demo BOOLEAN DEFAULT false NOT NULL,
    is_seed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT courts_blocked_dates_is_array CHECK (jsonb_typeof(blocked_dates) = 'array' OR blocked_dates IS NULL)
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on facilities" ON public.facilities;
CREATE POLICY "Allow public read access on facilities" ON public.facilities FOR SELECT USING (
  is_demo = FALSE OR (auth.jwt() ->> 'email') IN ('demoaccount@gmail.com', 'owner@demo.com')
);
DROP POLICY IF EXISTS "Owners can insert their own facilities" ON public.facilities;
CREATE POLICY "Owners can insert their own facilities" ON public.facilities FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can update their own facilities" ON public.facilities;
CREATE POLICY "Owners can update their own facilities" ON public.facilities FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can delete their own facilities" ON public.facilities;
CREATE POLICY "Owners can delete their own facilities" ON public.facilities FOR DELETE USING (auth.uid() = owner_id);

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on courts" ON public.courts;
CREATE POLICY "Allow public read access on courts" ON public.courts FOR SELECT USING (
  is_demo = FALSE OR (auth.jwt() ->> 'email') IN ('demoaccount@gmail.com', 'owner@demo.com')
);
DROP POLICY IF EXISTS "Facility owners can insert courts" ON public.courts;
CREATE POLICY "Facility owners can insert courts" ON public.courts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Facility owners can update courts" ON public.courts;
CREATE POLICY "Facility owners can update courts" ON public.courts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Facility owners can delete courts" ON public.courts;
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
DROP POLICY IF EXISTS "Tournaments are viewable by everyone." ON public.tournaments;
CREATE POLICY "Tournaments are viewable by everyone." ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert their own tournaments." ON public.tournaments;
CREATE POLICY "Owners can insert their own tournaments." ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can update their own tournaments." ON public.tournaments;
CREATE POLICY "Owners can update their own tournaments." ON public.tournaments FOR UPDATE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can delete their own tournaments" ON public.tournaments;
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
DROP POLICY IF EXISTS "Tournament teams are viewable by everyone." ON public.tournament_teams;
CREATE POLICY "Tournament teams are viewable by everyone." ON public.tournament_teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert tournament teams." ON public.tournament_teams;
CREATE POLICY "Owners can insert tournament teams." ON public.tournament_teams FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners can update tournament teams." ON public.tournament_teams;
CREATE POLICY "Owners can update tournament teams." ON public.tournament_teams FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Captains and owners can delete tournament teams" ON public.tournament_teams;
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
DROP POLICY IF EXISTS "Tournament matches are viewable by everyone." ON public.tournament_matches;
CREATE POLICY "Tournament matches are viewable by everyone." ON public.tournament_matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert tournament matches." ON public.tournament_matches;
CREATE POLICY "Owners can insert tournament matches." ON public.tournament_matches FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners can update tournament matches." ON public.tournament_matches;
CREATE POLICY "Owners can update tournament matches." ON public.tournament_matches FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners can delete tournament matches" ON public.tournament_matches;
CREATE POLICY "Owners can delete tournament matches" ON public.tournament_matches FOR DELETE USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.match_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  game_number integer NOT NULL CHECK (game_number BETWEEN 1 AND 5),
  team1_score integer NOT NULL DEFAULT 0,
  team2_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (match_id, game_number)
);

ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Match games are viewable by everyone." ON public.match_games;
CREATE POLICY "Match games are viewable by everyone." ON public.match_games FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert match games." ON public.match_games;
CREATE POLICY "Owners can insert match games." ON public.match_games FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE tm.id = match_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners can update match games." ON public.match_games;
CREATE POLICY "Owners can update match games." ON public.match_games FOR UPDATE USING (EXISTS (SELECT 1 FROM public.tournament_matches tm JOIN public.tournaments t ON t.id = tm.tournament_id WHERE tm.id = match_id AND t.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Owners can delete match games" ON public.match_games;
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
  is_demo BOOLEAN DEFAULT false NOT NULL,
  is_seed BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT matches_players_is_array CHECK (jsonb_typeof(players) = 'array')
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Matches are viewable by everyone." ON public.matches;
CREATE POLICY "Matches are viewable by everyone." ON public.matches FOR SELECT USING (
  is_demo = FALSE OR (auth.jwt() ->> 'email') IN ('demoaccount@gmail.com', 'owner@demo.com')
);
-- P0 FIX: User can only create matches as themselves
DROP POLICY IF EXISTS "Users can insert their own matches" ON public.matches;
CREATE POLICY "Users can insert their own matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can update their matches" ON public.matches;
CREATE POLICY "Creators can update their matches" ON public.matches FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Creators can delete their matches" ON public.matches;
CREATE POLICY "Creators can delete their matches" ON public.matches FOR DELETE USING (auth.uid() = created_by);

-- =====================================================================
-- STEP 4.5: DIRECT MESSAGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL,
  read        boolean NOT NULL DEFAULT false,
  is_demo     boolean NOT NULL DEFAULT false,
  is_seed     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.direct_messages;
CREATE POLICY "Users can view their own messages" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "Users can insert messages" ON public.direct_messages;
CREATE POLICY "Users can insert messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Users can update read status" ON public.direct_messages;
CREATE POLICY "Users can update read status" ON public.direct_messages FOR UPDATE USING (auth.uid() = receiver_id);

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
    is_demo BOOLEAN DEFAULT false NOT NULL,
    is_seed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- P1 FIX: Prevent double-booking the same court at the same time
    CONSTRAINT bookings_no_double_book UNIQUE (facility_id, court_name, date, time)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Facility owners can view bookings at their facility" ON public.bookings;
CREATE POLICY "Facility owners can view bookings at their facility" ON public.bookings FOR SELECT USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users and facility owners can delete bookings" ON public.bookings;
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
DROP POLICY IF EXISTS "Facility owners can view booking requests" ON public.booking_requests;
CREATE POLICY "Facility owners can view booking requests" ON public.booking_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Facility owners can update booking requests" ON public.booking_requests;
CREATE POLICY "Facility owners can update booking requests" ON public.booking_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Users can insert own booking requests" ON public.booking_requests;
CREATE POLICY "Users can insert own booking requests" ON public.booking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own booking requests" ON public.booking_requests;
CREATE POLICY "Users can view own booking requests" ON public.booking_requests FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users and facility owners can delete booking requests" ON public.booking_requests;
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
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Deny insert on wallets" ON public.wallets;
CREATE POLICY "Deny insert on wallets" ON public.wallets FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "Deny update on wallets" ON public.wallets;
CREATE POLICY "Deny update on wallets" ON public.wallets FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Deny delete on wallets" ON public.wallets;
CREATE POLICY "Deny delete on wallets" ON public.wallets FOR DELETE USING (false);

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
DROP POLICY IF EXISTS "Users can insert own applications" ON public.facility_applications;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own applications" ON public.facility_applications;
CREATE POLICY "Users can view own applications" ON public.facility_applications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.facility_applications;
CREATE POLICY "Users can delete their own applications" ON public.facility_applications FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all facility applications" ON public.facility_applications;
CREATE POLICY "Admins can view all facility applications" ON public.facility_applications
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can update facility applications" ON public.facility_applications;
CREATE POLICY "Admins can update facility applications" ON public.facility_applications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================================
-- STEP 5.5: COMMUNITY, FEED & SOCIAL TABLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_level TEXT,
  content TEXT,
  image_url TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false NOT NULL,
  is_seed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Feed posts viewable by everyone" ON public.feed_posts;
CREATE POLICY "Feed posts viewable by everyone" ON public.feed_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own feed posts" ON public.feed_posts;
CREATE POLICY "Users can insert own feed posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete own feed posts" ON public.feed_posts;
CREATE POLICY "Users can delete own feed posts" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.feed_comments;
CREATE POLICY "Comments viewable by everyone" ON public.feed_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own comments" ON public.feed_comments;
CREATE POLICY "Users can insert own comments" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clubs viewable by everyone" ON public.clubs;
CREATE POLICY "Clubs viewable by everyone" ON public.clubs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert clubs" ON public.clubs;
CREATE POLICY "Admins can insert clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE TABLE IF NOT EXISTS public.facility_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.facility_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.facility_reviews;
CREATE POLICY "Reviews viewable by everyone" ON public.facility_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.facility_reviews;
CREATE POLICY "Users can insert own reviews" ON public.facility_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.facility_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.facility_announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcements viewable by everyone" ON public.facility_announcements;
CREATE POLICY "Announcements viewable by everyone" ON public.facility_announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owners can insert announcements" ON public.facility_announcements;
CREATE POLICY "Owners can insert announcements" ON public.facility_announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid()));

-- =====================================================================
-- STEP 6: INDEXES & TRIGGERS
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_tournaments_name_trgm ON tournaments USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_courts_name_trgm ON courts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_facilities_name_trgm ON facilities USING gin (name gin_trgm_ops);

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

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_courts_status ON public.courts(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_facility_id ON public.matches(facility_id);
CREATE INDEX IF NOT EXISTS idx_matches_court_id ON public.matches(court_id);
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
  END;

  BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(INTEGER, UUID) TO service_role;

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
-- STEP 8: COMMUNITY TABLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS clubs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  banner_url  text,
  admin_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_count int NOT NULL DEFAULT 0,
  is_demo     BOOLEAN DEFAULT false NOT NULL,
  is_seed     BOOLEAN DEFAULT false NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clubs_select_all" ON clubs;
CREATE POLICY "clubs_select_all" ON clubs FOR SELECT USING (
  is_demo = FALSE OR (auth.jwt() ->> 'email') IN ('demoaccount@gmail.com', 'owner@demo.com')
);
DROP POLICY IF EXISTS "clubs_insert_auth" ON clubs;
CREATE POLICY "clubs_insert_auth" ON clubs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "clubs_update_admin" ON clubs;
CREATE POLICY "clubs_update_admin" ON clubs FOR UPDATE USING (auth.uid() = admin_id);
DROP POLICY IF EXISTS "clubs_delete_admin" ON clubs;
CREATE POLICY "clubs_delete_admin" ON clubs FOR DELETE USING (auth.uid() = admin_id);

CREATE TABLE IF NOT EXISTS club_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'member', 'admin')),
  is_demo    boolean NOT NULL DEFAULT false,
  is_seed    boolean NOT NULL DEFAULT false,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "club_members_select_all" ON club_members;
CREATE POLICY "club_members_select_all" ON club_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "club_members_insert_self" ON club_members;
CREATE POLICY "club_members_insert_self" ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "club_members_update_admin" ON club_members;
CREATE POLICY "club_members_update_admin" ON club_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.status = 'admin')
);
DROP POLICY IF EXISTS "club_members_delete" ON club_members;
CREATE POLICY "club_members_delete" ON club_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.status = 'admin')
);

CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'member' THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'member' AND NEW.status = 'member' THEN
      UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF OLD.status = 'member' AND NEW.status <> 'member' THEN
      UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'member' THEN
    UPDATE clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_club_member_count ON club_members;
CREATE OR REPLACE TRIGGER trg_club_member_count
  AFTER INSERT OR UPDATE OR DELETE ON club_members
  FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

CREATE TABLE IF NOT EXISTS player_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);
ALTER TABLE player_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_likes_select_all" ON player_likes;
CREATE POLICY "player_likes_select_all" ON player_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "player_likes_insert_self" ON player_likes;
CREATE POLICY "player_likes_insert_self" ON player_likes FOR INSERT WITH CHECK (auth.uid() = liker_id);
DROP POLICY IF EXISTS "player_likes_delete_self" ON player_likes;
CREATE POLICY "player_likes_delete_self" ON player_likes FOR DELETE USING (auth.uid() = liker_id);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON public.direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON public.direct_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_unread ON public.direct_messages(receiver_id, read) WHERE read = false;

-- =====================================================================
-- STEP 9: FEED POSTS, LIKES, COMMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text,
  image_url     text,
  like_count    int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  is_demo       boolean NOT NULL DEFAULT false,
  is_seed       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_posts_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_posts_select_all" ON public.feed_posts;
CREATE POLICY "feed_posts_select_all" ON public.feed_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "feed_posts_insert_auth" ON public.feed_posts;
CREATE POLICY "feed_posts_insert_auth" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "feed_posts_update_own" ON public.feed_posts;
CREATE POLICY "feed_posts_update_own" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "feed_posts_delete_own" ON public.feed_posts;
CREATE POLICY "feed_posts_delete_own" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.feed_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_demo    boolean NOT NULL DEFAULT false,
  is_seed    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_likes_select_all" ON public.feed_likes;
CREATE POLICY "feed_likes_select_all" ON public.feed_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "feed_likes_insert_self" ON public.feed_likes;
CREATE POLICY "feed_likes_insert_self" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "feed_likes_delete_self" ON public.feed_likes;
CREATE POLICY "feed_likes_delete_self" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON public.feed_likes(user_id);

CREATE OR REPLACE FUNCTION public.update_feed_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feed_like_count ON public.feed_likes;
CREATE OR REPLACE TRIGGER trg_feed_like_count
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_feed_like_count();

CREATE TABLE IF NOT EXISTS public.feed_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  is_demo    boolean NOT NULL DEFAULT false,
  is_seed    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feed_comments_select_all" ON public.feed_comments;
CREATE POLICY "feed_comments_select_all" ON public.feed_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "feed_comments_insert_auth" ON public.feed_comments;
CREATE POLICY "feed_comments_insert_auth" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "feed_comments_delete_own" ON public.feed_comments;
CREATE POLICY "feed_comments_delete_own" ON public.feed_comments FOR DELETE USING (auth.uid() = author_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON public.feed_comments(post_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_feed_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feed_comment_count ON public.feed_comments;
CREATE OR REPLACE TRIGGER trg_feed_comment_count
  AFTER INSERT OR DELETE ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_feed_comment_count();

DROP TRIGGER IF EXISTS set_timestamp ON public.feed_posts;
CREATE OR REPLACE TRIGGER set_timestamp BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- =====================================================================
-- STEP 10: STORAGE BUCKET & FEED RPC
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('feed-images', 'feed-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

DROP POLICY IF EXISTS "Public access to feed-images" ON storage.objects;
CREATE POLICY "Public access to feed-images" ON storage.objects FOR SELECT USING (bucket_id = 'feed-images');

DROP POLICY IF EXISTS "Auth users can upload to their own folder" ON storage.objects;
CREATE POLICY "Auth users can upload to their own folder" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'feed-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE USING (
  bucket_id = 'feed-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  viewer_id UUID,
  max_limit INT,
  after_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.feed_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.feed_posts p
  WHERE
    (
      p.author_id = viewer_id
      OR p.author_id IN (
        SELECT liked_id FROM public.player_likes WHERE liker_id = viewer_id
      )
    )
    AND (after_cursor IS NULL OR p.created_at < after_cursor)
  ORDER BY p.created_at DESC
  LIMIT max_limit;
END;
$$;

-- =====================================================================
-- STEP 11: PHASE 2 — ACCOUNT ARCHITECTURE & DATA SEEDING (2026-07-22)
-- Adds is_seed columns, platform_config, threshold cleanup, and updated RLS
-- =====================================================================

-- 1. ADD is_seed and is_demo COLUMNS TO ALL AFFECTED TABLES
ALTER TABLE public.player_profiles   ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.facilities        ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.courts            ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.matches           ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.clubs             ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.club_members      ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_posts        ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_comments     ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_likes        ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.direct_messages   ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.bookings          ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL, ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;

-- 2. CREATE platform_config TABLE (single-row config, enforced by CHECK constraint)
CREATE TABLE IF NOT EXISTS public.platform_config (
  id                                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  seed_data_active                  BOOLEAN NOT NULL DEFAULT true,
  seed_cleanup_threshold_users      INTEGER NOT NULL DEFAULT 20,
  seed_cleanup_threshold_facilities INTEGER NOT NULL DEFAULT 5,
  seed_purged_at                    TIMESTAMPTZ,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 3. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.player_profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_demo_user() RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT is_demo FROM public.player_profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_seed_visible()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT seed_data_active FROM public.platform_config WHERE id = 1 LIMIT 1),
    true
  );
$$;

COMMENT ON FUNCTION public.is_seed_visible() IS
  'Returns true while cold-start seed data should be visible to real users. Automatically returns false after the threshold cleanup runs.';

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_config_admin_all" ON public.platform_config;
CREATE POLICY "platform_config_admin_all" ON public.platform_config
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- 4. UPDATE RLS SELECT POLICIES TO INCLUDE is_seed VISIBILITY CLAUSE

-- FACILITIES
DROP POLICY IF EXISTS "Allow public read access on facilities" ON public.facilities;
DROP POLICY IF EXISTS "facilities_rbac_select" ON public.facilities;
CREATE POLICY "facilities_rbac_select" ON public.facilities FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- COURTS
DROP POLICY IF EXISTS "Allow public read access on courts" ON public.courts;
DROP POLICY IF EXISTS "courts_rbac_select" ON public.courts;
CREATE POLICY "courts_rbac_select" ON public.courts FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- MATCHES
DROP POLICY IF EXISTS "Matches are viewable by everyone." ON public.matches;
DROP POLICY IF EXISTS "matches_rbac_select" ON public.matches;
CREATE POLICY "matches_rbac_select" ON public.matches FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- PLAYER PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_rbac_select" ON public.player_profiles;
CREATE POLICY "profiles_rbac_select" ON public.player_profiles FOR SELECT USING (true);

-- CLUBS
DROP POLICY IF EXISTS "clubs_select_all" ON public.clubs;
DROP POLICY IF EXISTS "clubs_rbac_select" ON public.clubs;
CREATE POLICY "clubs_rbac_select" ON public.clubs FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- CLUB MEMBERS
DROP POLICY IF EXISTS "club_members_select_all" ON public.club_members;
DROP POLICY IF EXISTS "club_members_rbac_select" ON public.club_members;
CREATE POLICY "club_members_rbac_select" ON public.club_members FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED POSTS
DROP POLICY IF EXISTS "feed_posts_select_all" ON public.feed_posts;
DROP POLICY IF EXISTS "feed_posts_rbac_select" ON public.feed_posts;
CREATE POLICY "feed_posts_rbac_select" ON public.feed_posts FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED COMMENTS
DROP POLICY IF EXISTS "feed_comments_select_all" ON public.feed_comments;
DROP POLICY IF EXISTS "feed_comments_rbac_select" ON public.feed_comments;
CREATE POLICY "feed_comments_rbac_select" ON public.feed_comments FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED LIKES
DROP POLICY IF EXISTS "feed_likes_select_all" ON public.feed_likes;
DROP POLICY IF EXISTS "feed_likes_rbac_select" ON public.feed_likes;
CREATE POLICY "feed_likes_rbac_select" ON public.feed_likes FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND (public.is_demo_user() = true OR auth.uid() IS NULL))
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND COALESCE(public.get_user_role(), '') != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_facilities_is_seed     ON public.facilities(is_seed)     WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_courts_is_seed         ON public.courts(is_seed)         WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_matches_is_seed        ON public.matches(is_seed)        WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_clubs_is_seed          ON public.clubs(is_seed)          WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_feed_posts_is_seed     ON public.feed_posts(is_seed)     WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_player_profiles_is_seed ON public.player_profiles(is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_seed ON public.direct_messages(is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_bookings_is_seed       ON public.bookings(is_seed)       WHERE is_seed = true;

-- 6. THRESHOLD CLEANUP FUNCTION & ADMIN RPC
CREATE OR REPLACE FUNCTION public.check_and_purge_seed_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active                   BOOLEAN;
  v_threshold_users             INTEGER;
  v_threshold_facilities        INTEGER;
  v_real_user_count             INTEGER;
  v_real_facility_count         INTEGER;
  v_purged                      BOOLEAN := false;
BEGIN
  SELECT seed_data_active, seed_cleanup_threshold_users, seed_cleanup_threshold_facilities
  INTO   v_is_active, v_threshold_users, v_threshold_facilities
  FROM   public.platform_config WHERE id = 1 LIMIT 1;

  IF NOT COALESCE(v_is_active, true) THEN
    RETURN jsonb_build_object('status', 'already_purged', 'purged', false);
  END IF;

  SELECT COUNT(*) INTO v_real_user_count
  FROM public.player_profiles
  WHERE is_demo = false AND is_seed = false AND role IN ('player', 'owner');

  SELECT COUNT(*) INTO v_real_facility_count
  FROM public.facilities
  WHERE is_demo = false AND is_seed = false;

  IF v_real_user_count > v_threshold_users OR v_real_facility_count > v_threshold_facilities THEN
    DELETE FROM public.feed_likes      WHERE is_seed = true;
    DELETE FROM public.feed_comments   WHERE is_seed = true;
    DELETE FROM public.feed_posts      WHERE is_seed = true;
    DELETE FROM public.club_members    WHERE is_seed = true;
    DELETE FROM public.clubs           WHERE is_seed = true;
    DELETE FROM public.direct_messages WHERE is_seed = true;
    DELETE FROM public.bookings        WHERE is_seed = true;
    DELETE FROM public.matches         WHERE is_seed = true;
    DELETE FROM public.courts          WHERE is_seed = true;
    DELETE FROM public.facilities      WHERE is_seed = true;

    UPDATE public.platform_config
    SET seed_data_active = false, seed_purged_at = now(), updated_at = now()
    WHERE id = 1;

    v_purged := true;
  END IF;

  RETURN jsonb_build_object(
    'status',              CASE WHEN v_purged THEN 'purged' ELSE 'below_threshold' END,
    'purged',              v_purged,
    'real_users',          v_real_user_count,
    'real_facilities',     v_real_facility_count,
    'threshold_users',     v_threshold_users,
    'threshold_facilities',v_threshold_facilities
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_purge_seed_data() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.admin_trigger_seed_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;
  RETURN public.check_and_purge_seed_data();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_trigger_seed_purge() TO authenticated;

-- =====================================================================
-- DATA SEEDING INSTRUCTIONS:
-- 1. To populate Demo Sandbox: Run seed_demo_account.sql
-- 2. To populate Cold-Start Launch Data: Run seed_coldstart.sql
-- =====================================================================

-- =====================================================================
-- FACILITY APPLICATIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.facility_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    address TEXT NOT NULL,
    courts_count INTEGER DEFAULT 1 NOT NULL,
    surface_type TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_permit_url TEXT,
    proof_of_identity_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.facility_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own applications" ON public.facility_applications;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own applications" ON public.facility_applications;
CREATE POLICY "Users can view own applications" ON public.facility_applications FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- WALLET TRANSACTIONS TABLE & POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL DEFAULT 'refund',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet transactions"
    ON public.wallet_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PROCESSED WEBHOOKS TABLE & POLICIES (Idempotency)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to processed_webhooks"
    ON public.processed_webhooks
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- FACILITY APPLICATIONS TABLE & POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facility_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    address TEXT NOT NULL,
    courts_count INTEGER DEFAULT 1 NOT NULL,
    surface_type TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_permit_url TEXT,
    proof_of_identity_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.facility_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own applications" ON public.facility_applications;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- FEED COMMENT LIKES TABLE & POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(comment_id, user_id)
);

ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Feed comment likes are viewable by everyone" ON public.feed_comment_likes;
CREATE POLICY "Feed comment likes are viewable by everyone" ON public.feed_comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comment likes" ON public.feed_comment_likes;
CREATE POLICY "Authenticated users can insert comment likes" ON public.feed_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.feed_comment_likes;
CREATE POLICY "Users can delete own comment likes" ON public.feed_comment_likes FOR DELETE USING (auth.uid() = user_id);



