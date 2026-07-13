-- 1. Tournaments Table
CREATE TABLE public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    format TEXT NOT NULL, -- 'single', 'double', 'round_robin'
    play_type TEXT DEFAULT 'doubles', -- 'singles', 'doubles'
    status TEXT DEFAULT 'active', -- 'upcoming', 'active', 'completed'
    teams_count INTEGER NOT NULL,
    division TEXT DEFAULT 'Open',
    date DATE,
    prize TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tournament Participants / Teams Table
CREATE TABLE public.tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    player1_id UUID REFERENCES auth.users(id),
    player2_id UUID REFERENCES auth.users(id), -- Null if singles
    withdrawn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matches Table (The State Machine)
CREATE TABLE public.matches (
    id TEXT PRIMARY KEY, -- e.g. "m_1_1_tournamentId"
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    bracket_type TEXT NOT NULL, -- 'WINNER', 'LOSER', 'ROUND_ROBIN'
    round_number INTEGER NOT NULL,
    match_sequence INTEGER NOT NULL,
    team1_id UUID REFERENCES public.tournament_teams(id),
    team2_id UUID REFERENCES public.tournament_teams(id),
    winner_id UUID REFERENCES public.tournament_teams(id),
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED'
    next_match_id TEXT,
    loser_next_match_id TEXT,
    is_bye BOOLEAN DEFAULT FALSE
);

-- 4. Match Games / Scores Table
CREATE TABLE public.match_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id TEXT REFERENCES public.matches(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    team1_score INTEGER DEFAULT 0,
    team2_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access on tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on tournament_teams" ON public.tournament_teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public read access on match_games" ON public.match_games FOR SELECT USING (true);

-- Allow owner full access (Simplified for now - assumes authenticated user can create/manage)
-- In a real production app, you would verify auth.uid() = owner_id
CREATE POLICY "Allow auth all on tournaments" ON public.tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth all on tournament_teams" ON public.tournament_teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth all on matches" ON public.matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow auth all on match_games" ON public.match_games FOR ALL USING (auth.role() = 'authenticated');
