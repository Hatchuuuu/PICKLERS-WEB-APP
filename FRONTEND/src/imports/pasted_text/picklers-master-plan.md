# PICKLERS — Master Implementation Plan 

> **Principal Systems Architect & Lead UI/UX Engineer**
> *Merging the exact UI/UX wireframes with the hardened backend architecture.*

---

## 1. TECH STACK & INFRASTRUCTURE
*   **Language:** TypeScript (Strict Mode Enabled)
*   **Frontend UI:** React 19, Vite (Initial Build) → Next.js (Post-UI Migration)
*   **Styling:** Tailwind CSS v4, Lucide React (Icons), Radix UI (Primitives)
*   **Motion & Polish:** Framer Motion (Emil Kowalski standards: spring physics, layout transitions), GSAP (for complex hero animations), embla-carousel-react.
*   **Backend & Auth:** Supabase (PostgreSQL, Auth, Realtime WebSockets, PostGIS for location).
*   **Monitoring/Caching:** Sentry (Error tracking), Redis (Rate limiting).
*   **Infrastructure:** Docker, Kubernetes.
*   **Form Management:** react-hook-form, zod (Validation).
*   **Date Handling:** date-fns.
*   **Hardware Interfacing:** html5-qrcode (for Owner check-in scanning).

---

## 2. EXACT UI/UX WIREFRAMES & SPECIFICATIONS

### 2.1 Landing Page (`/`)
**Visual Requirements:** Premium aesthetics, dark/light mode support, vibrant glassmorphism, dynamic numbers, and smooth scroll animations.

**Header/Hero Section:**
```text
               #1 Philippines Pickleball Booking app

                            PICKLERS
                         FIND. BOOK. PLAY.

   Book premium pickleball courts across the Philippines, join open play
       sessions, connect with players, and manage everything in one place.

             [ BOOK A COURT ]     |     [ JOIN OPEN PLAY ]

                Are you a Court Owner? [ List your Court → ]
```
*   **Dynamic Stats Bar (Animated Count-Up):**
    *   `Venues`: e.g., 142
    *   `Active Players`: e.g., 12,450
    *   `Service Fee`: e.g., 5-10%
    *   `Registrations`: e.g., 200/day
*   **Feature Showcase:**
    *   Scroll-triggered parallax animations highlighting: Real-time booking, Split-billing, Tournament brackets, and Secure GCash payments.
*   **The Main Toggle (Sticky Section):**
    ```text
                          Play Pickleball, Anywhere.
          Discover premium facilities and join active matches near you.

                               (Spring Toggle Switch)
                    [ PICKLE FACILITIES ] | [ OPEN PLAY ]
    ```
    *   *Interaction:* When toggled to Facilities, the grid below smoothly animates (Framer Motion `AnimatePresence`) into Facility Cards. When toggled to Open Play, it morphs into Open Match Cards.

### 2.2 Authentication Flow (`/auth`)
Triggered via "Book a Court", "Join Open Play", or "List your Court".

**Form Layout:**
```text
           [ Sign in ] | [ Create account ] (Sliding underline tab)

Full Name
[________________________]

Email address           (use phone number instead) -> Toggles input mask
[________________________] [ Send code ]

               or continue with
          [ Google ]    |    [ Facebook ]
```
*   **Logic:**
    *   Phone numbers use OTP (`input-otp` component).
    *   OAuth (Google/Facebook) uses Supabase Auth redirects.
*   **Role Logic:** EVERY user starts as a `player`. 
*   **Verification Wall:** Players can browse `/app` immediately, but features like `[ Book Now ]` or `[ Join Match ]` pop up a "Verify Account" modal (GCash verification or ID upload) before proceeding.
*   **Owner Onboarding:** Owners create a player account, navigate to `/app/settings`, and click "Apply for Owner Status", which triggers the legal document upload flow.

---

## 3. PLAYER DASHBOARD (`/app`)

