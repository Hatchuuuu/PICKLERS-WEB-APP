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
