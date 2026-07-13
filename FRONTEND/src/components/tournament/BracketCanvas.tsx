import { useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { MatchNode, TournamentMatch } from './MatchNode';
import { WinnerModal } from './WinnerModal';

// Layout constants
const MATCH_W = 260;
const MATCH_H = 107; // True physical height of MatchNode card (2 rows * 52px + 1px divider + 2px border)
const COLUMN_GAP = 100;
const ROUND_WIDTH = MATCH_W + COLUMN_GAP;
const BASE_MATCH_SPACING = 130;
const SECTION_GAP = 120;

// Left margin wide enough for drop path channels (outX = column_x - up to 60px)
const START_X = 80;
const START_Y = 80;

// Row snap offset: Exact distance from the card center to each row's center
const ROW_OFFSET = 26.5;

interface MatchPosition {
  match: TournamentMatch;
  x: number;
  y: number;
}

interface ConnectorPath {
  d: string;
  isActive: boolean;
  isLoserBracket: boolean;
  delay: number;
  isDropPath?: boolean;
}

function computeRoundPositions(
  rounds: TournamentMatch[][],
  startX: number,
  startY: number
): { positions: MatchPosition[]; width: number; height: number } {
  if (rounds.length === 0) return { positions: [], width: 0, height: 0 };

  const maxMatches = Math.max(...rounds.map(r => r.length), 0);
  if (maxMatches === 0) return { positions: [], width: 0, height: 0 };

  const totalHeight = maxMatches * BASE_MATCH_SPACING;
  const positions: MatchPosition[] = [];

  for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
    const round = rounds[rIdx];
    if (round.length === 0) continue;
    const x = startX + rIdx * ROUND_WIDTH;
    const sliceH = totalHeight / round.length;

    for (let mIdx = 0; mIdx < round.length; mIdx++) {
      const y = startY + sliceH * mIdx + sliceH / 2;
      positions.push({ match: round[mIdx], x, y });
    }
  }

  return { positions, width: rounds.length * ROUND_WIDTH, height: totalHeight };
}

/**
 * Winner-path connectors within a bracket section.
 * Lines snap to the winning team's specific row center.
 */
function computeConnectors(
  rounds: TournamentMatch[][],
  posMap: Map<string, MatchPosition>,
  isLoserBracket: boolean
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];

  for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
    const round = rounds[rIdx];

    for (let mIdx = 0; mIdx < round.length; mIdx++) {
      const match = round[mIdx];
      if (!match.next_match_winner_goes_to) continue;

      const fromPos = posMap.get(match.id);
      const toPos = posMap.get(match.next_match_winner_goes_to);
      if (!fromPos || !toPos) continue;

      // Only intra-bracket lines
      const isTargetInSameSection = rounds.some(r => r.some(m => m.id === match.next_match_winner_goes_to));
      if (!isTargetInSameSection) continue;

      const isActive = match.status === 'COMPLETED' && !!match.winner_id && toPos.match.status !== 'CANCELLED';

      let y2Offset = 0;
      let winnerId: string | null = null;
      if (match.status === 'COMPLETED' && match.winner_id) {
        winnerId = match.winner_id;
      }

      if (winnerId && toPos.match.player1?.id === winnerId) {
        y2Offset = -ROW_OFFSET;
      } else if (winnerId && toPos.match.player2?.id === winnerId) {
        y2Offset = ROW_OFFSET;
      } else {
        // Fallback for incomplete matches
        if (fromPos.y < toPos.y - 10) y2Offset = -ROW_OFFSET;
        else if (fromPos.y > toPos.y + 10) y2Offset = ROW_OFFSET;
      }
      
      const x1 = fromPos.x + MATCH_W;
      const x2 = toPos.x;
      const y2 = toPos.y + y2Offset;
      const r = 8;
      
      let d: string;
      if (isActive) {
        let y1Offset = 0;
        if (match.winner_id === match.player1?.id) y1Offset = -ROW_OFFSET;
        else if (match.winner_id === match.player2?.id) y1Offset = ROW_OFFSET;
        
        const y1 = fromPos.y + y1Offset;
        const midX = x1 + (x2 - x1) / 2;
        
        if (Math.abs(y1 - y2) < 2) {
          d = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          const dir = y2 > y1 ? 1 : -1;
          d = `M ${x1} ${y1} L ${midX - r} ${y1} Q ${midX} ${y1} ${midX} ${y1 + dir * r} L ${midX} ${y2 - dir * r} Q ${midX} ${y2} ${midX + r} ${y2} L ${x2} ${y2}`;
        }
      } else {
        const forkW = 16;
        const yTop = fromPos.y - ROW_OFFSET;
        const yBot = fromPos.y + ROW_OFFSET;
        const yCen = fromPos.y;
        
        const fork = `M ${x1} ${yTop} L ${x1 + forkW - r} ${yTop} Q ${x1 + forkW} ${yTop} ${x1 + forkW} ${yTop + r} L ${x1 + forkW} ${yBot - r} Q ${x1 + forkW} ${yBot} ${x1 + forkW - r} ${yBot} L ${x1} ${yBot}`;
        
        const startX = x1 + forkW;
        const startY = yCen;
        const midX = startX + (x2 - startX) / 2;
        
        let pathRoute = '';
        if (Math.abs(startY - y2) < 2) {
          pathRoute = `M ${startX} ${startY} L ${x2} ${y2}`;
        } else {
          const dir = y2 > startY ? 1 : -1;
          pathRoute = `M ${startX} ${startY} L ${midX - r} ${startY} Q ${midX} ${startY} ${midX} ${startY + dir * r} L ${midX} ${y2 - dir * r} Q ${midX} ${y2} ${midX + r} ${y2} L ${x2} ${y2}`;
        }
        
        d = `${fork} ${pathRoute}`;
      }

      paths.push({ d, isActive, isLoserBracket, delay: rIdx * 0.1 + mIdx * 0.05 });
    }
  }

  return paths;
}

