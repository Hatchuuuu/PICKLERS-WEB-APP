# Tournament Bracket System Overhaul — Design Spec

## Goal
Completely rebuild the Owner/Admin Tournament Bracket UI into a production-grade, bug-free, visually stunning interactive bracket system. Keep the existing generation algorithms (with bug fixes). Rebuild the entire rendering and interaction layer.

## Decisions Made

| Decision | Choice |
|---|---|
| Scope | Rebuild UI completely, fix algorithm bugs, keep generation approach |
| Winner selection | Centered confirmation modal with team-side-by-side layout |
| Mock data | Realistic pickleball team names + generated avatar images |
| Connecting lines | SVG-based with strokeDasharray "draw" animation (green winners, red losers) |
| Default state | Dynamic based on owner input; dev dropdowns kept for testing |
| BYE slots | Visually distinct — dashed border, muted "BYE" text, auto-advance animation |
| Color palette | Keep existing dark theme (#0F172A base) |
| Team type | Doubles (2 overlapping avatars) or Singles (1 avatar) |

## Architecture

### Keep (with fixes)
- `bracket-generator.ts` — Single/Double/RoundRobin generation
- `bracket-state.ts` — `processMatchResult()` + `propagateByes()`
- `bracket-mapper.ts` — Match[] → TournamentMatch[][] tree mapper
- `types.ts` — Core data types

### Rebuild (from scratch)
- `TournamentBracket.tsx` → Split into focused components
- `OwnerBracket.tsx` → Simplified page shell
- All connecting line rendering
- Match node rendering
- Winner selection interaction

## Component Decomposition

| Component | File | Responsibility |
|---|---|---|
| OwnerBracket | `pages/owner/OwnerBracket.tsx` | Page shell — header, dev controls, zoom, format routing |
| BracketCanvas | `components/tournament/BracketCanvas.tsx` | SVG-based bracket layout — positions match nodes + draws connector paths |
| MatchNode | `components/tournament/MatchNode.tsx` | Single match card — two team rows, avatars, BYE/TBD/completed states |
| PlayerAvatar | `components/tournament/PlayerAvatar.tsx` | Avatar circles — 1 for singles, 2 overlapping for doubles |
| ConnectorLine | `components/tournament/ConnectorLine.tsx` | Single SVG path with animated stroke draw |
| WinnerModal | `components/tournament/WinnerModal.tsx` | Confirmation modal — pick winner + confirm |
| RoundRobinView | `components/tournament/RoundRobinView.tsx` | Keep/polish existing table view |

## Match Node Visual States

- **Pending (both teams known)**: solid border, both teams shown, clickable with hover glow
- **Pending (TBD)**: solid border, italic "TBD" for unknown slots, not clickable
- **BYE**: dashed border, muted "BYE" text, auto-advanced team shown
- **Completed**: winner row has green accent + glow, loser row dimmed/grayscale
- **Cancelled**: fully muted, crossed out

## SVG Connector Lines

- Right-angle paths with small rounded corners (rx=6)
- Default: `stroke: #334155` (slate-700)
- Winner advancing: animated green `#32D74B` stroke draw
- Loser bracket advancing: animated red `#EF4444` stroke draw
- Animation: strokeDasharray/strokeDashoffset CSS transition, ~400ms ease-out

## Winner Selection Modal

- Backdrop: black 60% opacity + backdrop-blur-sm
- Card: slate-900 bg, rounded-2xl, max-w-md centered
- Header: "Select Winner" title
- Body: two team cards side-by-side, click to select (green border highlight)
- Footer: "Confirm Winner" button (disabled until selection), "Cancel" button
- On confirm: dispatch processMatchResult, close modal, trigger line animation

## Algorithm Bug Fixes Required

1. Loser Bracket halving: fix `r % 2` condition (even rounds halve, not odd)
2. Cross-seeding `targetL` bounds: add safety check for array access
3. `propagateByes` infinite loop: keep the iteration guard (already done)
4. `Math.max(...[])` crash: keep the empty-array guards (already done)

## Mock Data

8 pickleball team names for doubles mode:
- Dink Dynasty, Net Ninjas, The Pickled Ones, Kitchen Krusaders
- Smash Bros, Rally Rebels, Drop Shot Legends, Paddle Pioneers

Each team gets two player names for doubles display.
