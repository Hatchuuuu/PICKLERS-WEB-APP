-- ====================================================================
-- 1. ENUMS (If not already created)
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tournament_type') THEN
        CREATE TYPE tournament_type AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'ROUND_ROBIN_PLAYOFFS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scoring_format') THEN
        CREATE TYPE scoring_format AS ENUM ('BEST_OF_3_TO_11', 'SINGLE_GAME_TO_15', 'SINGLE_GAME_TO_21');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
        CREATE TYPE match_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FORFEITED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bracket_type') THEN
        CREATE TYPE bracket_type AS ENUM ('WINNER', 'LOSER', 'ROUND_ROBIN', 'FINAL', '3RD_PLACE', 'TIEBREAKER', 'PLAYOFF');
    END IF;
END$$;

-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- TOURNAMENTS
CREATE TABLE tournaments (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    teams_count INTEGER NOT NULL,
    division TEXT NOT NULL DEFAULT 'Open',
    date TEXT,
    prize_pool TEXT,
    play_type TEXT NOT NULL DEFAULT 'doubles',
    scoring_format scoring_format NOT NULL DEFAULT 'BEST_OF_3_TO_11',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TOURNAMENT TEAMS
CREATE TABLE tournament_teams (
    id TEXT PRIMARY KEY, -- Uses custom text ID (e.g. 'team_1_1234')
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    division_id TEXT,
    name TEXT NOT NULL,
    player1_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    player2_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    withdrawn BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATCHES
CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    division_id TEXT,
    bracket_type bracket_type NOT NULL,
    round_number INTEGER NOT NULL,
    match_sequence INTEGER,
    team1_id TEXT REFERENCES tournament_teams(id) ON DELETE SET NULL,
    team2_id TEXT REFERENCES tournament_teams(id) ON DELETE SET NULL,
    winner_id TEXT REFERENCES tournament_teams(id) ON DELETE SET NULL,
    loser_id TEXT REFERENCES tournament_teams(id) ON DELETE SET NULL,
    next_match_winner_goes_to TEXT,
    next_match_loser_goes_to TEXT,
    status match_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATCH GAMES (For Best of 3 / Tracking sub-scores)
CREATE TABLE match_games (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    team1_score INTEGER,
    team2_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_game_number CHECK (game_number BETWEEN 1 AND 5)
);

-- ====================================================================
-- 3. INDEXES
-- ====================================================================

CREATE INDEX idx_tournaments_owner ON tournaments(owner_id);
CREATE INDEX idx_tournament_teams_tourn ON tournament_teams(tournament_id);
CREATE INDEX idx_matches_tourn ON matches(tournament_id);
CREATE INDEX idx_matches_teams ON matches(team1_id, team2_id);
CREATE INDEX idx_match_games_match ON match_games(match_id);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_games ENABLE ROW LEVEL SECURITY;

-- Tournaments: Viewable by all, insert/update by owner
CREATE POLICY "Tournaments viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Owners can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "Owners can update their tournaments" ON tournaments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their tournaments" ON tournaments FOR DELETE USING (auth.uid() = owner_id);

-- Tournament Teams: Viewable by all, managed by tournament owner
CREATE POLICY "Teams viewable by everyone" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "Owners can manage teams" ON tournament_teams FOR ALL USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_teams.tournament_id AND (t.owner_id = auth.uid() OR t.owner_id IS NULL))
);

-- Matches: Viewable by all, managed by tournament owner
CREATE POLICY "Matches viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Owners can manage matches" ON matches FOR ALL USING (
    EXISTS (SELECT 1 FROM tournaments t WHERE t.id = matches.tournament_id AND (t.owner_id = auth.uid() OR t.owner_id IS NULL))
);

-- Match Games: Viewable by all, managed by tournament owner
CREATE POLICY "Games viewable by everyone" ON match_games FOR SELECT USING (true);
CREATE POLICY "Owners can manage games" ON match_games FOR ALL USING (
    EXISTS (
        SELECT 1 FROM matches m 
        JOIN tournaments t ON m.tournament_id = t.id 
        WHERE m.id = match_games.match_id AND (t.owner_id = auth.uid() OR t.owner_id IS NULL)
    )
);

-- ====================================================================
-- 5. TRIGGERS
-- ====================================================================

CREATE TRIGGER update_tournaments_modtime BEFORE UPDATE ON tournaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tournament_teams_modtime BEFORE UPDATE ON tournament_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_modtime BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_match_games_modtime BEFORE UPDATE ON match_games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 6. RPC FUNCTIONS
-- ====================================================================
CREATE OR REPLACE FUNCTION get_tournament_games(t_id TEXT)
RETURNS SETOF match_games AS $$
BEGIN
    RETURN QUERY 
    SELECT g.* FROM match_games g
    JOIN matches m ON g.match_id = m.id
    WHERE m.tournament_id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
