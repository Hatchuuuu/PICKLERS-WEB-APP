export type TournamentType = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN';
export type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FORFEITED';
export type ScoringFormat = 'BEST_OF_3_TO_11' | 'SINGLE_GAME_TO_15' | 'SINGLE_GAME_TO_21';
export type BracketType = 'WINNER' | 'LOSER' | 'ROUND_ROBIN' | 'FINAL' | '3RD_PLACE' | 'TIEBREAKER' | 'PLAYOFF';

export interface Tournament {
    id: string;
    owner_id: string;
    name: string;
    type: TournamentType;
    scoring_format: ScoringFormat;
    status: string;
    created_at: string;
}

export interface Division {
    id: string;
    tournament_id: string;
    name: string;
    scoring_format: ScoringFormat;
    created_at: string;
}

export interface Team {
    id: string;
    tournament_id: string;
    division_id: string | null;
    name: string;
    player_id?: string;
    withdrawn: boolean;
    created_at: string;
}

export interface TeamPlayer {
    team_id: string;
    user_id: string;
}

export interface Match {
    id: string;
    tournament_id: string;
    division_id: string | null;
    bracket_type: BracketType;
    round_number: number;
    match_sequence: number | null;
    
    team1_id: string | null;
    team2_id: string | null;
    
    winner_id: string | null;
    loser_id: string | null;
    
    next_match_winner_goes_to: string | null;
    next_match_loser_goes_to: string | null;
    
    status: MatchStatus;
    created_at: string;
}

export interface Game {
    id: string;
    match_id: string;
    game_number: number; // 1, 2, or 3
    team1_score: number | null;
    team2_score: number | null;
}
