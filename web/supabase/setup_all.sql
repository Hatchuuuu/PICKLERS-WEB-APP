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
      role TEXT DEFAULT 'player' CHECK (role IN ('player', 'owner', 'admin', 'demo', 'dev')),
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
    account_name text,
    player_phone text,
    player_email text,
    paymentMethod text,
    court_name text NOT NULL,
    date text NOT NULL,
    time text NOT NULL,
    total integer NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS account_name text;
  ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS player_phone text;
  ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS player_email text;
  ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS paymentMethod text;

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

  -- =====================================================================
  -- STEP 5.5: REVIEWS & ANNOUNCEMENTS
  -- =====================================================================
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

  -- ─────────────────────────────────────────────────────────────────────────────
  -- WALLET TRANSACTIONS TABLE & POLICIES
  -- ─────────────────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      type TEXT NOT NULL DEFAULT 'refund',
      reference_id TEXT,
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

  -- =============================================
  -- PICKLERS ADMIN SYSTEM — DATABASE MIGRATION
  -- =============================================

  -- 1. Extend player_profiles with admin fields & update role check constraint
  ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_role_check;
  ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_role_check CHECK (role IN ('player', 'owner', 'admin', 'demo', 'dev'));

  ALTER TABLE public.player_profiles
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL
      CHECK (admin_role IN ('super_admin', 'moderator', 'finance_admin')),
    ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS banned_reason TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ DEFAULT NULL;

  -- 2. owner_applications table
  CREATE TABLE IF NOT EXISTS public.owner_applications (
    id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
    business_name          TEXT        NOT NULL,
    tax_id_or_reg_no       TEXT,
    contact_email          TEXT        NOT NULL,
    contact_phone          TEXT        NOT NULL,
    facility_name          TEXT        NOT NULL,
    facility_address       TEXT        NOT NULL,
    court_count            INTEGER     NOT NULL DEFAULT 1 CHECK (court_count >= 1),
    surface_type           TEXT,
    indoor_outdoor         TEXT        CHECK (indoor_outdoor IN ('Indoor', 'Outdoor', 'Both')),
    operating_hours        TEXT,
    additional_notes       TEXT,
    government_id_url      TEXT,
    business_license_url   TEXT,
    proof_of_ownership_url TEXT,
    facility_photos_urls   TEXT[]      NOT NULL DEFAULT '{}',
    status                 TEXT        NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'more_info_requested')),
    rejection_reason       TEXT,
    revision_request_note  TEXT,
    reviewed_by            UUID        REFERENCES public.player_profiles(id),
    reviewed_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE OR REPLACE FUNCTION public.update_owner_applications_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_owner_applications_updated_at ON public.owner_applications;
  CREATE TRIGGER trg_owner_applications_updated_at
    BEFORE UPDATE ON public.owner_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_owner_applications_updated_at();

  -- 3. admin_audit_logs — immutable ledger
  CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID        NOT NULL REFERENCES public.player_profiles(id),
    action      TEXT        NOT NULL,
    target_type TEXT        NOT NULL,
    target_id   UUID        NOT NULL,
    metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 4. promotions table
  CREATE TABLE IF NOT EXISTS public.promotions (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT          UNIQUE NOT NULL,
    description         TEXT,
    discount_type       TEXT          NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value      NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_booking_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_uses            INTEGER,
    current_uses        INTEGER       NOT NULL DEFAULT 0,
    applicable_to       TEXT          NOT NULL DEFAULT 'all'
      CHECK (applicable_to IN ('all', 'new_users', 'returning_users')),
    starts_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by          UUID          REFERENCES public.player_profiles(id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  );

  -- Row Level Security
  ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.admin_audit_logs   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.promotions         ENABLE ROW LEVEL SECURITY;

  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.player_profiles
      WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR role = 'dev')
    );
  $$ LANGUAGE sql SECURITY DEFINER STABLE;

  DROP POLICY IF EXISTS "owner_app_select" ON public.owner_applications;
  CREATE POLICY "owner_app_select"  ON public.owner_applications FOR SELECT  USING (user_id = auth.uid() OR public.is_admin());

  DROP POLICY IF EXISTS "owner_app_insert" ON public.owner_applications;
  CREATE POLICY "owner_app_insert"  ON public.owner_applications FOR INSERT  WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "owner_app_update" ON public.owner_applications;
  CREATE POLICY "owner_app_update"  ON public.owner_applications FOR UPDATE  USING (public.is_admin());

  DROP POLICY IF EXISTS "audit_log_select" ON public.admin_audit_logs;
  CREATE POLICY "audit_log_select"  ON public.admin_audit_logs FOR SELECT  USING (public.is_admin());

  DROP POLICY IF EXISTS "audit_log_insert" ON public.admin_audit_logs;
  CREATE POLICY "audit_log_insert"  ON public.admin_audit_logs FOR INSERT  WITH CHECK (public.is_admin());

  DROP POLICY IF EXISTS "promo_select" ON public.promotions;
  CREATE POLICY "promo_select"      ON public.promotions FOR SELECT USING (is_active = TRUE OR public.is_admin());

  DROP POLICY IF EXISTS "promo_insert" ON public.promotions;
  CREATE POLICY "promo_insert"      ON public.promotions FOR INSERT WITH CHECK (public.is_admin());

  DROP POLICY IF EXISTS "promo_update" ON public.promotions;
  CREATE POLICY "promo_update"      ON public.promotions FOR UPDATE USING (public.is_admin());

  -- ============================================================================
  -- Developer Console System Tables & RLS Policies
  -- Migration: 20260812_create_dev_console_system.sql
  -- ============================================================================

  -- 1. developer_audit_logs — immutable technical operation ledger
  CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID        NOT NULL REFERENCES public.player_profiles(id),
    action       TEXT        NOT NULL,
    category     TEXT        NOT NULL DEFAULT 'system',
    environment  TEXT        NOT NULL DEFAULT 'development',
    target_type  TEXT,
    target_id    TEXT,
    details      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    ip_address   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 2. feature_flags — runtime feature management
  CREATE TABLE IF NOT EXISTS public.feature_flags (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    key                 TEXT        UNIQUE NOT NULL,
    name                TEXT        NOT NULL,
    description         TEXT,
    is_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
    environment         TEXT        NOT NULL DEFAULT 'production',
    rollout_percentage  INTEGER     NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    targeting_rules     JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_by          UUID        REFERENCES public.player_profiles(id),
    updated_by          UUID        REFERENCES public.player_profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Row Level Security
  ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.feature_flags        ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "dev_audit_log_select" ON public.developer_audit_logs;
  CREATE POLICY "dev_audit_log_select" ON public.developer_audit_logs FOR SELECT USING (public.is_admin());

  DROP POLICY IF EXISTS "dev_audit_log_insert" ON public.developer_audit_logs;
  CREATE POLICY "dev_audit_log_insert" ON public.developer_audit_logs FOR INSERT WITH CHECK (public.is_admin());

  DROP POLICY IF EXISTS "feature_flags_select" ON public.feature_flags;
  CREATE POLICY "feature_flags_select" ON public.feature_flags FOR SELECT USING (TRUE);

  DROP POLICY IF EXISTS "feature_flags_manage" ON public.feature_flags;
  CREATE POLICY "feature_flags_manage" ON public.feature_flags FOR ALL USING (public.is_admin());

  -- ============================================================================
  -- RBAC & Console Access Migration
  -- Migration: 20260812_rbac_and_dev_console.sql
  -- ============================================================================

  -- 1. Add console_access and permissions columns to player_profiles
  ALTER TABLE public.player_profiles 
    ADD COLUMN IF NOT EXISTS console_access TEXT[] NOT NULL DEFAULT '{player}'::text[],
    ADD COLUMN IF NOT EXISTS permissions    TEXT[] NOT NULL DEFAULT '{}'::text[];

  -- 2. Migrate existing admin and dev roles to explicit console_access arrays
  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'admin']
  WHERE (is_admin = TRUE OR role = 'admin') AND (role IS NULL OR role != 'dev');

  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'dev']
  WHERE role = 'dev' AND (is_admin IS NOT TRUE AND role != 'admin');

  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'admin', 'dev']
  WHERE (is_admin = TRUE OR role = 'admin') AND role = 'dev';


  -- ============================================================================
  -- Unified Account State Model Migration
  -- Migration: 20260813_unified_account_state_model.sql
  -- ============================================================================

  -- 1. Extend player_profiles table with account_status and dev_role
  ALTER TABLE public.player_profiles
    ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
      CHECK (account_status IN ('active', 'suspended', 'deactivated')),
    ADD COLUMN IF NOT EXISTS dev_role TEXT DEFAULT NULL;

  ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_dev_role_check;
  ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_dev_role_check
    CHECK (dev_role IS NULL OR dev_role IN (
      'super_developer', 'lead_dev', 'lead_architect', 'platform_engineer', 
      'sre_devops', 'backend_engineer', 'frontend_engineer', 'security_engineer', 
      'developer_viewer', 'developer', 'senior_dev', 'qa_engineer'
    ));

  -- Update admin_role constraint to include full set of roles
  ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_admin_role_check;
  ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_admin_role_check 
    CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'platform_admin', 'operations_admin', 'finance_admin', 'moderator', 'content_manager', 'analytics_viewer'));

  -- 2. Normalize existing accounts
  UPDATE public.player_profiles
  SET account_status = 'suspended'
  WHERE is_banned = TRUE AND account_status = 'active';

  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'admin']
  WHERE (is_admin = TRUE OR role = 'admin') AND (role IS NULL OR role != 'dev')
    AND NOT ('admin' = ANY(console_access));

  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'dev']
  WHERE role = 'dev' AND (is_admin IS NOT TRUE AND role != 'admin')
    AND NOT ('dev' = ANY(console_access));

  UPDATE public.player_profiles
  SET console_access = ARRAY['player', 'admin', 'dev']
  WHERE (is_admin = TRUE OR role = 'admin') AND role = 'dev'
    AND NOT ('dev' = ANY(console_access));

  -- 3. Security & Helper Functions
  CREATE OR REPLACE FUNCTION public.has_console_access(target_console TEXT)
  RETURNS BOOLEAN AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.player_profiles
      WHERE id = auth.uid() 
        AND COALESCE(account_status, 'active') = 'active'
        AND COALESCE(is_banned, false) = false
        AND target_console = ANY(console_access)
    );
  $$ LANGUAGE sql SECURITY DEFINER STABLE;

  CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS BOOLEAN AS $$
    SELECT public.has_console_access('admin');
  $$ LANGUAGE sql SECURITY DEFINER STABLE;

  CREATE OR REPLACE FUNCTION public.is_dev()
  RETURNS BOOLEAN AS $$
    SELECT public.has_console_access('dev');
  $$ LANGUAGE sql SECURITY DEFINER STABLE;

  -- 4. Update Developer Console RLS Policies to use is_dev()
  DROP POLICY IF EXISTS "dev_audit_log_select" ON public.developer_audit_logs;
  CREATE POLICY "dev_audit_log_select" ON public.developer_audit_logs FOR SELECT USING (public.is_dev());

  DROP POLICY IF EXISTS "dev_audit_log_insert" ON public.developer_audit_logs;
  CREATE POLICY "dev_audit_log_insert" ON public.developer_audit_logs FOR INSERT WITH CHECK (public.is_dev());

  DROP POLICY IF EXISTS "feature_flags_manage" ON public.feature_flags;
  CREATE POLICY "feature_flags_manage" ON public.feature_flags FOR ALL USING (public.is_dev());


  -- ============================================================================
  -- Foreign Key B-Tree Index Optimization Migration
  -- Migration: 20260814_add_fk_indexes.sql
  -- ============================================================================

  -- 1. Indexes for owner_applications
  CREATE INDEX IF NOT EXISTS idx_owner_applications_user_id ON public.owner_applications(user_id);
  CREATE INDEX IF NOT EXISTS idx_owner_applications_reviewed_by ON public.owner_applications(reviewed_by);
  CREATE INDEX IF NOT EXISTS idx_owner_applications_status ON public.owner_applications(status);

  -- 2. Indexes for admin_audit_logs
  CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
  CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id ON public.admin_audit_logs(target_id);
  CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

  -- 3. Indexes for developer_audit_logs
  CREATE INDEX IF NOT EXISTS idx_developer_audit_logs_developer_id ON public.developer_audit_logs(developer_id);
  CREATE INDEX IF NOT EXISTS idx_developer_audit_logs_created_at ON public.developer_audit_logs(created_at DESC);

  -- 4. Indexes for player_profiles console access queries
  CREATE INDEX IF NOT EXISTS idx_player_profiles_account_status ON public.player_profiles(account_status);


  -- ============================================================================
  -- Booking Concurrency Protection Partial Unique Index Migration
  -- Migration: 20260815_add_unique_active_booking_index.sql
  -- ============================================================================

  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_booking
  ON public.bookings (facility_id, court_name, date, time)
  WHERE status IN ('pending', 'upcoming', 'active', 'confirmed');


  -- ============================================================================
  -- Master Remediation Fixes Migration
  -- Migration: 20260814000000_master_remediation_fixes.sql
  -- ============================================================================

  ALTER TABLE public.wallet_transactions
    ADD COLUMN IF NOT EXISTS booking_id text DEFAULT NULL;

  CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id ON public.wallet_transactions(booking_id);

  CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
    p_user_id uuid,
    p_amount numeric,
    p_label text DEFAULT 'Court Booking Payment',
    p_booking_id text DEFAULT NULL
  )
  RETURNS numeric AS $$
  DECLARE
    v_current_balance numeric;
    v_new_balance numeric;
  BEGIN
    IF p_amount <= 0 THEN
      RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    SELECT balance INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.wallets (user_id, balance)
      VALUES (p_user_id, 0)
      RETURNING balance INTO v_current_balance;
    END IF;

    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Balance: %, Required: %', v_current_balance, p_amount;
    END IF;

    v_new_balance := v_current_balance - p_amount;

    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (user_id, label, amount, type, booking_id)
    VALUES (p_user_id, p_label, -p_amount, 'payment', p_booking_id);

    RETURN v_new_balance;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION public.cancel_booking_and_refund(
    p_booking_id text,
    p_user_id uuid
  )
  RETURNS json AS $$
  DECLARE
    v_booking record;
    v_refund_amount numeric;
    v_refunded boolean := false;
    v_label text;
  BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id::text = p_booking_id AND user_id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Booking not found or access denied';
    END IF;

    IF v_booking.status = 'cancelled' THEN
      RAISE EXCEPTION 'Booking has already been cancelled';
    END IF;

    v_refund_amount := COALESCE(v_booking.price, 0);

    UPDATE public.bookings
    SET status = 'cancelled',
        updated_at = now()
    WHERE id::text = p_booking_id AND user_id = p_user_id;

    IF v_refund_amount > 0 THEN
      v_label := 'Refund — ' || COALESCE(v_booking.court_name, 'Court Booking');
      
      PERFORM public.increment_wallet_balance(v_refund_amount, p_user_id);

      INSERT INTO public.wallet_transactions (user_id, label, amount, type, booking_id)
      VALUES (p_user_id, v_label, v_refund_amount, 'refund', p_booking_id);

      v_refunded := true;
    END IF;

    RETURN json_build_object(
      'success', true,
      'booking_id', p_booking_id,
      'refunded', v_refunded,
      'refund_amount', v_refund_amount
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE TABLE IF NOT EXISTS public.facility_follows (
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id bigint NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, facility_id)
  );

  ALTER TABLE public.facility_follows ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "facility_follows_select_own" ON public.facility_follows;
  CREATE POLICY "facility_follows_select_own" ON public.facility_follows
    FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "facility_follows_insert_own" ON public.facility_follows;
  CREATE POLICY "facility_follows_insert_own" ON public.facility_follows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "facility_follows_delete_own" ON public.facility_follows;
  CREATE POLICY "facility_follows_delete_own" ON public.facility_follows
    FOR DELETE USING (auth.uid() = user_id);

  CREATE INDEX IF NOT EXISTS idx_facility_follows_user_id ON public.facility_follows(user_id);

  -- ============================================================================
  -- Admin Console Remediation Schema Migration
  -- Migration: 20260816_admin_remediation_schema.sql
  -- ============================================================================

  -- 1. Persistent Platform Settings
  CREATE TABLE IF NOT EXISTS public.platform_settings (
    key        TEXT        PRIMARY KEY,
    value      JSONB       NOT NULL,
    updated_by UUID        REFERENCES public.player_profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO public.platform_settings (key, value) VALUES
    ('platform_fee_percent', '10'::jsonb),
    ('maintenance_mode', 'false'::jsonb),
    ('auto_verify_owners', 'false'::jsonb),
    ('max_booking_advance_days', '14'::jsonb),
    ('allow_demo_accounts', 'true'::jsonb)
  ON CONFLICT (key) DO NOTHING;

  ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "settings_select" ON public.platform_settings;
  CREATE POLICY "settings_select" ON public.platform_settings FOR SELECT USING (TRUE);

  DROP POLICY IF EXISTS "settings_update" ON public.platform_settings;
  CREATE POLICY "settings_update" ON public.platform_settings FOR UPDATE USING (public.is_admin());

  DROP POLICY IF EXISTS "settings_insert" ON public.platform_settings;
  CREATE POLICY "settings_insert" ON public.platform_settings FOR INSERT WITH CHECK (public.is_admin());

  -- 2. Moderation Columns on posts table
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.player_profiles(id);
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
  END $$;

  -- 3. Payout Batches Table
  CREATE TABLE IF NOT EXISTS public.payout_batches (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by    UUID          NOT NULL REFERENCES public.player_profiles(id),
    triggered_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    recipient_count INTEGER       NOT NULL DEFAULT 0,
    status          TEXT          NOT NULL DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    metadata        JSONB         NOT NULL DEFAULT '{}'::jsonb
  );

  ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "payout_select" ON public.payout_batches;
  CREATE POLICY "payout_select" ON public.payout_batches FOR SELECT USING (public.is_admin());

  DROP POLICY IF EXISTS "payout_insert" ON public.payout_batches;
  CREATE POLICY "payout_insert" ON public.payout_batches FOR INSERT WITH CHECK (public.is_admin());

  -- ============================================================================
  -- Developer Console Telemetry, Error Intelligence & Webhook Logging Schema
  -- Migration: 20260817_dev_console_telemetry_schema.sql
  -- ============================================================================

  -- 1. developer_errors — application exception intelligence
  CREATE TABLE IF NOT EXISTS public.developer_errors (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type          TEXT        NOT NULL,
    message             TEXT        NOT NULL,
    stack_trace         TEXT,
    component           TEXT        NOT NULL DEFAULT 'api',
    environment         TEXT        NOT NULL DEFAULT 'production',
    severity            TEXT        NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'fatal')),
    status              TEXT        NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'resolved')),
    occurrence_count    INTEGER     NOT NULL DEFAULT 1,
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID        REFERENCES public.player_profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 2. webhook_events — outbound webhook dispatch & retry ledger
  CREATE TABLE IF NOT EXISTS public.webhook_events (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          TEXT        NOT NULL,
    endpoint_url        TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    http_status         INTEGER,
    payload             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    response_body       TEXT,
    attempt             INTEGER     NOT NULL DEFAULT 1,
    max_attempts        INTEGER     NOT NULL DEFAULT 3,
    duration_ms         INTEGER,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 3. application_logs — central application telemetry logs
  CREATE TABLE IF NOT EXISTS public.application_logs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level               TEXT        NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    service             TEXT        NOT NULL DEFAULT 'web-app',
    message             TEXT        NOT NULL,
    request_id          TEXT,
    trace_id            TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb
  );

  -- Row Level Security
  ALTER TABLE public.developer_errors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.application_logs  ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "dev_errors_manage" ON public.developer_errors;
  CREATE POLICY "dev_errors_manage" ON public.developer_errors FOR ALL USING (TRUE);

  DROP POLICY IF EXISTS "webhook_events_manage" ON public.webhook_events;
  CREATE POLICY "webhook_events_manage" ON public.webhook_events FOR ALL USING (TRUE);

  DROP POLICY IF EXISTS "application_logs_manage" ON public.application_logs;
  CREATE POLICY "application_logs_manage" ON public.application_logs FOR ALL USING (TRUE);

  -- ==============================================================================
  -- ADMIN & DEVELOPER CONSOLES EXTENSION SCHEMA
  -- platform_settings, feature_flags, developer_audit_logs, dev_role column
  -- ==============================================================================

  -- 1. Ensure dev_role column exists on player_profiles
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'player_profiles' 
        AND column_name = 'dev_role'
    ) THEN
      ALTER TABLE public.player_profiles ADD COLUMN dev_role TEXT;
    END IF;
  END $$;

  -- 2. platform_settings table
  CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Seed default platform settings if not present
  INSERT INTO public.platform_settings (key, value)
  VALUES
    ('platform_fee_percent', '10'::jsonb),
    ('maintenance_mode', 'false'::jsonb),
    ('auto_verify_owners', 'false'::jsonb),
    ('max_booking_advance_days', '14'::jsonb),
    ('allow_demo_accounts', 'true'::jsonb)
  ON CONFLICT (key) DO NOTHING;

  -- 3. feature_flags table
  CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    environment TEXT NOT NULL DEFAULT 'production',
    rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    targeting_rules JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- 4. developer_audit_logs table
  CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'system',
    environment TEXT NOT NULL DEFAULT 'production',
    target_type TEXT,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
  CREATE INDEX IF NOT EXISTS idx_dev_audit_developer ON public.developer_audit_logs(developer_id);
  CREATE INDEX IF NOT EXISTS idx_dev_audit_created_at ON public.developer_audit_logs(created_at DESC);

  -- Enable RLS
  ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "platform_settings_all" ON public.platform_settings;
  CREATE POLICY "platform_settings_all" ON public.platform_settings FOR ALL USING (TRUE);

  DROP POLICY IF EXISTS "feature_flags_all" ON public.feature_flags;
  CREATE POLICY "feature_flags_all" ON public.feature_flags FOR ALL USING (TRUE);

  DROP POLICY IF EXISTS "developer_audit_logs_all" ON public.developer_audit_logs;
  CREATE POLICY "developer_audit_logs_all" ON public.developer_audit_logs FOR ALL USING (TRUE);

  -- ============================================================================
  -- Developer Console Telemetry, Error Intelligence & Webhook Logging Schema
  -- ============================================================================

  -- developer_errors — application exception intelligence
  CREATE TABLE IF NOT EXISTS public.developer_errors (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type          TEXT        NOT NULL,
    message             TEXT        NOT NULL,
    stack_trace         TEXT,
    component           TEXT        NOT NULL DEFAULT 'api',
    environment         TEXT        NOT NULL DEFAULT 'production',
    severity            TEXT        NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'fatal')),
    status              TEXT        NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'resolved')),
    occurrence_count    INTEGER     NOT NULL DEFAULT 1,
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID        REFERENCES public.player_profiles(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- webhook_events — outbound webhook dispatch & retry ledger
  CREATE TABLE IF NOT EXISTS public.webhook_events (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type          TEXT        NOT NULL,
    endpoint_url        TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    http_status         INTEGER,
    payload             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    response_body       TEXT,
    attempt             INTEGER     NOT NULL DEFAULT 1,
    max_attempts        INTEGER     NOT NULL DEFAULT 3,
    duration_ms         INTEGER,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- application_logs — central application telemetry logs
  CREATE TABLE IF NOT EXISTS public.application_logs (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level               TEXT        NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
    service             TEXT        NOT NULL DEFAULT 'web-app',
    message             TEXT        NOT NULL,
    request_id          TEXT,
    trace_id            TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb
  );

  -- Indexes for telemetry tables
  CREATE INDEX IF NOT EXISTS idx_dev_errors_status ON public.developer_errors(status);
  CREATE INDEX IF NOT EXISTS idx_dev_errors_created ON public.developer_errors(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON public.webhook_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON public.application_logs(timestamp DESC);

  -- Enable RLS
  ALTER TABLE public.developer_errors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.application_logs  ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "dev_errors_manage" ON public.developer_errors;
  CREATE POLICY "dev_errors_manage" ON public.developer_errors FOR ALL USING (public.is_dev() OR public.is_admin());

  DROP POLICY IF EXISTS "webhook_events_manage" ON public.webhook_events;
  CREATE POLICY "webhook_events_manage" ON public.webhook_events FOR ALL USING (public.is_dev() OR public.is_admin());

  DROP POLICY IF EXISTS "application_logs_manage" ON public.application_logs;
  CREATE POLICY "application_logs_manage" ON public.application_logs FOR ALL USING (public.is_dev() OR public.is_admin());

  -- Moderation Columns on feed_posts and posts tables
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_posts') THEN
      ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
      ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.player_profiles(id);
      ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.player_profiles(id);
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
  END $$;

  -- Auto-elevate developer and administrator accounts in player_profiles
  UPDATE public.player_profiles
  SET 
    is_admin = TRUE,
    role = 'dev',
    admin_role = 'super_admin',
    dev_role = 'super_developer',
    verification_status = 'verified',
    console_access = ARRAY['player', 'admin', 'dev']
  WHERE 
    id IN (
      SELECT id FROM auth.users 
      WHERE LOWER(email) LIKE '%picklersdev%' 
        OR LOWER(email) LIKE '%admin@picklers.com%' 
        OR LOWER(email) LIKE '%dev@picklers.com%'
        OR LOWER(email) LIKE '%ricdarrylzernacielo%'
        OR LOWER(email) LIKE '%@picklers.com%'
    );

  -- Double-booking prevention: partial unique index on confirmed/pending bookings
  CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_booking
  ON public.bookings (facility_id, court_name, date, time)
  WHERE status IN ('pending', 'upcoming', 'active', 'confirmed');

  -- =================================================================
  -- Intrusion Detection System (IDS) & Honeypot Deception
  -- =================================================================
  CREATE TABLE IF NOT EXISTS public.security_threat_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    ip_address TEXT NOT NULL,
    country_code TEXT,
    city TEXT,
    user_agent TEXT,
    user_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    target_path TEXT NOT NULL,
    http_method TEXT NOT NULL DEFAULT 'GET',
    payload_preview JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'detected',
    resolved_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_threat_events_ip ON public.security_threat_events(ip_address);
  CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON public.security_threat_events(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON public.security_threat_events(severity);
  CREATE INDEX IF NOT EXISTS idx_threat_events_status ON public.security_threat_events(status);
  CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type ON public.security_threat_events(threat_type);

  CREATE TABLE IF NOT EXISTS public.blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT NOT NULL,
    threat_event_id UUID REFERENCES public.security_threat_events(id) ON DELETE SET NULL,
    blocked_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);

  ALTER TABLE public.security_threat_events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "dev_threats_select" ON public.security_threat_events;
  CREATE POLICY "dev_threats_select" ON public.security_threat_events FOR SELECT 
  USING (public.is_dev() OR public.is_admin());

  DROP POLICY IF EXISTS "dev_threats_insert" ON public.security_threat_events;
  CREATE POLICY "dev_threats_insert" ON public.security_threat_events FOR INSERT 
  WITH CHECK (true);

  DROP POLICY IF EXISTS "dev_threats_update" ON public.security_threat_events;
  CREATE POLICY "dev_threats_update" ON public.security_threat_events FOR UPDATE 
  USING (public.is_dev() OR public.is_admin());

  DROP POLICY IF EXISTS "blocked_ips_all" ON public.blocked_ips;
  CREATE POLICY "blocked_ips_all" ON public.blocked_ips FOR ALL 
  USING (public.is_dev() OR public.is_admin());

-- =====================================================================
-- MIGRATION: Rename player_likes → player_follows (20260815)
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_likes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_follows'
  ) THEN
    ALTER TABLE public.player_likes RENAME TO player_follows;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_follows' AND column_name = 'liker_id'
  ) THEN
    ALTER TABLE public.player_follows RENAME COLUMN liker_id TO follower_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_follows' AND column_name = 'liked_id'
  ) THEN
    ALTER TABLE public.player_follows RENAME COLUMN liked_id TO following_id;
  END IF;

  DROP POLICY IF EXISTS "player_likes_select_all" ON public.player_follows;
  DROP POLICY IF EXISTS "player_likes_insert_self" ON public.player_follows;
  DROP POLICY IF EXISTS "player_likes_delete_self" ON public.player_follows;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_select_all'
  ) THEN
    CREATE POLICY "player_follows_select_all" ON public.player_follows FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_insert_self'
  ) THEN
    CREATE POLICY "player_follows_insert_self" ON public.player_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_delete_self'
  ) THEN
    CREATE POLICY "player_follows_delete_self" ON public.player_follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;

  DROP INDEX IF EXISTS public.idx_player_likes_liker;
  DROP INDEX IF EXISTS public.idx_player_likes_liked;
