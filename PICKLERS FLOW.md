# PICKLERS FLOW — Master End-to-End Application Flow & Prompt Guide

> **Purpose**: This document outlines the comprehensive user flow, UI layout, interactions, visual aesthetic, and behavioral specifications of **PICKLERS** (excluding Admin and Developer consoles). You can use this as an exhaustive master prompt or blueprint in a new workspace or folder to recreate the entire web application from scratch.

---

## 1. System Overview & Tech Stack Context
- **Framework**: Next.js 14/15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion (`motion/react`).
- **Backend / Database**: Supabase (Auth, Postgres, Realtime, Storage).
- **Core Design System**: 
  - **Dark / Light Mode** with clean dark luxury sports aesthetic (`emerald-500` accent, dark slate background `#0a1628` / `#050b14`, glassmorphic backdrops, smooth rounded corners).
  - **Toast Notifications**: Dark pill aesthetic with `rounded-xl`, `backdrop-blur-2xl`, `bg-emerald-500/10` / `border-emerald-500/20` (Success) and `bg-red-500/10` / `border-red-500/20` (Error).
  - **Animations**: Subtle spring motions, count-up numbers, draggable marquee, tracing beams, sliding dialogs/drawers.

---

## 2. Landing Page Flow (`/`)

### 2.1 Navigation Header (Sticky & Scroll-linked)
- **Brand Logo & Title**: "PICKLERS" with logo icon and shimmering gradient brand text (`ShinyText`).
- **Navigation Links**:
  - `Facilities` (smooth-scrolls to facilities section)
  - `Open Play` (smooth-scrolls to open play matches section)
  - `How it Works` (smooth-scrolls to onboarding/features)
  - `FAQ` (smooth-scrolls to FAQ accordion)
- **Theme Switcher**: Sun / Moon toggle for dark and light themes.
- **Action Buttons**:
  - `Sign In` / `Get Started` button directing to `/auth` (or direct links to `/app` if user session exists).
  - Mobile hamburger toggle opening a backdrop-blurred slide-out menu on smaller viewports.

### 2.2 Hero Section
- **Badge**: "PHILIPPINES' PREMIER PICKLEBALL PLATFORM" with an animated pulsing beacon.
- **Headline**: High-impact typography stating: *"Find Courts. Join Matches. Play Pickleball."*
- **Sub-headline**: Clear value proposition for players and court owners across Metro Manila and nationwide.
- **Dual CTA**:
  - Primary button: *"Find a Court Near You"* (prompts location or navigates to `/app`).
  - Secondary button: *"Host / List a Court"* (routes to owner onboarding flow).
- **Interactive Live Preview Card**:
  - Interactive court widget displaying live court status (Occupied vs. Available), real-time countdown timer, player count, and instant "Quick Book" interaction preview.

### 2.3 Draggable Sponsors / Partners Marquee
- A smooth, physics-based, draggable infinite marquee ribbon.
- Displays trusted partner club logos, pickleball equipment sponsors, and regional federation badges with infinite seamless loop and grab-and-drag interaction.

### 2.4 Quick Discovery & Filter Section (Facilities vs. Open Play)
- **Pill Switcher**: Toggle between `[ Facilities ]` and `[ Open Play Matches ]`.
- **Facilities View**:
  - Displays facility cards with cover photo, badges (Indoor/Outdoor, Air-conditioned, Pro Surface), Star Rating, location string, starting price per hour (₱), and "Book Now" CTA.
  - Hover zoom on images with smooth sheen animation.
- **Open Play Matches View**:
  - Shows upcoming open community game cards with skill bracket (Beginner, Intermediate, Advanced, Open), venue name, date/time slot, spots remaining (e.g. `3/6 spots left`), host avatar, and entry fee.

### 2.5 Features & "How It Works" Section
- Step-by-step 3-card progressive visual breakdown:
  1. **Discover**: Filter courts by location, indoor/outdoor, amenities, and player reviews.
  2. **Reserve & Split**: Book slots instantly or join open community games with instant confirmations.
  3. **Show Up & Play**: Generate your in-app QR Ticket pass and step right onto the court.

