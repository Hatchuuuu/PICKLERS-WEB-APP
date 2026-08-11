# PICKLERS ADMIN SYSTEM DESIGN SPECIFICATION

## 1. Executive Summary & Core Concept

The **Picklers Admin System** introduces an elevated administrative infrastructure for the PICKLERS Web App while preserving a **Unified Dual-Identity Account Model**. 

Admins do not need separate logins; an Admin account functions as a standard **Player Account** (capable of booking courts, playing matches, joining clubs, rating players, and chatting) while granting access to a high-level **Admin Console**.

Admins can seamlessly switch between **"Player View"** and **"Admin Console"** via a dynamic header mode toggle.

---

## 2. System Architecture & Database Schema (Supabase)

All SQL additions will be appended to `web/supabase/setup_all.sql` for single-script execution.

### A. Extended `player_profiles` Table
- `is_admin` (`BOOLEAN`, default `FALSE`)
- `admin_role` (`TEXT`, e.g., `'super_admin'`, `'moderator'`, `'finance_admin'`)
- `admin_permissions` (`TEXT[]`, e.g., `['approve_owners', 'moderate_users', 'view_analytics', 'manage_promos']`)

### B. `owner_applications` Table
```sql
CREATE TABLE IF NOT EXISTS public.owner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_state(),
    user_id UUID NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    tax_id_or_reg_no TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    facility_name TEXT NOT NULL,
    facility_address TEXT NOT NULL,
    court_count INTEGER DEFAULT 1,
    government_id_url TEXT,
    business_license_url TEXT,
    proof_of_ownership_url TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_requested')) DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.player_profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### C. `admin_audit_logs` Table
```sql
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_state(),
    admin_id UUID NOT NULL REFERENCES public.player_profiles(id),
    action TEXT NOT NULL, -- e.g., 'APPROVE_OWNER_APPLICATION', 'REJECT_OWNER_APPLICATION', 'BAN_USER'
    target_type TEXT NOT NULL, -- e.g., 'owner_application', 'user', 'facility', 'promotion'
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### D. `promotions` Table
```sql
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_state(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    min_booking_amount NUMERIC(10, 2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.player_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Core Admin Capabilities & Modules

### Module 1: Facility Owner Application Management (Accept / Reject Workflow)
- **Application Queue**: Filterable by `Pending` (with live counter badge), `Approved`, `Rejected`, and `Needs Info`.
- **In-App Document Viewer**: Inline viewer with zoom & rotate support for Government ID, Business License, and Property Lease documents.
- **Accept Action**:
  - Updates application status to `'approved'`.
  - Upgrades applicant's `player_profiles.role` to `'owner'`.
  - Provisions facility listing record.
  - Triggers automated celebration Push & Email notifications.
  - Logs action in `admin_audit_logs`.
  - Displays Picklers success toast (`bg-emerald-500/10 border-emerald-500/20 text-emerald-500 rounded-xl backdrop-blur-2xl`).
- **Reject Action**:
  - Rejection Form Modal with structured drop-down options (*Incomplete Documents*, *Unverified Identity*, *Invalid Business License*, *Location Mismatch*, *Custom Note*).
  - Saves rejection feedback to record.
  - Sends automated Push & Email notification explaining reasons and re-application steps.
  - Logs action in `admin_audit_logs`.
  - Displays Picklers error toast (`bg-red-500/10 border-red-500/20 text-red-500 rounded-xl backdrop-blur-2xl`).
- **Request Revision Action**:
  - Allows requesting updated document uploads without hard-rejecting the applicant.

### Module 2: User & Account Moderation Hub
- Search and inspect any Player, Owner, or Admin profile.
- Temporary or permanent account suspension with mandatory reason logging.
- Mute/unmute user in match chat and community feed.
- Reset MFA/verification states and view audit logs for specific users.

### Module 3: Facility & Court Audit Management
- List and filter all court facilities across the platform.
- Temporarily suspend non-compliant facilities or feature top-tier facilities on the mobile home feed.
- Verify court attributes (lighting, surface, net condition, indoor/outdoor).

### Module 4: Financials, Bookings & Dispute Resolution
- Real-time GMV (Gross Merchandise Value), net commission revenue, and owner payout tracking.
- Handle cancelled bookings, double-booking disputes, and process manual refunds to player wallets/cards.

### Module 5: Developer & System Operations Suite
- **System Announcement Banner Manager**: Create platform-wide announcements (e.g. maintenance alerts, tournament promos).
- **Audit Logs Ledger (`admin_audit_logs`)**: Filterable timeline of all administrative activities.
- **Health Dashboard**: Monitor database connectivity, payment gateway statuses, and push notification delivery queues.

### Module 6: 🎁 Marketing, Promos & Referral Engine
- **Promo Code Generator**: Create and manage discount codes (e.g., `PICKLE20`) with usage limits, minimum booking totals, and expiration dates.
- **Loyalty & XP Rewards Control**: Manage player reward multipliers and XP point distribution.
- **Targeted Geo-Push Campaigns**: Send location-segmented push notifications (e.g. rain-out alerts driving players to indoor facilities).
- **Referral Abuse Monitor**: Detect multi-account referral manipulation and block fraudulent rewards.

### Module 7: 📊 Executive Analytics & Growth Intelligence (BI Dashboard)
- **Real-Time KPI Dashboard**: Track DAU/MAU, total court hours booked, user retention cohorts, and platform revenue trends.
- **Geographic Demand Heatmap**: Interactive map overlay showing areas of high player activity vs court scarcity.
- **Facility Owner Leaderboards**: Rank facility owners by customer ratings, court availability uptime, and revenue generation.
- **Financial Report Export**: One-click CSV/Excel export for monthly tax and accounting reconciliation.

---

## 4. UI/UX & Aesthetic Rules (Picklers Brand Guidelines)

- **Dark Theme Glassmorphism**: Built using dark background gradients, subtle borders, and `backdrop-blur-2xl`.
- **Mode Switcher**: Subtle avatar dropdown toggle: **"Switch to Admin Console"** ↔ **"Switch to Player View"**.
- **Picklers Toast Styling**:
  - **Success Toast**: `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400`
  - **Error/Destructive Toast**: `flex items-center gap-2 px-4 py-3 rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400`