END $$;

CREATE INDEX IF NOT EXISTS idx_player_follows_follower ON public.player_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_player_follows_following ON public.player_follows(following_id);

-- =====================================================================
-- MIGRATION: Create post_reports table (20260815)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.post_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'other')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_auth" ON public.post_reports;
CREATE POLICY "reports_insert_auth" ON public.post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON public.post_reports;
CREATE POLICY "reports_select_own" ON public.post_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_post_reports_post ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter ON public.post_reports(reporter_id);

-- =====================================================================
-- MIGRATION: Create get_inbox RPC function (20260815)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_inbox(p_user_id uuid)
RETURNS TABLE (
  user_id         uuid,
  name            text,
  avatar_url      text,
  level           text,
  online          boolean,
  last_message    text,
  last_at         timestamptz,
  unread_count    bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH conv_partners AS (
    SELECT DISTINCT
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS partner_id
    FROM public.direct_messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (cp.partner_id)
      cp.partner_id,
      dm.content AS last_message,
      dm.created_at AS last_at
    FROM conv_partners cp
    CROSS JOIN LATERAL (
      SELECT content, created_at
      FROM public.direct_messages
      WHERE (sender_id = p_user_id AND receiver_id = cp.partner_id)
         OR (sender_id = cp.partner_id AND receiver_id = p_user_id)
      ORDER BY created_at DESC
      LIMIT 1
    ) dm
    ORDER BY cp.partner_id, dm.created_at DESC
  ),
  unreads AS (
    SELECT
      sender_id AS partner_id,
      COUNT(*)::bigint AS unread_count
    FROM public.direct_messages
    WHERE receiver_id = p_user_id AND read = false
    GROUP BY sender_id
  )
  SELECT
    pp.id AS user_id,
    COALESCE(pp.name, 'Unknown Player')::text AS name,
    pp.avatar_url::text AS avatar_url,
    COALESCE(pp.level, '2.5')::text AS level,
    COALESCE(pp.online, false) AS online,
    COALESCE(lm.last_message, '')::text AS last_message,
    lm.last_at,
    COALESCE(u.unread_count, 0)::bigint AS unread_count
  FROM latest_messages lm
  JOIN public.player_profiles pp ON pp.id = lm.partner_id
  LEFT JOIN unreads u ON u.partner_id = lm.partner_id
  ORDER BY lm.last_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Security & Production Remediation: Wallet RPC, 24h Refund & Tournaments
-- Migration: 20260827000000_fix_wallet_rpc_and_tournaments.sql
-- ============================================================================

-- 1. Create increment_wallet_balance_admin RPC for secure server-side wallet operations (Webhooks, Admin credits)
CREATE OR REPLACE FUNCTION public.increment_wallet_balance_admin(
  amount NUMERIC,
  user_id UUID,
  p_label TEXT DEFAULT 'Wallet Top-Up (PayMongo)'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive number, got: %', amount;
  END IF;

  IF amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum limit of 1000000, got: %', amount;
  END IF;

  -- Lock wallet row for atomic update
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE wallets.user_id = increment_wallet_balance_admin.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (increment_wallet_balance_admin.user_id, amount)
    RETURNING balance INTO v_new_balance;
  ELSE
    v_new_balance := v_current_balance + amount;
    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = now()
    WHERE wallets.user_id = increment_wallet_balance_admin.user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, label, amount, type)
  VALUES (increment_wallet_balance_admin.user_id, p_label, amount, 'topup');

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) TO postgres;