### 2.6 Interactive Live FAQ & AI Assistant Widget
- **FAQ Accordion**: Expandable Q&A answers on court cancellation policies, wallet refunds, booking rules, and equipment rental.
- **Floating / Embedded AI Pickleball Assistant**: Interactive chat widget where visitors can ask questions like *"Where can I play in BGC?"* or *"What paddle is best for beginners?"* with instant streamed responses.

### 2.7 Footer
- Quick links (Explore, Bookings, Owner Application, Community).
- Legal links: `/privacy` (Privacy Policy) and `/terms` (Terms of Service).
- Social links (Instagram, Facebook, Twitter), copyright notice, and Metro Manila location tag.

---

## 3. Authentication & Account Recovery (`/auth`)

### 3.1 Unified Auth Card & Tabs
- Centered glassmorphic container with glowing subtle grid background.
- "Back to Home" navigation button.
- Toggle between `Sign In` and `Sign Up`.

### 3.2 Sign In Flow
- Tab options: **Email** or **Mobile Phone** (+63 Philippine standard format).
- Password input with toggleable visibility eye icon.
- "Forgot Password?" hyperlink.
- OAuth Social Logins: **Continue with Google**.
- Form validation with shake animation on invalid credentials.
- Automatic routing based on role:
  - Players → `/app`
  - Facility Owners → `/app/owner`

### 3.3 Sign Up Flow
- Full Name, Email or Phone Number, Password with dynamic 3-bar Password Strength Meter (`WEAK`, `FAIR`, `STRONG`).
- Optional Referral Code input.
- Terms and conditions agreement checkbox.
- Phone OTP Verification state:
  - 6-digit numeric OTP input with automatic countdown resend timer (60s).
  - Success checkmark transition into app initialization.

### 3.4 Forgot & Reset Password Flow
- Step 1: Input registered email or mobile number.
- Step 2: Receive 6-digit one-time code or email password reset link.
- Step 3: Set new password with confirmation and redirect back to login.

---

## 4. Player Application Experience (`/app/*`)

### 4.1 Player App Shell & Navigation
- **Desktop Sidebar**:
  - PICKLERS Logo & Shiny brand banner.
  - Notification Bell with unread indicator badge and dropdown modal.
  - Tab links:
    1. **Play** (Icon: Building / Courts) → `/app`
    2. **Explore** (Icon: Flame / Open Play) → `/app/explore`
    3. **Community** (Icon: Users / Social) → `/app/community`
    4. **Bookings** (Icon: Calendar / Tickets) → `/app/bookings`
    5. **Settings** (Icon: Cog) → `/app/settings`
  - Bottom Profile strip with user avatar, name, and Logout CTA.
- **Mobile Bottom Bar**: Floating glassmorphic tab bar keeping primary actions 1 tap away.

### 4.2 Play Tab — Courts & Facility Booking (`/app`)
- **Location Selector & Auto-Locate**:
  - Displays current city/locality (e.g. "Metro Manila").
  - "Use My Current Location" button using GPS and reverse geocoding.
- **Search & Advanced Filters**:
  - Live search bar searching facility name, district, or city.
  - Filter modal: All, Indoor only, Outdoor only.
  - Sort options: Recommended, Price (Low to High), Rating (High to Low).
- **Facility Grid & Cards**:
  - Heart icon to save/favorite facilities (persisted in user profile).
  - Distance tag, court count, surface type, and price per hour.
  - Clicking any card opens the comprehensive **Facility Detail View**.

### 4.3 Facility Detail & Court Reservation Flow (`/app/facility/[id]`)
- **Hero Gallery**: Image carousel of the venue with verified facility badge.
- **Facility Overview**: Operating hours, address with Map view, amenities tags (Locker rooms, Shower, Free parking, Paddle rental, Lighting).
- **Court Selector**:
  - Lists available individual courts (Court 1, Court 2, etc.) with surface information.