### 3.1 PLAY (Facility Discovery & Quick Book)
*   **Header:** "DISCOVER COURTS - find and book the best facilities near you"
*   **Facility Card Component:**
    *   **Hero Image:** High-res image with a `[ Favorite ♡ ]` floating button (spring animation on tap).
    *   **Badges:** `Indoor`, `Outdoor`, or `Indoor/Outdoor` overlay.
    *   **Data Row 1:** Rating (e.g., `★ 4.8`), Location Name.
    *   **Data Row 2:** Driving Distance (`🏍 8 min · 🚗 15 min · 2.1 km`) powered by device Geolocation and PostGIS.
    *   **Data Row 3:** Operating Hours (`6:00 AM - 10:00 PM`).
    *   **Bottom Action:** `₱400/hr` | `[ View Courts ]`.

*   **Facility Detail Page (`/app/facility/:id`):**
    *   **Image Carousel:** Swipeable gallery (`embla-carousel`).
    *   **Quick Book Modal:** 
        *   User selects Date and Time Range.
        *   System queries `courts` where `facility_id` matches and `time_range` does NOT overlap.
        *   Returns a list of available specific courts (e.g., "Court 1", "Center Court").
    *   **Court List:** Manual list of all courts (Court 1, Court 2, Court 3) with individual schedules.

*   **Checkout & Payment Flow (`/app/book/:courtId`):**
    *   **Summary:** Court Name, Date, Start/End Time, Total Price + Service Fee.
    *   **Payment Method Picker:** `[ Cash on Site ]` | `[ GCash ]` | `[ Pickle Credits ]`.
    *   **Action:** `[ Confirm Payment ]`. Triggers loading state, then confetti success animation.

### 3.2 EXPLORE (Open Play & Matchmaking)
*   **Purpose:** For solo players or groups looking to fill slots and split costs.
*   **Open Play Card Component:**
    *   **Header:** Type/Level (`Beginner`, `Intermediate`, `Advanced`). Color-coded tags.
    *   **Capacity Ring:** Circular progress bar showing `5/8 joined`.
    *   **Details:** Facility Name, Date, Time.
*   **Split-Bill Logic (The Financials):** 
    *   The Host pays the full court fee upfront (e.g., ₱800).
    *   When Player B taps `[ Join Match ]`, they are prompted to pay ₱200 (via GCash).
    *   Upon successful payment, ₱200 is routed to the Host's Wallet (or refunded to the Host's GCash).

### 3.3 BOOKINGS (History & Reviews)
*   **Tabs:** `Upcoming`, `Completed`, `Refunds`, `Cancelled`, `Wallet Balance`.
*   **Post-Booking Review:** 
    *   When a booking status changes to `Completed`, an in-app toast prompts: *"How was your game at [Facility]?"*
    *   Opens a `ReviewModal`: Interactive 1-5 star rating and comment box. Feeds directly into `facilities.avg_rating`.

### 3.4 COMMUNITY (Social & Inbox)
*   **Search & Add:** Search bar for player names or a button to scan a Player QR Code.
*   **Player Profile View:** 
    *   Avatar, Name, Skill Level.
    *   **Achievements:** Visual trophies (`🥇 4 Gold`, `🥈 1 Silver`, `🥉 7 Bronze`) fetched from tournament data.
    *   **Action:** `[ Follow ]` button. (Followers get push notifications when this player hosts an Open Match).
*   **Inbox:** Direct messaging interface using Supabase Realtime for instant chat delivery.

### 3.5 SETTINGS (Player)
*   Profile details, Notification preferences, Payment methods.
*   **Owner Activation Section:** A banner stating "Own a court? Apply for Owner Dashboard". Triggers a multi-step form to upload business permits for manual admin review.

---

## 4. OWNER DASHBOARD (`/app/owner`)

*(Protected by `OwnerRouteGuard` - requires `profile.role === 'owner'`)*

### 4.1 DASHBOARD (Live Operations)
*   **Analytics Header (Real-time):** 
    *   `Monthly Revenue`, `Today's Revenue`, `Active Bookings`, `New Players`, `Repeaters`.
*   **Walk-in Fast Track (High Priority):**
    *   Floating `[ + Log Walk-in ]` button.
    *   **Flow:** Modal opens -> Staff selects Court and Start/End time -> "Search Player or Enter Name".
    *   **Scenario A:** Searches and taps existing player (links data).
    *   **Scenario B:** Types "John Doe" and hits Confirm (Nullable `user_id`, instantly locks court).
