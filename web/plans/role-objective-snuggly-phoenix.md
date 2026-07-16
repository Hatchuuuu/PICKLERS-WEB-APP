# PICKLERS — Full-Stack UI Implementation Plan

## Context
Build a production-quality, multi-screen React SPA for **PICKLERS**, a Philippine pickleball court booking platform. The reference images show a premium dark-navy glassmorphism UI across 8+ screens: landing, player dashboard (PLAY/EXPLORE/BOOKINGS/COMMUNITY/SETTINGS), and owner dashboard (live ops, courts, tournaments, staff, settings). The master plan specifies the exact UX flow, component requirements, and data model. All screens are built with mock data (Sprint 1-2 scope) with full motion and visual polish per Emil Kowalski / impeccable / shadcn standards.

---

## Aesthetic Direction

### Stance
**Heavily-colored dark canvas + data-dense sports-tech.** Full commitment to a midnight-navy ground with vibrant cyan/green accents. Not a generic SaaS dark mode — the saturated color field is the identity.

### Palette (theme.css overrides)
- `--background`: `#080f2e` (deep midnight navy, tinted blue — not pure black)
- `--foreground`: `#f0f4ff` (slightly blue-tinted white)
- `--card`: `#0f1d47` (surface blue, ~8% lighter than background)
- `--card-foreground`: `#e8eeff`
- `--primary`: `#00d4ff` (cyan — main interactive/accent)
- `--primary-foreground`: `#080f2e`
- `--secondary`: `#1a2d6e` (muted navy surface)
- `--secondary-foreground`: `#a0b4e0`
- `--muted`: `#131f52`
- `--muted-foreground`: `#6b82b8`
- `--accent`: `#22c55e` (green — CTAs like "Book a Court")
- `--accent-foreground`: `#ffffff`
- `--destructive`: `#ef4444`
- `--border`: `rgba(0, 212, 255, 0.12)` (faint cyan hairline)
- `--ring`: `rgba(0, 212, 255, 0.4)`
- `--radius`: `0.75rem`

### Typography (`fonts.css`)
- **Display / Hero**: `Rajdhani` (700/900) — athletic, bold, premium. Used for "PICKLERS" wordmark and section headings.
- **Body / UI**: `Outfit` (300/400/500/600) — geometric, modern, highly legible. Used for all UI copy.
- **Mono / Data**: `DM Mono` (400) — stats, timestamps, court IDs.

Google Fonts import: `Rajdhani:wght@400;600;700`, `Outfit:wght@300;400;500;600`, `DM+Mono:wght@400`.

---

## App Architecture

### View State (no react-router needed)
A top-level `view` state drives which screen renders. Transitions use `motion` from `motion/react` with `AnimatePresence`-equivalent fade+slide.

```
type View =
  | "landing"
  | "auth"
  | "player-play"
  | "player-explore"
  | "player-bookings"
  | "player-community"
  | "player-settings"
  | "owner-dashboard"
  | "owner-courts"
  | "owner-tournaments"
  | "owner-staff"
  | "owner-settings"
```

### Layout Components
1. **`<LandingLayout>`** — full-bleed, no sidebar
2. **`<PlayerShell>`** — top navbar + bottom tab bar (mobile) / sidebar (desktop)
3. **`<OwnerShell>`** — sidebar nav (Dashboard, My Courts, Tournaments, Staff, Settings)

---

## Screen-by-Screen Plan

### Screen 1: Landing Page
**Reference**: Image 2 (hero) + Image 3 (facilities toggle)