/**
 * Cross-bracket path (e.g. W-Final → Grand Final, L-Final → Grand Final).
 */
function makeCrossBracketPath(
  fromId: string,
  toId: string,
  posMap: Map<string, MatchPosition>,
  isLoserBracket: boolean,
  yOffset: number = 0,
  delay: number = 0.5
): ConnectorPath | null {
  const fromPos = posMap.get(fromId);
  const toPos = posMap.get(toId);
  if (!fromPos || !toPos) return null;

  const fromMatch = fromPos.match;
  const x1 = fromPos.x + MATCH_W;
  const x2 = toPos.x;
  const y2 = toPos.y + yOffset;
  const r = 8;

  const isActive = fromMatch.status === 'COMPLETED' && !!fromMatch.winner_id;

  let d: string;
  if (isActive) {
    let y1Offset = 0;
    if (fromMatch.winner_id === fromMatch.player1?.id) y1Offset = -ROW_OFFSET;
    else if (fromMatch.winner_id === fromMatch.player2?.id) y1Offset = ROW_OFFSET;
    
    const y1 = fromPos.y + y1Offset;
    const midX = x1 + (x2 - x1) / 2;

    if (Math.abs(y1 - y2) < 2) {
      d = `M ${x1} ${y1} L ${x2} ${y2}`;
    } else {
      const dir = y2 > y1 ? 1 : -1;
      d = `M ${x1} ${y1} L ${midX - r} ${y1} Q ${midX} ${y1} ${midX} ${y1 + dir * r} L ${midX} ${y2 - dir * r} Q ${midX} ${y2} ${midX + r} ${y2} L ${x2} ${y2}`;
    }
  } else {
    const forkW = 16;
    const yTop = fromPos.y - ROW_OFFSET;
    const yBot = fromPos.y + ROW_OFFSET;
    const yCen = fromPos.y;
    
    const fork = `M ${x1} ${yTop} L ${x1 + forkW - r} ${yTop} Q ${x1 + forkW} ${yTop} ${x1 + forkW} ${yTop + r} L ${x1 + forkW} ${yBot - r} Q ${x1 + forkW} ${yBot} ${x1 + forkW - r} ${yBot} L ${x1} ${yBot}`;
    
    const startX = x1 + forkW;
    const startY = yCen;
    const midX = startX + (x2 - startX) / 2;
    
    let pathRoute = '';
    if (Math.abs(startY - y2) < 2) {
      pathRoute = `M ${startX} ${startY} L ${x2} ${y2}`;
    } else {
      const dir = y2 > startY ? 1 : -1;
      pathRoute = `M ${startX} ${startY} L ${midX - r} ${startY} Q ${midX} ${startY} ${midX} ${startY + dir * r} L ${midX} ${y2 - dir * r} Q ${midX} ${y2} ${midX + r} ${y2} L ${x2} ${y2}`;
    }
    
    d = `${fork} ${pathRoute}`;
  }

  return { d, isActive, isLoserBracket, delay };
}

/**
 * Loser drop connectors — exit LEFT of the losing team's row, route through
 * the left margin channel and the inter-bracket gap, enter LEFT of target loser match.
 * Each round gets a slightly different margin offset to prevent channel crowding.
 */