*   **Live Courts Feed (The Grid):**
    *   Visual representation of all courts right now.
    *   **Session Timer:** Shows countdown (e.g., `45:00 remaining`).
    *   **Alert:** When time hits 00:00, the court border pulses red and a chime plays. (No need for staff to manually track time).
    *   **Early End:** `[ Skip/End ]` button frees the court immediately if players leave early.
*   **Booking Requests Queue:**
    *   List of pending bookings: `Juan Dela Cruz | Court 1 (Indoor) | 10am-1pm | ₱320`.
    *   Actions: `[ Accept ]` | `[ Decline ]`.
    *   **Auto-Accept Toggle:** Global switch to bypass manual review.

### 4.2 MY COURTS
*   **List View:** Grid of all courts belonging to the owner's facility.
*   **Search Bar:** Filter by court name (critical for 20+ court facilities).
*   **Add Court Flow:** `[ + List Court ]` -> Name (e.g. Center Court), Surface (Indoor/Hard), Price per Hour.
*   **Emergency Management:** Toggle switch on each court to mark it "Unavailable" (maintenance, weather).

### 4.3 TOURNAMENTS (USA Pickleball Standard Integration)
*   **Tabs:** `Active`, `Upcoming`, `Completed`.
*   **Creation Flow:** 
    *   `[ Create Tournament ]` -> Form: Name (Summer Smash 2026), Date, Max Teams.
    *   **Format Options:** Round Robin, Single Elimination, Double Elimination.
    *   **Skill Brackets:** 3.0-3.5 Division, 4.0+ Open.
*   **Management:** Auto-generates brackets based on registered players/teams.

### 4.4 STAFF MANAGEMENT
*   **Purpose:** Delegate daily operations (accepting bookings, logging walk-ins) without exposing financial data.
*   **Add Staff:** Input staff email/phone. Assigns them to the specific `facility_id` with a `desk` or `manager` role.
*   **Remove Staff:** Clicking delete prompts a strict confirmation modal requiring the owner to physically type `"delete this staff"`.
*   **Staff POV (Restricted Shell):**
    *   Staff log in and are routed to `/app/staff`.
    *   They can ONLY see the Live Courts feed, Booking Requests, and the Walk-in button.
    *   Wallet, Analytics, and Settings tabs are physically absent and protected via API RLS.

### 4.5 SETTINGS (Owner)
*   **Branding:** Upload Facility Logo, Name, Location (triggers maps API).
*   **Operating Hours:** 
    *   `[ Open 24 Hours ]` Toggle.
    *   If OFF, smooth accordion animation reveals exact open/close time pickers.
*   **Payments Configuration:**
    *   Text: *"Picklers supports GCash and Cash on Site only."*
    *   **GCash Setup UI:**
        ```text
        [G] GCash (Instant online payment)      [ Toggle ON ]
        
        Payout GCash Number               
        [ 09123489758 ]                     [ Send Code ]
        ```
        *Upon clicking 'Send Code', the input morphs into an OTP verifier to confirm ownership of the payout number.*

---

## 5. HARDENED DATABASE ARCHITECTURE (PostgreSQL / Supabase)

To support every UI requirement above flawlessly, the following schema and logic constraints are implemented:

### 5.1 Facility vs Court Abstraction
*   **`facilities` Table:** Handles geolocation, global images, branding, and average rating.
*   **`courts` Table:** Belongs to a facility. Holds `surface_type`, `name` (Court 1), and critically, `price_per_hour`. This allows granular pricing for premium center courts.

### 5.2 Slot Validation (Zero Double-Bookings)
*   **Database Extension:** `btree_gist` enabled in Postgres.
*   **Constraint:** `EXCLUDE USING gist (court_id WITH =, time_range WITH &&)` applied to the `bookings` table.
*   **Result:** The database mathematically rejects any overlapping timeslot down to the millisecond. No application-level race conditions are possible.

### 5.3 Staff Role & Permissions (Facility-Scoped RLS)
*   **`staff` Table:** Maps `user_id` -> `facility_id` -> `role`.
*   **Row Level Security (RLS):** Supabase policies ensure that a user with a `desk` role can `SELECT` and `UPDATE` bookings for their specific `facility_id`, but cannot read the `payouts` or `wallet_transactions` tables.