- **Interactive Time Slot Picker**:
  - Date selector (Today, Tomorrow, Pick custom date).
  - Hourly slot blocks (6:00 AM to 11:00 PM) colored by status:
    - *Emerald*: Available
    - *Gray / Crossed out*: Booked / Occupied
    - *Selected*: Highlighted with active booking pill.
  - Multi-hour selection support.
- **Payment & Booking Confirmation Modal**:
  - Itemized receipt: Court rate × Hours + small platform service fee.
  - Payment Method Selector:
    - **Picklers In-App Wallet** (instant one-click debit).
    - **GCash / Maya / Credit Card** (simulated or PayMongo/Stripe integration).
  - "Confirm Reservation" button triggers confetti/haptic feedback, issues a confirmed booking, and opens the QR Ticket.

### 4.4 Explore Tab — Open Play & Community Matches (`/app/explore`)
- **Filter by Skill Level**: All, Beginner (1.0 - 2.5), Intermediate (3.0 - 3.5), Advanced (4.0+).
- **Match Cards**:
  - Organizer avatar and player tier.
  - Venue name and scheduled play date/time.
  - Format (Doubles, Singles, King of the Court, Round Robin).
  - Player slots status: Interactive avatars showing filled slots + empty spots with `+` icon.
  - "Join Match" button:
    - Automatically reserves spot.
    - Sends automated chat message to match group.
    - Shows instant toast confirmation.

### 4.5 Community Tab — Social Feed, Groups & Direct Chat (`/app/community`)
- **Sub-Tabs**:
  1. **Feed**:
     - Community announcements, player match highlights, photo uploads, and game recap posts.
     - Like button (heart animation) and threaded comment section.
     - "Create Post" box with photo attachment.
  2. **Messages / Inbox**:
     - Direct chats with match partners, organizers, and court owners.
     - Real-time conversation thread with message timestamps, read receipts, and instant message sending.
  3. **Pickleball Clubs & Players Directory**:
     - Search local players, see DUPR rating or self-assessed skill level, and click "Message" or "Challenge".
  4. **My Profile**:
     - Avatar, Bio, Home Court, Skill Level badge, Total matches played, Win rate, and Badges earned.

### 4.6 Bookings & Digital Pass Tab (`/app/bookings`)
- **Sub-tabs**:
  - `Upcoming`
  - `Completed`
  - `Refunds & Cancelled`
  - `Wallet & Ledger`
- **Active Booking Pass Card**:
  - Facility Name, Court Number, Date, Time window.
  - **"View QR Pass" Button**:
    - Opens a high-contrast digital QR Code ticket modal with booking reference number, attendee name, and security hash for court gate check-in.
  - **"Get Directions"**:
    - Opens an in-app interactive route overlay or launches Google Maps / Waze with coordinates.
  - **"Cancel Booking" Flow**:
    - Warns user of cancellation policy window (e.g. >24 hrs full refund to wallet, <12 hrs partial).
    - On confirmation, releases slot back to court schedule and automatically credits user wallet balance.

### 4.7 Wallet & Top-Up Modal
- **Balance Card**: Displays current funds in PHP (₱).
- **One-Click Top-Up**:
  - Quick amount pills (+₱200, +₱500, +₱1,000, +₱2,500).
  - Payment rails: GCash QR or card payment.
- **Transaction History List**:
  - Detailed list of booking debits, cancellation refunds, top-ups, and tournament prizes.

### 4.8 Player Settings & Profile Customization (`/app/settings`)
- Profile photo upload with crop/preview.
- Personal information (Display Name, Contact Phone, Skill Level rating).
- Security: Change password, Two-Factor Authentication setup, active devices.
- Notification Preferences (SMS alerts, match reminders, promotional deals).
- Legal & Support: Direct modals for Support Contact, Terms of Service, and Privacy Policy.
- **"Become a Court Owner / Host Your Venue" Banner**:
  - Leads directly to the **Owner Application Wizard**.

---

## 5. Court Owner Onboarding Application (`/app/owner-application`)

A guided 3-step application workflow for facility managers and private court owners:

1. **Step 1: Facility Details**:
   - Facility Name, Street Address, City, Province, Postal Code.
   - GPS Pinpoint button ("Fetch exact court coordinates").
   - Court inventory: Number of courts, surface type (Cushioned Acrylic, Hard Court, Concrete, Wood), Indoor vs. Outdoor status, lighting capability.
   - Pricing: Base hourly rate per court.
2. **Step 2: Business & Contact Information**:
   - Authorized manager / owner full name.
   - Contact email and mobile phone.
   - Tax / Business identification or proof of ownership.
3. **Step 3: Verification & Document Upload**:
   - Dropzone for Business Permit / Mayor's Permit or Land Title / Lease Agreement.
   - Valid Government ID upload with live preview.
   - Confirmation agreement with platform standards.
4. **Submission Confirmation**:
   - Animated success state with status tracking indicator ("Under Review — typically approved within 24-48 hours").

---

## 6. Facility Owner Management Portal (`/app/owner/*`)

*(Accessible to approved users with the `owner` role)*

### 6.1 Owner App Shell & Navigation
- Top status bar with live revenue metrics, facility selector, and notification bell.
- Navigation Sidebar:
  1. **Dashboard** (`/app/owner`)
  2. **My Courts** (`/app/owner/courts`)
  3. **Tournaments** (`/app/owner/tournaments`)
  4. **Earnings & Payouts** (`/app/owner/earnings`)
  5. **Messages** (`/app/owner/messages`)
  6. **Settings** (`/app/owner/settings`)

### 6.2 Owner Dashboard (`/app/owner`)
- **Key Metrics Row**:
  - Total Monthly Revenue (₱) with percentage change trendline.
  - Active Bookings Today count.
  - Court Utilization Rate (e.g. 78% peak).
  - Walk-in vs. Online booking ratio.
- **Live Court Status Grid**:
  - Real-time visual representation of all courts in the facility.
  - Shows current session status: *In Progress (e.g. 24m remaining)*, *Next Booking at 4:00 PM*, or *Empty / Available*.
  - Action buttons: "End Session Early", "Extend 30m", or "Quick Check-in".
- **QR Pass Scanner Button**:
  - Launches device camera to scan arriving players' QR booking ticket and validates check-in in under 1 second.
- **Pending Booking Requests**:
  - Accept or Decline incoming reservation requests with instant notification dispatched to the player.

### 6.3 Court & Schedule Management (`/app/owner/courts`)
- **Court Configuration**:
  - Add New Court modal (Court name, indoor/outdoor, hourly rate, custom maintenance schedule).
  - Edit court status: Active, Under Maintenance, or Closed.
- **Walk-in Booking Modal**:
  - Allows the front desk to manually record an offline cash / walk-in customer into any time slot so online players don't double-book.
- **Custom Open Play Sessions**:
  - Tool to create community events (e.g. "Friday Night Social Dink & Drink" or "Morning Seniors Open Play") with per-player entry fees and maximum player caps.

### 6.4 Tournament Organizer Hub (`/app/owner/tournaments`)
- **Status Tabs**: `Upcoming`, `Ongoing`, `Completed`.
- **"Create Tournament" Modal**:
  - Tournament Title, Date, Entry fee per team, Prize pool breakdown.
  - Format options: Single Elimination, Double Elimination, Round Robin.
  - Bracket size: 8 Teams, 16 Teams, or 32 Teams.
- **Live Interactive Tournament Bracket**:
  - Visual tree showing matchups, seedings, and live score inputs.
  - Advancing winners automatically populates the next round.

### 6.5 Earnings & Payouts Portal (`/app/owner/earnings`)
- **Financial Balance Overview**:
  - Available for Payout (₱) balance.
  - Lifetime Earnings and Platform Commission summary.
- **Request Payout Modal**:
  - Payout destination options: Bank Transfer (BDO, BPI, UnionBank) or E-Wallet (GCash, Maya).
  - Input Account Number and Account Holder Name.
  - Minimum payout validation with transaction submission.
- **Itemized Ledger**:
  - Historical table with transaction date, player name, court name, gross fee, platform fee, and net payout status (`settled`, `pending`, `processing`).