function computeLoserDropConnectors(
  winnersRounds: TournamentMatch[][],
  posMap: Map<string, MatchPosition>,
  winnersHeight: number
): ConnectorPath[] {
  const paths: ConnectorPath[] = [];

  for (let rIdx = 0; rIdx < winnersRounds.length; rIdx++) {
    const round = winnersRounds[rIdx];

    for (let mIdx = 0; mIdx < round.length; mIdx++) {
      const match = round[mIdx];
      if (!match.next_match_loser_goes_to) continue;

      const fromPos = posMap.get(match.id);
      const toPos = posMap.get(match.next_match_loser_goes_to);
      if (!fromPos || !toPos) continue;

      // Snap to LOSING team's row (opposite of winner)
      let y1Offset = 0;
      let loserId: string | null = null;
      if (match.status === 'COMPLETED' && match.winner_id) {
        if (match.winner_id === match.player1?.id) {
          y1Offset = ROW_OFFSET; // P2 lost
          loserId = match.player2?.id ?? null;
        } else if (match.winner_id === match.player2?.id) {
          y1Offset = -ROW_OFFSET; // P1 lost
          loserId = match.player1?.id ?? null;
        }
      }

      const x1 = fromPos.x;
      const y1 = fromPos.y + y1Offset;
      const x2 = toPos.x;

      // Route to specific row on target card based on where the loser was slotted
      let y2Offset = 0;
      if (loserId && toPos.match.player1?.id === loserId) {
        y2Offset = -ROW_OFFSET;
      } else if (loserId && toPos.match.player2?.id === loserId) {
        y2Offset = ROW_OFFSET;
      } else {
        // Fallback if not found (or match not completed yet)
        if (fromPos.y < toPos.y - 10) y2Offset = -ROW_OFFSET;
        else if (fromPos.y > toPos.y + 10) y2Offset = ROW_OFFSET;
      }
      
      const y2 = toPos.y + y2Offset;

      const r = 8;
      // Stagger channel per round AND per match to completely avoid overlapping lines
      const marginOffset = 16 + rIdx * 10 + mIdx * 8;
      const outX1 = x1 - marginOffset;
      const outX2 = x2 - marginOffset;
      const gapMidY = START_Y + winnersHeight + SECTION_GAP / 2;

      let d: string;
      if (Math.abs(outX1 - outX2) < 2) {
        // Same column — simple U-shape
        const dirY = y2 > y1 ? 1 : -1;
        d = `M ${x1} ${y1} L ${outX1 + r} ${y1} Q ${outX1} ${y1} ${outX1} ${y1 + dirY * r} L ${outX1} ${y2 - dirY * r} Q ${outX1} ${y2} ${outX1 + r} ${y2} L ${x2} ${y2}`;
      } else {
        // Cross-column — route through the inter-bracket gap
        const dirY1 = gapMidY > y1 ? 1 : -1;
        const dirX = outX2 > outX1 ? 1 : -1;
        const dirY2 = y2 > gapMidY ? 1 : -1;
        d = `M ${x1} ${y1} ` +
            `L ${outX1 + r} ${y1} Q ${outX1} ${y1} ${outX1} ${y1 + dirY1 * r} ` +
            `L ${outX1} ${gapMidY - dirY1 * r} Q ${outX1} ${gapMidY} ${outX1 + dirX * r} ${gapMidY} ` +
            `L ${outX2 - dirX * r} ${gapMidY} Q ${outX2} ${gapMidY} ${outX2} ${gapMidY + dirY2 * r} ` +
            `L ${outX2} ${y2 - dirY2 * r} Q ${outX2} ${y2} ${outX2 + r} ${y2} ` +
            `L ${x2} ${y2}`;
      }

      const isActive = match.status === 'COMPLETED' && !!match.winner_id;
      paths.push({ d, isActive, isLoserBracket: true, isDropPath: true, delay: rIdx * 0.1 + mIdx * 0.05 });
    }
  }

  return paths;
}

interface BracketCanvasProps {
  winnersRounds: TournamentMatch[][];
  losersRounds: TournamentMatch[][];
  grandFinalRounds: TournamentMatch[][];
  teamType?: 'SINGLES' | 'DOUBLES';
  onMatchWin?: (matchId: string, winnerId: string | null) => void;
}

