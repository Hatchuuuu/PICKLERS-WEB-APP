# Graph Report - graphify-out  (2026-08-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 706 nodes · 1309 edges · 69 communities (46 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d074175`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useTournamentStore.ts
- AppContext.tsx
- useAuth
- dependencies
- cn
- FeedTab.tsx
- page.tsx
- compilerOptions
- PICKLERS — Full-Stack UI Implementation Plan
- providers.tsx
- devDependencies
- page.tsx
- redis.ts
- package.json
- scripts
- ResizeObserver
- route.ts
- Draggable Marquee Design
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- ATTRIBUTIONS
- Guidelines
- pnpm-workspace
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- CommunityNav.tsx
- middleware.ts
- tsc-results
- next.config.ts
- next-env.d.ts
- README
- FacilityCard
- PICKLERS OFFICIAL LOGO
- PREND PICKLERS CHATBOT LOGO
- head
- honolulu
- pelago
- favicon
- gcash
- prend-chatbot-logo

## God Nodes (most connected - your core abstractions)
1. `cn()` - 61 edges
2. `useAuth()` - 51 edges
3. `supabase` - 22 edges
4. `useApp()` - 21 edges
5. `compilerOptions` - 21 edges
6. `useTournamentStore` - 19 edges
7. `useToast()` - 17 edges
8. `Match` - 13 edges
9. `Facility` - 11 edges
10. `Team` - 9 edges

## Surprising Connections (you probably didn't know these)
- `CreatePostModal()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/community/FeedTab.tsx → src/contexts/AuthContext.tsx
- `TeamRow()` --calls--> `cn()`  [EXTRACTED]
  src/components/tournament/MatchNode.tsx → src/lib/utils.ts
- `OwnerLayout()` --calls--> `cn()`  [EXTRACTED]
  src/app/(owner)/app/owner/layout.tsx → src/lib/utils.ts
- `OwnerLayout()` --calls--> `useTournamentStore`  [EXTRACTED]
  src/app/(owner)/app/owner/layout.tsx → src/store/useTournamentStore.ts
- `OwnerDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(owner)/app/owner/page.tsx → src/contexts/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (69 total, 23 thin omitted)

### Community 0 - "useTournamentStore.ts"
Cohesion: 0.05
Nodes (67): Format, OwnerBracket(), ErrorBoundary, Props, State, ManageTeamsModal(), SearchProfile, MatchNode() (+59 more)

### Community 1 - "AppContext.tsx"
Cohesion: 0.06
Nodes (52): BookingsTab(), ExploreTab(), FacilityDetailView(), FacilityDetailViewProps, PlayTab(), PaymentView(), QuickBookModal(), brands (+44 more)

### Community 2 - "useAuth"
Cohesion: 0.05
Nodes (43): AuthContent(), OWNER_TABS, OwnerLayout(), OwnerTab, OwnerTabId, AppShellInner(), PLAYER_TABS, PlayerTab (+35 more)

### Community 3 - "dependencies"
Cohesion: 0.03
Nodes (70): dependencies, canvas-confetti, class-variance-authority, clsx, cmdk, date-fns, embla-carousel-auto-scroll, embla-carousel-react (+62 more)

### Community 4 - "cn"
Cohesion: 0.07
Nodes (44): OwnerCourts(), OwnerSettings(), OwnerStaff(), OwnerTournaments(), ApplicationForm, applicationSchema, OwnerApplication(), PremiumSelect() (+36 more)

### Community 5 - "FeedTab.tsx"
Cohesion: 0.07
Nodes (26): ChatPartner, InboxConversation, Tab, ChatPanel(), formatTime(), getDateLabel(), CommunityTab(), CreatePostModal() (+18 more)

### Community 6 - "page.tsx"
Cohesion: 0.11
Nodes (17): PlayerSettingsTab(), DeleteAccountModal(), DeleteAccountModalProps, EditFieldModal(), EditFieldModalProps, EmailUpdateModal(), EmailUpdateModalProps, LogoutConfirmModal() (+9 more)

### Community 7 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+16 more)

### Community 8 - "PICKLERS — Full-Stack UI Implementation Plan"
Cohesion: 0.09
Nodes (23): PICKLERS — Full-Stack UI Implementation Plan, App.tsx, BottomTabBar, FacilityToggleSection, HeroSection, LandingLayout, Layout Components, MatchCard (+15 more)

### Community 9 - "providers.tsx"
Cohesion: 0.12
Nodes (15): inter, metadata, montserrat, Providers(), InitUserStore(), LockedFeatureWrapper(), LockedFeatureWrapperProps, VerificationGateModal() (+7 more)

### Community 10 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, eslint-config-next, @eslint/js, eslint-plugin-unused-imports, happy-dom, jsdom, tailwindcss (+12 more)

### Community 11 - "page.tsx"
Cohesion: 0.23
Nodes (12): OwnerDashboard(), useBookCourt(), useBookingRequests(), useLiveCourts(), useResolveRequest(), useUpdateCourt(), DEMO_BOOKING_REQUESTS, DEMO_LIVE_COURTS (+4 more)

### Community 12 - "redis.ts"
Cohesion: 0.27
Nodes (3): CheckoutPayloadSchema, POST(), redis

### Community 13 - "package.json"
Cohesion: 0.20
Nodes (9): name, peerDependenciesMeta, react, react-dom, private, optional, optional, type (+1 more)

### Community 14 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, start, test, test:coverage, test:watch

### Community 15 - "ResizeObserver"
Cohesion: 0.29
Nodes (3): localStorageMock, ResizeObserver, sessionStorageMock

### Community 17 - "Draggable Marquee Design"
Cohesion: 0.50
Nodes (4): Draggable Marquee Design, DraggableMarquee.tsx, Framer Motion, LandingPage.tsx

### Community 18 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), makeSupabase(), PATCH()

### Community 19 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), makeSupabase(), POST()

### Community 20 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), makeSupabase(), POST()

### Community 21 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), makeSupabase(), POST()

### Community 22 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), makeSupabase(), POST()

### Community 23 - "ATTRIBUTIONS"
Cohesion: 0.67
Nodes (3): ATTRIBUTIONS, shadcn/ui, Unsplash

### Community 24 - "Guidelines"
Cohesion: 0.67
Nodes (3): Guidelines, Button Component, Design System Guidelines

### Community 25 - "pnpm-workspace"
Cohesion: 0.67
Nodes (3): pnpm-workspace, packages, supportedArchitectures

### Community 36 - "tsc-results"
Cohesion: 0.67
Nodes (3): tsc-results, routes.d.ts, validator.ts

## Knowledge Gaps
- **252 isolated node(s):** `nextConfig`, `name`, `private`, `version`, `type` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `useTournamentStore.ts`, `AppContext.tsx`, `useAuth`, `page.tsx`, `page.tsx`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `AppContext.tsx`, `cn`, `FeedTab.tsx`, `page.tsx`, `providers.tsx`, `page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `supabase` connect `AppContext.tsx` to `useTournamentStore.ts`, `useAuth`, `FeedTab.tsx`, `page.tsx`, `providers.tsx`, `page.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `NOTE: This file should not be edited`, `nextConfig`, `name` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTournamentStore.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0546984572230014 - nodes in this community are weakly interconnected._
- **Should `AppContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059940059940059943 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.053208137715179966 - nodes in this community are weakly interconnected._