### 6.6 Owner Messages (`/app/owner/messages`)
- Split-pane chat interface:
  - Left pane: Conversations with players who have upcoming or past bookings.
  - Right pane: Full chat thread with ability to send facility announcements, court directions, or answer inquiries in real-time.

---

## 7. Static & Informational Pages

### 7.1 Privacy Policy (`/privacy`)
- Clean, readable legal document outlining data protection, GPS location handling, and payment security compliant with the Philippine Data Privacy Act.

### 7.2 Terms of Service (`/terms`)
- Platform booking rules, refund timeframes, facility safety guidelines, liability waivers, and account regulations.

---

## 8. Summary of Re-Prompting Instructions

When prompting an AI to generate this app from scratch in a fresh folder, paste the following concise prompt:

```text
Build a full-stack, production-ready Pickleball Court Booking and Community Web Application called "PICKLERS". 

Tech Stack:
- Next.js 14/15 App Router with TypeScript
- Tailwind CSS with a dark luxury sports aesthetic (deep slate background #0a1628, emerald-500 brand accent, glassmorphism, rounded-xl cards)
- Framer Motion for animations (smooth modal transitions, count-up numbers, interactive marquee)
- Supabase for Auth and Database (facilities, courts, matches, bookings, wallet_transactions, profiles)

Core User Flows to Build (Exclude Admin and Developer Consoles):

1. LANDING PAGE (/):
   - Glassmorphic header with logo, navigation links, theme switcher, and Sign In button.
   - Dynamic Hero section with headline, "Find a Court" / "Host a Court" CTA, and interactive live court preview widget.
   - Draggable infinite sponsors marquee with smooth physics.
   - Facilities & Open Play switcher displaying interactive cards with price per hour, ratings, and badges.
   - How It Works 3-step feature cards, expandable FAQ accordion, and interactive AI chat helper widget.
   - Footer with links to /privacy, /terms, social media, and copyright.

2. AUTHENTICATION (/auth):
   - Unified modal with Sign In and Sign Up tabs.
   - Sign In supporting both Email and Philippine Mobile Phone (+63) plus Google OAuth.
   - Sign Up with real-time password strength meter and phone OTP verification screen.
   - Forgot Password & Reset Password multi-step flow.

3. PLAYER EXPERIENCE (/app):
   - Responsive App Shell (Sidebar on desktop, bottom navigation on mobile).
   - Play Tab (/app): Location search with GPS auto-detect, indoor/outdoor filters, facility cards.
   - Facility Details (/app/facility/[id]): Photo gallery, amenity chips, court selector, and visual interactive hourly time-slot grid (available vs booked) with instant booking modal and payment checkout (In-App Wallet or GCash).
   - Explore Tab (/app/explore): Open play community match finder filtered by skill level (Beginner, Intermediate, Advanced) with instant "Join Match" interaction.
   - Community Tab (/app/community): Social feed for match updates, direct messaging inbox between players, and user profile page.
   - Bookings Tab (/app/bookings): Active upcoming and completed bookings, dynamic digital QR Ticket Pass modal for venue check-in, turn-by-turn navigation map launch, and self-service cancellation with automated wallet refund.
   - Settings Tab (/app/settings): Profile info, notifications, wallet balance with top-up modal, and "Host Your Venue" CTA.

4. OWNER ONBOARDING (/app/owner-application):
   - 3-step wizard for court owners: Facility details & pricing -> Contact details -> Business permit and ID document upload -> Confirmation review screen.

5. OWNER PORTAL (/app/owner):
   - Owner Dashboard (/app/owner): Real-time court session tracker, revenue sparklines, and fast QR code camera scanner for checking in arriving players.
   - My Courts (/app/owner/courts): Add court modal, hourly rate management, walk-in cash customer entry, and custom open play session creator.
   - Tournaments (/app/owner/tournaments): Tournament creation wizard with interactive bracket generator (Single/Double elimination).
   - Earnings (/app/owner/earnings): Balance summary, payout request modal to GCash/Bank, and detailed itemized payout history.
   - Messages (/app/owner/messages): Real-time chat with players.

6. STATIC PAGES:
   - /privacy and /terms styled cleanly with back-to-home navigation.
```