export function BracketCanvas({
  winnersRounds,
  losersRounds,
  grandFinalRounds,
  teamType = 'DOUBLES',
  onMatchWin,
}: BracketCanvasProps) {
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const isSingleElim = losersRounds.length === 0 && grandFinalRounds.length === 0;

  const layout = useMemo(() => {
    const posMap = new Map<string, MatchPosition>();

    const winners = computeRoundPositions(winnersRounds, START_X, START_Y);
    winners.positions.forEach(p => posMap.set(p.match.id, p));

    const losersStartY = START_Y + winners.height + SECTION_GAP;
    const losers = computeRoundPositions(losersRounds, START_X, losersStartY);
    losers.positions.forEach(p => posMap.set(p.match.id, p));

    const maxBracketWidth = Math.max(winners.width, losers.width);
    const gfX = START_X + maxBracketWidth + 40;
    const totalBracketMidY = losersRounds.length > 0
      ? START_Y + (winners.height + SECTION_GAP + losers.height) / 2
      : START_Y + winners.height / 2;

    const gfPositions: MatchPosition[] = [];
    grandFinalRounds.forEach((round, rIdx) => {
      round.forEach((match, mIdx) => {
        const pos: MatchPosition = {
          match,
          x: gfX + rIdx * ROUND_WIDTH,
          y: totalBracketMidY + (mIdx - (round.length - 1) / 2) * BASE_MATCH_SPACING,
        };
        gfPositions.push(pos);
        posMap.set(match.id, pos);
      });
    });

    const wConnectors = computeConnectors(winnersRounds, posMap, false);
    const lConnectors = computeConnectors(losersRounds, posMap, true);
    const gfConnectors = computeConnectors(grandFinalRounds, posMap, false);

    const crossConnectors: ConnectorPath[] = [];
    if (grandFinalRounds.length > 0 && grandFinalRounds[0]?.length > 0) {
      const gfMatch = grandFinalRounds[0][0];
      const wFinal = winnersRounds[winnersRounds.length - 1]?.[0];
      if (wFinal) {
        const conn = makeCrossBracketPath(wFinal.id, gfMatch.id, posMap, false, -ROW_OFFSET, 0.5);
        if (conn) crossConnectors.push(conn);
      }
      const lFinal = losersRounds[losersRounds.length - 1]?.[0];
      if (lFinal) {
        const conn = makeCrossBracketPath(lFinal.id, gfMatch.id, posMap, true, ROW_OFFSET, 0.6);
        if (conn) crossConnectors.push(conn);
      }
    }

    const dropConnectors = computeLoserDropConnectors(winnersRounds, posMap, winners.height);
    const allConnectors = [...wConnectors, ...lConnectors, ...gfConnectors, ...crossConnectors, ...dropConnectors];
    const allPositions = [...winners.positions, ...losers.positions, ...gfPositions];

    const maxX = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.x + MATCH_W)) + 80 : 400;
    const maxY = allPositions.length > 0 ? Math.max(...allPositions.map(p => p.y + MATCH_H / 2)) + 80 : 400;

    return { allPositions, allConnectors, canvasW: maxX, canvasH: maxY, winnersHeight: winners.height, losersStartY, gfPositions };
  }, [winnersRounds, losersRounds, grandFinalRounds]);

  const handleMatchClick = useCallback((match: TournamentMatch) => {
    if (match.player1 && match.player2) setSelectedMatch(match);
  }, []);

  const handleMatchRevert = useCallback((matchId: string) => {
    onMatchWin?.(matchId, null);
  }, [onMatchWin]);

  const handleConfirmWinner = (matchId: string, winnerId: string | null) => {
    onMatchWin?.(matchId, winnerId);
    setSelectedMatch(null);
  };

  // Champion detection — works for single and double elim
  const champion = useMemo(() => {
    if (isSingleElim && winnersRounds.length > 0) {
      const lastRound = winnersRounds[winnersRounds.length - 1];
      const lastMatch = lastRound?.[lastRound.length - 1];
      if (lastMatch?.status === 'COMPLETED' && lastMatch.winner_id) {
        return lastMatch.player1?.id === lastMatch.winner_id ? lastMatch.player1 : lastMatch.player2;
      }
      return null;
    }
    if (grandFinalRounds.length === 0) return null;
    const lastRound = grandFinalRounds[grandFinalRounds.length - 1];
    const lastMatch = lastRound?.[lastRound.length - 1];
    if (lastMatch?.status === 'COMPLETED' && lastMatch.winner_id) {
      return lastMatch.player1?.id === lastMatch.winner_id ? lastMatch.player1 : lastMatch.player2;
    }
    return null;
  }, [grandFinalRounds, winnersRounds, isSingleElim]);

  const championPos = useMemo(() => {
    if (isSingleElim && winnersRounds.length > 0) {
      const lastRound = winnersRounds[winnersRounds.length - 1];
      const lastMatch = lastRound?.[lastRound.length - 1];
      const pos = layout.allPositions.find(p => p.match.id === lastMatch?.id);
      if (pos) return { left: pos.x + MATCH_W / 2 - 90, top: pos.y + MATCH_H / 2 + 16 };
    }
    if (layout.gfPositions.length > 0) {
      const last = layout.gfPositions[layout.gfPositions.length - 1];
      return { left: last.x + MATCH_W / 2 - 90, top: last.y + MATCH_H / 2 + 16 };
    }
    return null;
  }, [layout, winnersRounds, isSingleElim]);

  return (
    <>
      <div className="relative" style={{ width: layout.canvasW, height: layout.canvasH }}>

        {/* Section Labels */}
        {losersRounds.length > 0 && (
          <>
            <div className="absolute text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase select-none"
              style={{ left: START_X, top: START_Y - 65 }}>
              Winners Bracket
            </div>
            <div className="absolute text-[11px] font-black text-red-400/70 tracking-[0.2em] uppercase select-none"
              style={{ left: START_X, top: layout.losersStartY - 65 }}>
              Losers Bracket
            </div>
          </>
        )}

        {/* Column Round Headers — Winners */}
        {winnersRounds.map((round, rIdx) => (
          <div
            key={`wh-${rIdx}`}
            className="absolute text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none text-center pointer-events-none"
            style={{ left: START_X + rIdx * ROUND_WIDTH, width: MATCH_W, top: START_Y - 22 }}
          >
            {round[0]?.round ?? `Round ${rIdx + 1}`}
          </div>
        ))}

        {/* Column Round Headers — Losers */}
        {losersRounds.map((round, rIdx) => (
          <div
            key={`lh-${rIdx}`}
            className="absolute text-[10px] font-bold text-red-400/50 uppercase tracking-widest select-none text-center pointer-events-none"
            style={{ left: START_X + rIdx * ROUND_WIDTH, width: MATCH_W, top: layout.losersStartY - 22 }}
          >
            {round[0]?.round ?? `L-Round ${rIdx + 1}`}
          </div>
        ))}

        {/* SVG Lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={layout.canvasW}
          height={layout.canvasH}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="glow-green">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {layout.allConnectors.map((conn, i) => (
            <ConnectorSVGPath key={i} {...conn} />
          ))}
        </svg>

        {/* Match Nodes */}
        {layout.allPositions.map((pos, i) => (
          <div
            key={pos.match.id}
            className="absolute"
            style={{ left: pos.x, top: pos.y - MATCH_H / 2 }}
          >
            <MatchNode
              match={pos.match}
              teamType={teamType}
              onClick={handleMatchClick}
              onRevert={handleMatchRevert}
              animationDelay={i * 0.03}
              showRoundLabel={false}
            />
          </div>
        ))}

        {/* Champion Badge */}
        {champion && championPos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="absolute"
            style={championPos}
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full shadow-[0_0_24px_rgba(245,158,11,0.2)]">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-black text-amber-500 tracking-widest uppercase whitespace-nowrap">
                CHAMPION: {champion.name}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <WinnerModal
        match={selectedMatch}
        teamType={teamType}
        onConfirm={handleConfirmWinner}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}

function ConnectorSVGPath({ d, isActive, isLoserBracket, delay, isDropPath }: ConnectorPath) {
  const { theme } = useTheme();
  const isLight = theme !== 'dark';

  // Hide drop paths until the match is completed and the loser is known
  if (isDropPath && !isActive) return null;

  const activeColor = isLoserBracket 
    ? (isLight ? '#DC2626' : '#EF4444') 
    : (isLight ? '#16A34A' : '#32D74B'); 
  const inactiveColor = isLight ? '#E2E8F0' : '#334155';

  return (
    <>
      {/* Background Track (Inactive) */}
      {!isDropPath && (
        <path
          d={d}
          fill="none"
          stroke={inactiveColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={isLight ? 0.8 : 0.3}
        />
      )}
      
      {/* Animated Foreground Track (Active) */}
      {isActive && (
        <motion.path
          d={d}
          fill="none"
          stroke={activeColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={isDropPath ? '6 5' : undefined}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: isDropPath ? 0.9 : 1 }}
          transition={{ 
            delay: 0.3 + delay, 
            duration: 0.65, 
            ease: [0.23, 1, 0.32, 1] 
          }}
          style={{ filter: isLight ? `drop-shadow(0px 2px 4px rgba(${isLoserBracket ? '220,38,38' : '22,163,74'}, 0.4))` : `url(#glow-${isLoserBracket ? 'red' : 'green'})` }}
        />
      )}
    </>
  );
}
