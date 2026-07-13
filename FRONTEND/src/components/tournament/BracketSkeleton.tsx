import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// Using identical dimensions from BracketCanvas
const MATCH_W = 260;
const MATCH_H = 107;
const COLUMN_GAP = 100;
const ROUND_WIDTH = MATCH_W + COLUMN_GAP;
const BASE_MATCH_SPACING = 130;
const START_X = 80;
const START_Y = 80;

// Hardcode an 8-team single-elimination structure for the skeleton
const SKELETON_ROUNDS = [
  [0, 1, 2, 3], // Quarterfinals
  [0, 1],       // Semifinals
  [0]           // Grand Final
];

export function BracketSkeleton() {
  const canvasW = START_X + 3 * ROUND_WIDTH + 100;
  const canvasH = START_Y + 4 * BASE_MATCH_SPACING + 100;

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0F172A]">
      <div 
        className="relative" 
        style={{ width: canvasW, height: canvasH, transform: 'scale(0.85)' }}
      >
        {/* Skeleton SVG Connectors */}
        <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH} style={{ overflow: 'visible' }}>
          {SKELETON_ROUNDS.map((round, rIdx) => {
            if (rIdx === SKELETON_ROUNDS.length - 1) return null; // No next round
            
            const nextRound = SKELETON_ROUNDS[rIdx + 1];
            const sliceH = (4 * BASE_MATCH_SPACING) / round.length;
            const nextSliceH = (4 * BASE_MATCH_SPACING) / nextRound.length;

            return round.map((mIdx) => {
              const fromX = START_X + rIdx * ROUND_WIDTH + MATCH_W;
              const fromY = START_Y + sliceH * mIdx + sliceH / 2;
              
              const targetMIdx = Math.floor(mIdx / 2);
              const toX = START_X + (rIdx + 1) * ROUND_WIDTH;
              const toY = START_Y + nextSliceH * targetMIdx + nextSliceH / 2;
              
              const midX = fromX + (toX - fromX) / 2;
              const r = 8;
              const dir = toY > fromY ? 1 : -1;
              
              let d = '';
              if (Math.abs(fromY - toY) < 2) {
                d = `M ${fromX} ${fromY} L ${toX} ${toY}`;
              } else {
                d = `M ${fromX} ${fromY} L ${midX - r} ${fromY} Q ${midX} ${fromY} ${midX} ${fromY + dir * r} L ${midX} ${toY - dir * r} Q ${midX} ${toY} ${midX + r} ${toY} L ${toX} ${toY}`;
              }

              return (
                <path
                  key={`path-${rIdx}-${mIdx}`}
                  d={d}
                  fill="none"
                  stroke="#334155"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="opacity-40"
                />
              );
            });
          })}
        </svg>

        {/* Skeleton Nodes */}
        {SKELETON_ROUNDS.map((round, rIdx) => {
          const sliceH = (4 * BASE_MATCH_SPACING) / round.length;
          
          return round.map((mIdx) => {
            const x = START_X + rIdx * ROUND_WIDTH;
            const y = START_Y + sliceH * mIdx + sliceH / 2 - MATCH_H / 2;

            return (
              <motion.div
                key={`node-${rIdx}-${mIdx}`}
                className="absolute"
                style={{ left: x, top: y, width: MATCH_W, height: MATCH_H }}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: rIdx * 0.2 + mIdx * 0.1 
                }}
              >
                <div className="w-full h-full rounded-xl border border-border/50 bg-surface-base/50 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center gap-3 px-3 py-3 h-1/2 border-b border-slate-700/20">
                    <div className="w-6 h-6 rounded-full bg-slate-700/40 shrink-0" />
                    <div className="h-2.5 w-24 bg-slate-700/40 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3 px-3 py-3 h-1/2">
                    <div className="w-6 h-6 rounded-full bg-slate-700/40 shrink-0" />
                    <div className="h-2.5 w-16 bg-slate-700/40 rounded-full" />
                  </div>
                </div>
              </motion.div>
            );
          });
        })}
      </div>
    </div>
  );
}