### 5.4 The "Hybrid" Walk-in Logic
*   **`bookings.user_id`:** Set to `NULLABLE`.
*   **New Columns:** `is_walkin (BOOLEAN)`, `walkin_name (TEXT)`.
*   **Result:** Allows staff to log cash walk-ins without forcing the client to download the app, preserving extreme front-desk speed.

### 5.5 Favorites, Notifications & Reviews
*   **`favorites` Table:** Links `user_id` to `facility_id`. Powers the "Saved" tab.
*   **`notifications` Table:** Powers the App Shell Bell Icon. Supabase Realtime WebSockets push updates instantly when a booking is confirmed or a match starts.
*   **`reviews` Table:** Linked to `booking_id`. A Postgres Trigger automatically calculates and updates the `facilities.avg_rating` on insert, saving frontend calculation time.

### 5.6 Cancellation & Refund Engine
*   **Logic:** Owners define a "Safe Window" (e.g., 24h). 
*   **Enforcement:** Backend cron jobs / RPCs evaluate the time difference upon cancellation. Full refunds are routed to "Pickle Credits", keeping capital inside the platform ecosystem.

---

## 6. DEVELOPMENT ROADMAP (7 Sprints)

> **Development Philosophy:** 
> *UI-First with Mock Data.* We build the complete visual interface using Emil Kowalski motion principles (springs, layout morphs) and Radix UI components first. Supabase wiring happens only after the UI is perfectly polished.

*   **Sprint 1: Foundation & Landing**
    *   Build responsive Landing Page with parallax feature scroll.
    *   Implement the animated `[Facilities] | [Open Play]` spring toggle.
    *   Build Auth Flow UI with sliding tabs and OTP inputs.
*   **Sprint 2: Player Shell & Discovery**
    *   Build global App Shell layout (Navbar, Sidebar, Notification Bell with drawer).
    *   Build Player Dashboard (`/app`) and Facility Detail page.
    *   Implement Floating Heart Favorite animation.
*   **Sprint 3: Booking Engine & Reviews**
    *   Build Quick Book modal with date/time pickers.
    *   Build Checkout/Payment UI.
    *   Build Booking History tabs and the 5-Star interactive Review Modal.
*   **Sprint 4: Social & Matchmaking**
    *   Build Explore page and Open Play split-bill confirmation sheets.
    *   Build Community tab (Player search, QR Scanner overlay).
    *   Build Realtime Inbox messaging UI.
*   **Sprint 5: Owner Live Operations**
    *   Build Owner Dashboard (`/app/owner`).
    *   Implement Live Courts grid with Session Timers.
    *   Build the friction-less Quick Walk-in Modal.
*   **Sprint 6: Owner Management**
    *   Build My Courts list and filtering.
    *   Build Tournaments bracket generator UI.
    *   Build Staff management (Add/Remove with "delete this staff" strict confirmation).
    *   Create the restricted `/app/staff` routing guard.
*   **Sprint 7: Owner Settings & Polish**
    *   Build Operating Hours accordion and GCash OTP verification layout.
    *   **Final Audit:** Full responsive layout check (Mobile/Tablet/Desktop), touch-target audit (44px minimum), and Framer Motion performance profiling.

---

## 7. ARCHITECTURAL DECISIONS (Audit 2026-07-07)

Based on the architectural audit, the following concrete logic decisions have been locked in for development:

1.  **Walk-in Payments (Hybrid Flexibility):** Walk-in bookings are not restricted purely to cash. The UI provides a toggle for "Paid via Cash" or "Paid via GCash (Counter)". The database `payment_method` safely supports this flexibility.
2.  **Split-Bill Refunds (Strict V1 Policy):** Split-bill open match payments are completely final. Once Player B pays to join Host A's match, the funds are securely and instantly credited to Host A's wallet. Player B bailing results in forfeiture of their funds.
3.  **Staff Notifications (Dashboard Only):** Staff booking notifications are constrained exclusively to the in-app dashboard. Using Supabase Realtime, the Dashboard UI will display a toast, increment a bell counter, and play a chime. Push notifications to personal devices are disabled to prevent notification fatigue.
4.  **Framework Strategy (Vite First):** We will maintain pure UI iteration speed by completing all 7 Sprints purely in Vite React. Migration to Next.js App Router is strictly deferred to a post-launch phase.