-- 2. Enhance cancel_booking_and_refund with 24-hour policy enforcement and secure refund
CREATE OR REPLACE FUNCTION public.cancel_booking_and_refund(
  p_booking_id text,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  v_booking record;
  v_refund_amount numeric := 0;
  v_refunded boolean := false;
  v_is_eligible boolean := false;
  v_label text;
  v_booking_datetime timestamptz;
BEGIN
  -- Fetch booking record ensuring owner matching
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking has already been cancelled';
  END IF;

  -- 24-Hour Policy Check:
  BEGIN
    v_booking_datetime := (v_booking.date || ' 00:00:00+08')::timestamptz;
    IF v_booking_datetime >= (now() + interval '24 hours') THEN
      v_is_eligible := true;
    ELSE
      v_is_eligible := false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: if date parsing fails, allow refund if booking was created recently (<1 hour ago)
    v_is_eligible := (v_booking.created_at >= (now() - interval '1 hour'));
  END;

  -- Update booking status to cancelled
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  -- Only issue refund if eligible under the 24-hour rule
  IF v_is_eligible AND COALESCE(v_booking.price, 0) > 0 THEN
    v_refund_amount := v_booking.price;
    v_label := 'Refund (24h Notice) — ' || COALESCE(v_booking.court_name, 'Court Booking');
    
    PERFORM public.increment_wallet_balance_admin(v_refund_amount, p_user_id, v_label);
    v_refunded := true;
  ELSE
    v_refund_amount := 0;
    v_refunded := false;
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'refunded', v_refunded,
    'refund_amount', v_refund_amount,
    'eligible_24h', v_is_eligible
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tournament Registrations Table & RLS
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  partner_name text,
  player_level text DEFAULT '2.5',
  contact_phone text,
  contact_email text,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_tournament_user UNIQUE (tournament_id, user_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tournament registrations" ON public.tournament_registrations;
CREATE POLICY "Users can view tournament registrations" ON public.tournament_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can register for tournaments" ON public.tournament_registrations;
CREATE POLICY "Users can register for tournaments" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel their own registrations" ON public.tournament_registrations;
CREATE POLICY "Users can cancel their own registrations" ON public.tournament_registrations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user ON public.tournament_registrations(user_id);

-- ============================================================================
-- Developer Console Telemetry, Error Intelligence & Webhook Logging Schema
-- Migration: 20260817_dev_console_telemetry_schema.sql
-- ============================================================================

-- 1. developer_errors — application exception intelligence
CREATE TABLE IF NOT EXISTS public.developer_errors (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type          TEXT        NOT NULL,
  message             TEXT        NOT NULL,
  stack_trace         TEXT,
  component           TEXT        NOT NULL DEFAULT 'api',
  environment         TEXT        NOT NULL DEFAULT 'production',
  severity            TEXT        NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'fatal')),
  status              TEXT        NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'resolved')),
  occurrence_count    INTEGER     NOT NULL DEFAULT 1,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID        REFERENCES public.player_profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. webhook_events — outbound webhook dispatch & retry ledger
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          TEXT        NOT NULL,
  endpoint_url        TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status         INTEGER,
  payload             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  response_body       TEXT,
  attempt             INTEGER     NOT NULL DEFAULT 1,
  max_attempts        INTEGER     NOT NULL DEFAULT 3,
  duration_ms         INTEGER,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. application_logs — central application telemetry logs
