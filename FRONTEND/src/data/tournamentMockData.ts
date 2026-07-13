import { Team } from '@/lib/tournament/types';

export interface MockTeamData {
  name: string;
  player1: string;
  player2: string;
  color: string;
}

export const MOCK_TEAM_POOL: MockTeamData[] = [
  { name: 'Dink Dynasty', player1: 'Marco R.', player2: 'Liza C.', color: '#3B82F6' },
  { name: 'Net Ninjas', player1: 'Jake T.', player2: 'Ava P.', color: '#8B5CF6' },
  { name: 'The Pickled Ones', player1: 'Bennie O.', player2: 'Kira L.', color: '#EC4899' },
  { name: 'Kitchen Krusaders', player1: 'Dan M.', player2: 'Mia S.', color: '#F59E0B' },
  { name: 'Smash Bros', player1: 'Carlos V.', player2: 'Raj K.', color: '#EF4444' },
  { name: 'Rally Rebels', player1: 'Sam W.', player2: 'Noa F.', color: '#10B981' },
  { name: 'Drop Shot Legends', player1: 'Andre B.', player2: 'Yuki H.', color: '#06B6D4' },
  { name: 'Paddle Pioneers', player1: 'Eli J.', player2: 'Zoe D.', color: '#F97316' },
  { name: 'Court Crushers', player1: 'Tomas G.', player2: 'Aria N.', color: '#6366F1' },
  { name: 'Spin Masters', player1: 'Leo C.', player2: 'Maya R.', color: '#14B8A6' },
  { name: 'Volley Vipers', player1: 'Jay P.', player2: 'Luna K.', color: '#A855F7' },
  { name: 'Baseline Bandits', player1: 'Oscar M.', player2: 'Ruby T.', color: '#F43F5E' },
  { name: 'Ace Alliance', player1: 'Nico H.', player2: 'Suki B.', color: '#0EA5E9' },
  { name: 'Pickle Power', player1: 'Vince A.', player2: 'Jess L.', color: '#84CC16' },
  { name: 'Slam Squad', player1: 'Diego F.', player2: 'Hana W.', color: '#D946EF' },
  { name: 'Dink & Drive', player1: 'Kai Z.', player2: 'Eve S.', color: '#FB923C' },
  { name: 'Net Worth', player1: 'Ryu M.', player2: 'Cleo J.', color: '#22D3EE' },
  { name: 'Third Shot Drop', player1: 'Axel K.', player2: 'Iris V.', color: '#4ADE80' },
  { name: 'Backhand Bandits', player1: 'Hugo L.', player2: 'Stella P.', color: '#818CF8' },
  { name: 'Kitchen Sink', player1: 'Finn R.', player2: 'Olive D.', color: '#FB7185' },
  { name: 'Lob City', player1: 'Noah G.', player2: 'Jade F.', color: '#2DD4BF' },
  { name: 'Zero Zero Two', player1: 'Rex T.', player2: 'Lily B.', color: '#FBBF24' },
  { name: 'Point Breakers', player1: 'Cruz N.', player2: 'Mika H.', color: '#C084FC' },
  { name: 'Pickle Juice', player1: 'Soren W.', player2: 'Cora A.', color: '#34D399' },
  { name: 'The Erne Eagles', player1: 'Blaze C.', player2: 'Wren K.', color: '#60A5FA' },
  { name: 'Fault Line', player1: 'Knox M.', player2: 'Sage R.', color: '#F87171' },
  { name: 'Side Out Squad', player1: 'Nash J.', player2: 'Bria L.', color: '#A78BFA' },
  { name: 'Poach Patrol', player1: 'Reed V.', player2: 'Tess S.', color: '#38BDF8' },
  { name: 'ATP Force', player1: 'Jude P.', player2: 'Ivy G.', color: '#4ADE80' },
  { name: 'No Man\'s Land', player1: 'Cole D.', player2: 'Faye T.', color: '#FB923C' },
  { name: 'Paddle Battle', player1: 'Heath N.', player2: 'Lark B.', color: '#E879F9' },
  { name: 'Court Jesters', player1: 'Ash K.', player2: 'Neve H.', color: '#67E8F9' },
];

/**
 * Get N mock teams with realistic pickleball names.
 */
export function getMockTeams(count: number, tournamentId: string = 't1'): Team[] {
  return Array.from({ length: count }, (_, i) => {
    const mockData = MOCK_TEAM_POOL[i % MOCK_TEAM_POOL.length];
    return {
      id: `t${i + 1}`,
      name: mockData.name,
      tournament_id: tournamentId,
      division_id: null,
      withdrawn: false,
      created_at: new Date().toISOString(),
    };
  });
}

/**
 * Get the mock data (player names, color) for a team by its name.
 */
export function getMockTeamData(teamName: string): MockTeamData | undefined {
  return MOCK_TEAM_POOL.find(t => t.name === teamName);
}
