# Pickleball Tournament Management Architecture Design

## 1. Architecture Overview
**Approach:** Next.js Application Layer (TypeScript) with a Flexible Teams Schema.
All Match Advancement and Tie-Breaker logic will live in the application layer (Next.js backend endpoints/services) to ensure it is highly testable and maintainable. The database will function purely as a State Machine containing nodes (Matches) that point to each other.

## 2. SQL Database Schema (Supabase PostgreSQL)

```sql
-- ENUMS
CREATE TYPE tournament_type AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN');
CREATE TYPE match_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE bracket_type AS ENUM ('WINNER', 'LOSER', 'ROUND_ROBIN', 'FINAL', 'TIEBREAKER');

-- 1. TOURNAMENTS
CREATE TABLE Tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    type tournament_type NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TEAMS (Flexible for Singles or Doubles)
CREATE TABLE Teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES Tournaments(id) ON DELETE CASCADE,
    name VARCHAR(255),
    withdrawn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TEAM PLAYERS (Junction table for flexibility)
CREATE TABLE TeamPlayers (
    team_id UUID REFERENCES Teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    PRIMARY KEY (team_id, user_id)
);

-- 4. MATCHES (The State Machine Nodes)
CREATE TABLE Matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES Tournaments(id) ON DELETE CASCADE,
    bracket_type bracket_type NOT NULL,
    round_number INT NOT NULL,
    match_sequence INT, -- Visual ordering within a round
    
    team1_id UUID REFERENCES Teams(id),
    team2_id UUID REFERENCES Teams(id),
    
    winner_id UUID REFERENCES Teams(id),
    loser_id UUID REFERENCES Teams(id),
    
    -- State Machine Routing
    next_match_winner_goes_to UUID REFERENCES Matches(id),
    next_match_loser_goes_to UUID REFERENCES Matches(id),
    
    status match_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GAMES (For accurate Round Robin tie-breakers and validation)
CREATE TABLE Games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES Matches(id) ON DELETE CASCADE,
    game_number INT NOT NULL, -- 1, 2, or 3
    team1_score INT,
    team2_score INT,
    UNIQUE(match_id, game_number)
);
```

## 3. Match Advancement Logic (Application Layer)

When a score is submitted, the frontend calls a Next.js API endpoint (e.g., `POST /api/tournaments/:id/matches/:matchId/submit-score`).

The backend service performs the following logic in a single transaction:
1. **Validation:** Checks if the submitted game scores are valid (e.g., reached 11 points, win by 2). If invalid, aborts and throws an error.
2. **Determine Winner:** Aggregates game scores (best 2 out of 3) to determine the overall match winner and loser.
3. **Update Match:** Sets `winner_id`, `loser_id`, and `status = 'COMPLETED'` on the current match.
4. **Advance Teams (The State Machine):**
    - Looks up the `next_match_winner_goes_to` UUID. If it exists, updates that subsequent match, placing the `winner_id` into an empty `team1_id` or `team2_id` slot.
    - Looks up the `next_match_loser_goes_to` UUID (crucial for Double Elimination). If it exists, places the `loser_id` into the corresponding slot in the lower bracket.

## 4. Bracket Reset Logic (Double Elimination Edge Case)

For Double Elimination, the "Grand Final" is a match between the Winner's Bracket Champion and the Loser's Bracket Champion.

*   If the **Winner's Bracket Champion wins**, the tournament is over.
*   If the **Loser's Bracket Champion wins**, a **Bracket Reset** occurs. 

**Implementation Details:**
During the initial bracket generation, the system creates the Grand Final match. It *also* generates a hidden "If-Necessary Tiebreaker" match (1 game to 15, win by 2).
*   The Grand Final's `next_match_loser_goes_to` is left NULL (the loser is out).
*   The Grand Final's `next_match_winner_goes_to` points to the Tiebreaker match. 
*   **The Catch:** Our Match Advancement Service contains special logic for the Grand Final: *If the team coming from the Winner's bracket wins the Grand Final, the backend automatically cancels/deletes the Tiebreaker match and marks the tournament complete.* If the Loser's bracket champion wins, they both advance into the Tiebreaker match.

## 5. Tie-Breaker Algorithm (Round Robin)

If a team withdraws, their `Teams.withdrawn` flag is set to `TRUE`, and their matches are excluded from all calculations.

The standing calculation runs through this strict waterfall:
1. **Total Wins / Win Percentage.**
2. **Head-to-Head matches won** (If 2 teams are tied).
3. **Total Point Differential** across all valid games played (using the `Games` table).
4. **Head-to-Head Point Differential** (If still tied on total points).
5. **Point differential against the next-highest ranked team.**

*Note: In the case of a 3-way tie, Head-to-Head might form a circle (A beat B, B beat C, C beat A). In this case, the system immediately drops to rule #3 (Total Point Differential) to break the 3-way tie.*