CREATE TABLE IF NOT EXISTS public.application_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level               TEXT        NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  service             TEXT        NOT NULL DEFAULT 'web-app',
  message             TEXT        NOT NULL,
  request_id          TEXT,
  trace_id            TEXT,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Row Level Security
ALTER TABLE public.developer_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_logs  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_errors_manage" ON public.developer_errors;
CREATE POLICY "dev_errors_manage" ON public.developer_errors FOR ALL USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "webhook_events_manage" ON public.webhook_events;
CREATE POLICY "webhook_events_manage" ON public.webhook_events FOR ALL USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "application_logs_manage" ON public.application_logs;
CREATE POLICY "application_logs_manage" ON public.application_logs FOR ALL USING (public.is_dev() OR public.is_admin());

-- =================================================================
-- Migration: Intrusion Detection System (IDS) & Honeypot Deception
-- Tables: security_threat_events, blocked_ips
-- =================================================================

CREATE TABLE IF NOT EXISTS public.security_threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  ip_address TEXT NOT NULL,
  country_code TEXT,
  city TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  target_path TEXT NOT NULL,
  http_method TEXT NOT NULL DEFAULT 'GET',
  payload_preview JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'detected',
  resolved_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_ip ON public.security_threat_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON public.security_threat_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON public.security_threat_events(severity);