- **Hero**: Full-bleed dark navy. "PICKLERS" in Rajdhani 700, 96px, white with cyan text-shadow glow. Tagline "FIND. BOOK. PLAY." with letter-spacing. Two CTAs: `[ BOOK A COURT ]` (green, filled) and `[ JOIN OPEN PLAY ]` (cyan, outline). "Are you a Court Owner? List your Court →" ghost link below.
- **Sticky Navbar**: Logo (PICKLERS wordmark), nav links (Features, Venues, Players), `[ Log In ]` ghost + `[ Sign Up ]` cyan pill.
- **Stats Bar**: 4 animated count-up numbers: 142 Venues, 12,450 Active Players, 5-10% Service Fee, 200 Registrations/day.
- **Feature Toggle Section**: "Play Pickleball, Anywhere." heading. Spring-animated pill toggle `[ PICKLE FACILITIES ] / [ OPEN PLAY ]`. Below it: AnimatePresence-driven grid swap between facility cards and open-play match cards.
- **Facility Cards**: Hero image (Unsplash pickleball/sports courts), `Indoor/Outdoor` badge, star rating, distance, operating hours, `₱400/hr` + `[ View Courts ]` button.
- **Footer**: Simple dark with logo + links.

### Screen 2: Auth Modal/Page
**Reference**: Wireframe from plan §2.2

- Full-screen overlay on dark navy.
- Sliding underline tab: `[ Sign in ]` / `[ Create account ]`.
- Full Name field (hidden on Sign In), Email input with OTP toggle, `[ Send code ]` button.
- "or continue with" divider, `[ Google ]` / `[ Facebook ]` OAuth buttons.
- On submit → navigate to player dashboard.

### Screen 3: Player Dashboard — PLAY Tab
**Reference**: Images 3, 4 (Discover Courts)

- **Shell**: Left sidebar (desktop) with PICKLERS logo, nav icons + labels: Play, Explore, Bookings, Community, Settings. Bottom: user avatar + notification bell. On mobile: bottom tab bar.
- **Header**: "DISCOVER COURTS" title + subtitle. Location pill + search bar.
- **Facility Cards Grid**: 3-col desktop, 2-col tablet, 1-col mobile. Each card:
  - Image with `[ ♡ ]` floating favorite button (spring animation)
  - `Indoor` / `Outdoor` badge overlay
  - `★ 4.8` rating + location name
  - Distance row with 🏍 / 🚗 icons
  - Operating hours
  - Bottom: `₱400/hr` + `[ View Courts ]` button

### Screen 4: Player Dashboard — EXPLORE Tab
**Reference**: Image 5 (Open Play / Bookings view)

- **Header**: "OPEN PLAY — join a match, split the cost"
- **Match Cards**: Color-coded level badge (green=Beginner, yellow=Intermediate, red=Advanced). Circular capacity ring (e.g., 5/8). Facility name, date, time. `[ Join Match ]` CTA.

### Screen 5: Player Dashboard — BOOKINGS Tab
**Reference**: Image 6 (My Bookings)

- **5 Sub-tabs**: Upcoming / Completed / Refunds / Cancelled / Wallet Balance.
- **Booking Row**: Court name + facility, date/time, payment status chip, `[ Cancel ]` ghost button.
- **Wallet Balance Tab**: Balance card showing ₱1,200 Pickle Credits. Transaction history list.

### Screen 6: Owner Dashboard — Live Operations
**Reference**: Images 7, 10 (Facility Dashboard with alert state)

- **Analytics Header**: 5 metric cards in a row: Monthly Revenue `₱48,200`, Today's Revenue `₱3,200`, Active Bookings `12`, New Players `8`, Repeaters `45%`.
- **Live Courts Grid**: Visual grid of court cards (Court 1–6). Each shows:
  - Status chip: `OCCUPIED` (cyan) / `AVAILABLE` (green) / `MAINTENANCE` (gray)
  - Session countdown timer (e.g., `45:12 remaining`)
  - Player name
  - `[ Skip/End ]` button
  - When timer hits 0:00 → border pulses red (CSS animation `pulse`)
- **Booking Requests Queue**: List of pending bookings with `[ Accept ]` / `[ Decline ]` actions.
- **Floating `[ + Log Walk-in ]` button** (bottom-right FAB, green).

