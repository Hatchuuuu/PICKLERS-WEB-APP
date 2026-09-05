# PICKLERS — Master Audit & Implementation Plan
**Owner:** Fable 5 (main planner)
**Date:** 2026-08-30
**Scope:** Full web application (player + owner + admin + developer surfaces)
**Priority model:** P0 critical → P1 high → P2 medium → P3 polish

---

## 1. STACK FACTS (verified)
- Next.js 16.2 App Router, React 18, TypeScript 5.6
- Tailwind 4 + `tw-animate-css`, Radix primitives, sonner, framer-motion (`motion`), GSAP
- Supabase (Postgres + RLS + Auth + Storage + Realtime)
- PayMongo (webhook with HMAC + replay + idempotency), Resend, Upstash Redis, Sentry
- Capacitor 8 (Android + iOS shells)
- Maps: Mapbox primary, Leaflet alt; Google Maps loader present
- Vitest + Testing Library for unit tests
- Fonts: Inter, Montserrat, Outfit, Plus_Jakarta_Sans

## 2. KNOWN HOTSPOTS (from discovery)
| # | File | LOC | Why |
|---|---|---|---|
| 1 | `app/page.tsx` | 1193 | Landing — must be premium |
| 2 | `components/modals/PaymentView.tsx` | 1040 | Payment UX + correctness |
| 3 | `(owner)/owner/settings/page.tsx` | 914 | Dense settings UI |
| 4 | `(owner)/owner/courts/page.tsx` | 726 | Court management |
| 5 | `owner/CreateTournamentModal.tsx` | 722 | Multi-step form |
| 6 | `owner/CreateOpenPlayModal.tsx` | 693 | Multi-step form |
| 7 | `(player)/settings/page.tsx` | 655 | User-facing settings |
| 8 | `(player)/owner-application/page.tsx` | 628 | Onboarding flow |
| 9 | `(developer)/dev/flags/page.tsx` | 622 | Dev tool |
| 10 | `(developer)/dev/accounts/page.tsx` | 620 | Dev tool |
| 11 | `modals/CourtPassScannerModal.tsx` | 618 | QR scanner UX |
| 12 | `(owner)/owner/page.tsx` | 617 | Owner dashboard |
| 13 | `shared/FacilityDetailView.tsx` | 601 | Player-facing detail |
| 14 | `modals/CourtScheduleModal.tsx` | 597 | Schedule editor |
| 15 | `tournament/BracketCanvas.tsx` | 596 | Bracket rendering |
| 16 | `auth/page.tsx` | 579 | Login/register |

## 3. WORK STREAMS (parallelized)

### Stream A — Public + Auth + Onboarding (UI first)
**Areas:** `app/page.tsx`, `app/auth/page.tsx`, `auth/callback`, `app/(player)/owner-application`, middleware UX
**Audit focus:** hero, sections, motion, dark/light, responsive, auth form quality, redirect handling
**Owner:** Stream A agent

### Stream B — Player App
**Areas:** `(player)/app/{page,explore,bookings,community,wallet,tournaments,settings}`, `facility/[id]`
**Audit focus:** shell consistency, map perf, wallet flows, tournament UX, settings modals
**Owner:** Stream B agent

### Stream C — Owner App
**Areas:** `(owner)/app/owner/*`, `CreateTournamentModal`, `CreateOpenPlayModal`, `OwnerBracket`, `CourtScheduleModal`, `CourtPassScannerModal`, `FacilityDetailView`
**Audit focus:** dashboard cards, modals, table states, large form wizard UX
**Owner:** Stream C agent

### Stream D — Admin Console
**Areas:** `(admin)/app/admin/*` (dashboard, users, applications, facilities, bookings, finance, moderation, promotions, analytics, audit-log, settings)
**Audit focus:** admin tables, bulk actions, filters, drawer UX, role-gated UI
**Owner:** Stream D agent

### Stream E — Developer Console
**Areas:** `(developer)/app/dev/*` (logs, errors, flags, accounts, audits, threats, environments, entity-inspector, api-explorer, webhooks, health)
**Audit focus:** dev tools density, debugging ergonomics, dangerous-operation guards
**Owner:** Stream E agent

### Stream F — API + Backend
**Areas:** all 79 `api/**/route.ts` files, rate limit, cache, webhooks, chat, payments, bookings, admin/dev endpoints
**Audit focus:** authz, validation (Zod), error contracts, idempotency, N+1, sensitive data
**Owner:** Stream F agent

### Stream G — Database + Migrations + Security
**Areas:** 45 SQL migrations, RLS policies, indexes, RPC functions, storage buckets
**Audit focus:** RLS correctness, missing policies, migration ordering, FK indexes, secret handling
**Owner:** Stream G agent

### Stream H — Performance + Code Quality
**Areas:** heavy components, bundle bloat, `any` types, console.* left in, dead code, large file splits
**Audit focus:** memoization, dynamic imports, dead code, refactor targets
**Owner:** Stream H agent

## 4. PRIORITY LADDER
- **P0 (block release):** auth bypass, payment integrity, data loss, RLS gaps, N+1 perf crashes
- **P1 (ship-blocker):** broken core flows (booking, wallet, tournament), major UI/UX defects, a11y P0
- **P2 (should fix):** polish, consistency, design system drift, code quality, large file splits
- **P3 (nice):** minor visual touches

## 5. VERIFICATION STANDARD
- Each finding: ISSUE / LOCATION / ROOT CAUSE / IMPACT / SEVERITY / SOLUTION / AFFECTED AREAS / VERIFICATION / REGRESSION RISK
- UI fixes: confirmed in both light + dark, ≥3 breakpoints (mobile/tablet/desktop)
- API fixes: confirmed with 200/4xx/5xx contract tests; authz boundary verified
- DB fixes: migration applied to fresh DB + reviewed for downgrade safety
- "Build passes" is not verification. "Page renders" is not verification. "Agent says done" is not verification.

## 6. STATE TRACKING
- A running `audit_findings.md` will be appended as streams complete
- Streams A–H can run in parallel after discovery (DONE)
- Independent reviewer (Stream R) validates each stream's findings
- Final "what did we miss" pass re-scans with fresh eyes

## 7. RISKS
- Upstream rate limits (429) on sub-agents → fallback to direct Glob/Grep is the safety net
- Migration files older than `2026-08-13` may conflict with the unified account state model
- Capacitor (mobile) shells are out of scope unless explicitly requested
- Honeypot middleware can interfere with automated testing — do not probe in audit