CREATE INDEX IF NOT EXISTS idx_threat_events_status ON public.security_threat_events(status);
CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type ON public.security_threat_events(threat_type);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  threat_event_id UUID REFERENCES public.security_threat_events(id) ON DELETE SET NULL,
  blocked_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);

-- Enable RLS
ALTER TABLE public.security_threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_threats_select" ON public.security_threat_events;
CREATE POLICY "dev_threats_select" ON public.security_threat_events FOR SELECT 
USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "dev_threats_insert" ON public.security_threat_events;
CREATE POLICY "dev_threats_insert" ON public.security_threat_events FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "dev_threats_update" ON public.security_threat_events;
CREATE POLICY "dev_threats_update" ON public.security_threat_events FOR UPDATE 
USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "blocked_ips_all" ON public.blocked_ips;
CREATE POLICY "blocked_ips_all" ON public.blocked_ips FOR ALL 
USING (public.is_dev() OR public.is_admin());

-- =============================================================
-- MIGRATION: 20260902000001_atomic_booking_lock.sql
-- A-002 FIX: Atomic advisory-lock booking slot check to prevent
-- race-condition double-bookings under concurrent load.
-- =============================================================

DROP FUNCTION IF EXISTS public.try_book_slot(integer, text, date, text) CASCADE;

CREATE OR REPLACE FUNCTION public.try_book_slot(
  p_facility_id integer,
  p_court_name  text,
  p_date        date,
  p_time        text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_id     bigint;
  v_existing_id uuid;
BEGIN
  v_lock_id := hashtext(
    p_facility_id::text || '|' || p_court_name || '|' || p_date::text || '|' || p_time
  );

  IF NOT pg_try_advisory_xact_lock(v_lock_id) THEN
    RETURN false;
  END IF;

  SELECT id INTO v_existing_id
  FROM public.bookings
  WHERE facility_id = p_facility_id
    AND court_name  = p_court_name
    AND date        = p_date
    AND time        = p_time
    AND status      = 'confirmed'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_book_slot(integer, text, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.try_book_slot(integer, text, date, text) FROM public;