### Screen 7: Owner Dashboard — Tournaments
**Reference**: Image 8

- **3 Tabs**: Active / Upcoming / Completed
- **Tournament Cards**: Name, format (Round Robin / Single Elimination), date, registered teams count, bracket visualization.
- `[ Create Tournament ]` button top-right.

### Screen 8: Owner Dashboard — Settings
**Reference**: Image 9

- Operating Hours section with `[ Open 24 Hours ]` toggle → accordion reveals time pickers when off.
- GCash Setup UI: toggle + payout number input + `[ Send Code ]` → OTP verification.
- Profile branding: facility name, logo upload zone, location.

---

## Component Architecture (all inline in App.tsx)

```
App
├── LandingPage
│   ├── Navbar
│   ├── HeroSection
│   ├── StatsBar
│   └── FacilityToggleSection (with FacilityCard / MatchCard)
├── AuthPage
├── PlayerShell
│   ├── Sidebar (desktop) / BottomTabBar (mobile)
│   ├── PlayTab
│   ├── ExploreTab
│   ├── BookingsTab
│   ├── CommunityTab (placeholder)
│   └── SettingsTab (placeholder)
└── OwnerShell
    ├── OwnerSidebar
    ├── OwnerDashboard (live courts + analytics + requests)
    ├── OwnerTournaments
    └── OwnerSettings
```

All components are defined in `src/app/App.tsx` as named function components. No auxiliary files.

---

## Motion Strategy (Emil Kowalski standards)

| Element | Animation | Easing / Duration |
|---|---|---|
| Page transitions | `opacity: 0→1, y: 8→0` | `ease-out 200ms` |
| Facility/Match card grid swap | `opacity + scale(0.97→1)` | `ease-out 250ms` staggered |
| Toggle switch | Spring physics `stiffness:400, damping:30` | motion spring |
| Court timer hitting 0 | Border `pulse` CSS animation | `1s infinite` |
| Favorite heart | `scale(0→1.2→1)` spring | `stiffness:500, damping:20` |
| Count-up stats | Numeric interpolation on mount | 1.2s ease-out |
| Button `:active` | `scale(0.97)` | `100ms ease-out` |

**No** `ease-in` on any UI animation. All entering elements use `ease-out`.

---

## Shadcn / Accessibility Standards

- All interactive elements have `focus-visible` ring (cyan `ring-2 ring-ring`)
- Color is never the sole state indicator (status chips use icon + text + color)
- Touch targets minimum 44×44px on mobile
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<button>`
- ARIA labels on icon-only buttons

---

## Files to Write

1. **`src/styles/fonts.css`** — Google Fonts imports (Rajdhani, Outfit, DM Mono)
2. **`src/styles/theme.css`** — Update token values (preserve `@theme inline` contract)
3. **`src/app/App.tsx`** — Complete multi-screen application (~800-1000 lines)

---

## Mock Data

All data is hardcoded realistic Philippine content:
- Facilities: "SM Southmall Picklepark", "BGC Pickleball Hub", "Ayala Center Cebu Courts", "Robinsons Dumaguete Sports"
- Players: Filipino names (Juan Dela Cruz, Maria Santos, etc.)
- Prices in Philippine Peso (₱)
- Distance formatted as `🏍 8 min · 🚗 15 min · 2.1 km`
- Pickleball court images from Unsplash (`photo-1622279486466-1e9b7c60d7c1`, `photo-1571019614242-c5c5dee9f50b`, etc.)

---

## Verification
- Open the dev preview; navigate Landing → Auth → Player Dashboard → Owner Dashboard
- Check font loads (Rajdhani for PICKLERS heading, Outfit for body)
- Test toggle between Facilities/Open Play on landing
- Test tab switching in player and owner shells
- Test live court timer countdown (starts at 45:12, animated)
- Verify mobile layout at 375px viewport (bottom tab bar visible, sidebar hidden)
- Confirm all cyan/green accents render (not default blue)
