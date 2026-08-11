# Picklers Admin System — Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified, dual-identity Admin System for the Picklers Web App — where an admin account is simultaneously a full Player account, featuring automatic role-based routing after login, a dynamic Player ↔ Admin Console mode switch, a complete Facility Owner Application review workflow (Accept / Reject / Request Revision), User Moderation, Promo & Marketing Engine, Executive BI Analytics Dashboard, Global Command Palette (`Cmd+K`), and a full immutable Admin Audit Trail.

**Architecture:** A new `(admin)` Next.js route group mirrors the existing `(player)` and `(owner)` patterns. The existing `middleware.ts` is extended to guard `/app/admin/*` routes. Both `AuthContext.tsx` and `useUserStore.ts` are updated to detect `is_admin` and expose admin state. `useAuthForm.ts` `handleSuccessRedirect` is patched to route admins to `/app/admin` after login. A new `AdminGate` component (mirroring the existing `RoleGate`) protects the admin layout. Three new Supabase tables (`owner_applications`, `admin_audit_logs`, `promotions`) are added. All admin write actions pass through server-side API routes that use a shared `requireAdmin()` helper, write audit logs, and dispatch email notifications via Resend (existing). The existing `facility_applications` table used by the player owner-application form is migrated to `owner_applications` for consistency.

**Tech Stack:** Next.js 14 App Router · TypeScript · Supabase PostgreSQL + RLS · Zustand · Resend (existing) · TailwindCSS + Picklers glassmorphism design system · Framer Motion / `motion/react` (existing) · `react-hook-form` + Zod (existing) · Lucide React icons (existing).

---

## Global Constraints

- **Route group pattern:** All admin pages under `web/src/app/(admin)/app/admin/` — consistent with existing `(owner)` and `(player)`.
- **Middleware guard:** `/app/admin` routes are protected by `is_admin = TRUE` check in `middleware.ts`.
- **Client-side guard:** Admin layout wraps children in `<ProtectedRoute>` → `<AdminGate>` (new, mirrors `RoleGate`).
- **Server-side guard:** Every admin API route calls `requireAdmin(supabase)` before processing.
- **Audit logging:** Every admin write action MUST insert a row into `admin_audit_logs` before returning success.
- **Notifications:** Approve/Reject actions send email via Resend (direct server-side call using `RESEND_API_KEY`, NOT through `/api/email` which restricts to self-email only).
- **Database migrations:** ALL SQL MUST be appended to `web/supabase/setup_all.sql` AND saved as standalone migration.
- **Toast styling — Success:** `bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl`
- **Toast styling — Error:** `bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl`
- **Player capabilities preserved:** Switching to Admin Console MUST NOT break any Player feature.
- All new UI components use `motion/react` for animations, `lucide-react` for icons.
- Existing `UserRole` type in `AuthContext.tsx` (line 8: `"player" | "owner" | "demo"`) must be extended to include `"admin"`.

---

## File Map

### New Files (28 files)

| # | File | Purpose |
|---|---|---|
| 1 | `web/supabase/migrations/20260811_create_admin_system.sql` | Standalone migration file |
| 2 | `web/src/types/admin.ts` | All admin TypeScript interfaces & enums |
| 3 | `web/src/components/shared/AdminGate.tsx` | Client-side admin role gate (mirrors `RoleGate.tsx`) |
| 4 | `web/src/app/api/admin/_lib/requireAdmin.ts` | Shared server-side admin auth helper |
| 5 | `web/src/app/api/admin/_lib/sendAdminEmail.ts` | Server-side Resend email helper for admin-initiated outbound emails |
| 6 | `web/src/app/api/admin/applications/route.ts` | GET list applications |
| 7 | `web/src/app/api/admin/applications/[id]/route.ts` | GET single + PATCH approve/reject/revise |
| 8 | `web/src/app/api/admin/users/route.ts` | GET paginated users |
| 9 | `web/src/app/api/admin/users/[id]/route.ts` | PATCH ban/unban/promote |
| 10 | `web/src/app/api/admin/promotions/route.ts` | GET list + POST create promo |
| 11 | `web/src/app/api/admin/promotions/[id]/route.ts` | PATCH update/deactivate promo |
| 12 | `web/src/app/api/admin/analytics/route.ts` | GET platform KPI stats |
| 13 | `web/src/app/api/admin/audit-log/route.ts` | GET filterable audit log |
| 14 | `web/src/app/(admin)/app/admin/layout.tsx` | Admin console shell layout |
| 15 | `web/src/app/(admin)/app/admin/page.tsx` | Admin overview dashboard |
| 16 | `web/src/app/(admin)/app/admin/applications/page.tsx` | Owner application queue page |
| 17 | `web/src/app/(admin)/app/admin/users/page.tsx` | User moderation hub page |
| 18 | `web/src/app/(admin)/app/admin/analytics/page.tsx` | Executive BI analytics page |
| 19 | `web/src/app/(admin)/app/admin/promotions/page.tsx` | Promo marketing engine page |
| 20 | `web/src/app/(admin)/app/admin/audit-log/page.tsx` | Immutable audit trail page |
| 21 | `web/src/components/admin/AdminSidebar.tsx` | Sidebar navigation for admin console |
| 22 | `web/src/components/admin/AdminHeaderBadge.tsx` | Header mode switcher badge |
| 23 | `web/src/components/admin/AdminCommandPalette.tsx` | `Cmd+K` global search palette |
| 24 | `web/src/components/admin/StatCard.tsx` | Reusable KPI stat card |
| 25 | `web/src/components/admin/ApplicationCard.tsx` | Application summary card |
| 26 | `web/src/components/admin/ApplicationDetailDrawer.tsx` | Full application inspection drawer |
| 27 | `web/src/components/admin/RejectApplicationModal.tsx` | Rejection reason form modal |
| 28 | `web/src/components/admin/PromoForm.tsx` | Create/edit promo code form |

### Modified Files (7 files)

| File | Change |
|---|---|
| `web/supabase/setup_all.sql` | Append all new table definitions and RLS policies |
| `web/src/types/index.ts` | Add `export * from './admin'` |
| `web/src/contexts/AuthContext.tsx` | Extend `UserRole` to include `"admin"`, add `isAdmin` to User interface, select `is_admin` in profile query, set `isAdmin` on User object |
| `web/src/store/useUserStore.ts` | Add `isAdmin`, `adminRole`, `adminPermissions`, `adminMode`, `toggleAdminMode` to store |
| `web/src/hooks/useAuthForm.ts` | Patch `handleSuccessRedirect` to route admin users to `/app/admin` |
| `web/src/middleware.ts` | Add `/app/admin` route protection block |
| `web/src/components/shared/RoleGate.tsx` | Extend `allowedRoles` logic to allow admin role users |

---

## Task 1: Database Migration & RLS Security

**Files:**
- Modify: `web/supabase/setup_all.sql`
- Create: `web/supabase/migrations/20260811_create_admin_system.sql`

**Interfaces:**
- Consumes: Existing `player_profiles` table (columns: `id UUID`, `role TEXT`, `verification_status TEXT`, `is_demo BOOLEAN`).
- Produces: New columns `is_admin`, `admin_role`, `admin_permissions`, `is_banned`, `banned_reason`, `banned_at` on `player_profiles`; new tables `owner_applications`, `admin_audit_logs`, `promotions`; RLS policies; helper function `public.is_admin()`.

- [ ] **Step 1: Create migration file AND append identical SQL to `web/supabase/setup_all.sql`**

```sql
-- =============================================
-- PICKLERS ADMIN SYSTEM — DATABASE MIGRATION
-- =============================================

-- 1. Extend player_profiles with admin fields
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL
    CHECK (admin_role IN ('super_admin', 'moderator', 'finance_admin')),
  ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ DEFAULT NULL;

-- 2. owner_applications table
-- NOTE: The existing player owner-application page (owner-application/page.tsx)
-- inserts into `facility_applications`. This new table replaces it with a richer schema.
-- The player-facing form should be updated to insert into `owner_applications` instead.
CREATE TABLE IF NOT EXISTS public.owner_applications (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  -- Business details
  business_name          TEXT        NOT NULL,
  tax_id_or_reg_no       TEXT,
  contact_email          TEXT        NOT NULL,
  contact_phone          TEXT        NOT NULL,
  -- Facility details
  facility_name          TEXT        NOT NULL,
  facility_address       TEXT        NOT NULL,
  court_count            INTEGER     NOT NULL DEFAULT 1 CHECK (court_count >= 1),
  surface_type           TEXT,
  indoor_outdoor         TEXT        CHECK (indoor_outdoor IN ('Indoor', 'Outdoor', 'Both')),
  operating_hours        TEXT,
  additional_notes       TEXT,
  -- Uploaded document URLs (Supabase Storage bucket: facility-documents)
  government_id_url      TEXT,
  business_license_url   TEXT,
  proof_of_ownership_url TEXT,
  facility_photos_urls   TEXT[]      NOT NULL DEFAULT '{}',
  -- Workflow state
  status                 TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'more_info_requested')),
  rejection_reason       TEXT,
  revision_request_note  TEXT,
  reviewed_by            UUID        REFERENCES public.player_profiles(id),
  reviewed_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_owner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_owner_applications_updated_at ON public.owner_applications;
CREATE TRIGGER trg_owner_applications_updated_at
  BEFORE UPDATE ON public.owner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_owner_applications_updated_at();

-- 3. admin_audit_logs — immutable ledger (no UPDATE/DELETE policies)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        NOT NULL REFERENCES public.player_profiles(id),
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   UUID        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT          UNIQUE NOT NULL,
  description         TEXT,
  discount_type       TEXT          NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value      NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_booking_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_uses            INTEGER,
  current_uses        INTEGER       NOT NULL DEFAULT 0,
  applicable_to       TEXT          NOT NULL DEFAULT 'all'
    CHECK (applicable_to IN ('all', 'new_users', 'returning_users')),
  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by          UUID          REFERENCES public.player_profiles(id),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions         ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- owner_applications RLS
CREATE POLICY "owner_app_select"  ON public.owner_applications FOR SELECT  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "owner_app_insert"  ON public.owner_applications FOR INSERT  WITH CHECK (user_id = auth.uid());
CREATE POLICY "owner_app_update"  ON public.owner_applications FOR UPDATE  USING (public.is_admin());

-- admin_audit_logs RLS (SELECT + INSERT only — immutable)
CREATE POLICY "audit_log_select"  ON public.admin_audit_logs FOR SELECT  USING (public.is_admin());
CREATE POLICY "audit_log_insert"  ON public.admin_audit_logs FOR INSERT  WITH CHECK (public.is_admin());

-- promotions RLS
CREATE POLICY "promo_select"      ON public.promotions FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "promo_insert"      ON public.promotions FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "promo_update"      ON public.promotions FOR UPDATE USING (public.is_admin());
```

- [ ] **Step 2: Commit**

```bash
git add web/supabase/setup_all.sql web/supabase/migrations/20260811_create_admin_system.sql
git commit -m "feat(db): add admin system tables, RLS policies, and player_profiles extensions"
```

---

## Task 2: Admin TypeScript Types

**Files:**
- Create: `web/src/types/admin.ts`
- Modify: `web/src/types/index.ts` — add `export * from './admin';` at the bottom (after line 179)

**Interfaces:**
- Produces: `ApplicationStatus`, `AdminRole`, `AuditAction`, `OwnerApplication`, `AdminAuditLog`, `Promotion`, `AdminStats`, `AdminUser` types consumed by all subsequent tasks.

- [ ] **Step 1: Create `web/src/types/admin.ts`**

```typescript
export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'more_info_requested';
export type AdminRole = 'super_admin' | 'moderator' | 'finance_admin';
export type AuditAction =
  | 'APPROVE_OWNER_APPLICATION' | 'REJECT_OWNER_APPLICATION' | 'REQUEST_REVISION'
  | 'BAN_USER' | 'UNBAN_USER' | 'PROMOTE_ADMIN' | 'DEMOTE_ADMIN'
  | 'CREATE_PROMO' | 'DEACTIVATE_PROMO' | 'UPDATE_PROMO';

export interface OwnerApplication {
  id: string;
  user_id: string;
  business_name: string;
  tax_id_or_reg_no?: string;
  contact_email: string;
  contact_phone: string;
  facility_name: string;
  facility_address: string;
  court_count: number;
  surface_type?: string;
  indoor_outdoor?: 'Indoor' | 'Outdoor' | 'Both';
  operating_hours?: string;
  additional_notes?: string;
  government_id_url?: string;
  business_license_url?: string;
  proof_of_ownership_url?: string;
  facility_photos_urls: string[];
  status: ApplicationStatus;
  rejection_reason?: string;
  revision_request_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined from player_profiles
  applicant?: { id: string; full_name: string; avatar_url?: string; email: string };
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  admin?: { full_name: string; avatar_url?: string };
}

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_booking_amount: number;
  max_uses?: number;
  current_uses: number;
  applicable_to: 'all' | 'new_users' | 'returning_users';
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_owners: number;
  active_facilities: number;
  pending_applications: number;
  total_revenue: number;
  bookings_today: number;
  bookings_this_month: number;
  active_promos: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  is_admin: boolean;
  admin_role?: AdminRole;
  verification_status: string;
  is_banned: boolean;
  banned_reason?: string;
  created_at: string;
}
```

- [ ] **Step 2: Add `export * from './admin';` to `web/src/types/index.ts`**
- [ ] **Step 3: Commit**

```bash
git add web/src/types/admin.ts web/src/types/index.ts
git commit -m "feat(types): add comprehensive admin TypeScript types"
```

---

## Task 3: AuthContext — Extend User Model with Admin Identity

**Files:**
- Modify: `web/src/contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: `player_profiles` columns `is_admin`, `admin_role`.
- Produces: Extended `UserRole` type including `"admin"`, `isAdmin` boolean on `User` interface.

**Why this is critical:** Without this, `AuthContext` will never detect admin accounts. The `RoleGate` and `ProtectedRoute` components that wrap every layout depend on `AuthContext.user.role`.

- [ ] **Step 1: Extend `UserRole` type (line 8) from `"player" | "owner" | "demo"` to `"player" | "owner" | "demo" | "admin"`**

- [ ] **Step 2: Add `isAdmin?: boolean` and `adminRole?: string` to the `User` interface**

- [ ] **Step 3: Update the profile select query (line 81) to include `is_admin, admin_role`**

Change:
```typescript
.select('role, verification_status, avatar_url, is_demo, facility_setup_complete')
```
To:
```typescript
.select('role, verification_status, avatar_url, is_demo, facility_setup_complete, is_admin, admin_role')
```

- [ ] **Step 4: Add admin role assignment logic after the existing demo/owner checks (after line 88)**

```typescript
// After: else if (isDemoUser) assignedRole = "demo";
// Add:
const isAdminUser = Boolean(profile?.is_admin);
if (isAdminUser) {
  // Admin users keep their base role for player capabilities but get flagged
  // We set role to "admin" so the UI knows to show admin features
  assignedRole = "admin";
}
```

- [ ] **Step 5: Add `isAdmin` and `adminRole` to the `userObj` construction (around line 94-106)**

```typescript
const userObj: User = {
  // ... existing fields ...
  isAdmin: isAdminUser,
  adminRole: profile?.admin_role ?? undefined,
  // Admin users are always treated as verified
  verificationStatus: ((assignedRole === "owner" || assignedRole === "demo" || assignedRole === "admin" || isDemoUser)
    ? "verified"
    : dbVerificationStatus) as VerificationStatus
};
```

- [ ] **Step 6: Commit**

```bash
git add web/src/contexts/AuthContext.tsx
git commit -m "feat(auth): extend AuthContext with admin identity detection"
```

---

## Task 4: Zustand Store — Admin State & Mode Toggle

**Files:**
- Modify: `web/src/store/useUserStore.ts`

**Interfaces:**
- Consumes: `player_profiles` columns `is_admin`, `admin_role`, `admin_permissions`.
- Produces: `isAdmin: boolean`, `adminRole: string | null`, `adminPermissions: string[]`, `adminMode: boolean`, `toggleAdminMode: () => void`.

- [ ] **Step 1: Extend `UserState` interface with `isAdmin`, `adminRole`, `adminPermissions`, `adminMode`, `toggleAdminMode`**

- [ ] **Step 2: Add initial values and `toggleAdminMode` action**

- [ ] **Step 3: Update `fetchUserStatus` select query to include `is_admin, admin_role, admin_permissions`**

- [ ] **Step 4: Add admin fields to the `set()` call inside `fetchUserStatus`**

- [ ] **Step 5: Update `UserRole` type to include `"admin"`**

- [ ] **Step 6: Update the role assignment logic to detect admin users**

- [ ] **Step 7: Commit**

```bash
git add web/src/store/useUserStore.ts
git commit -m "feat(store): extend useUserStore with admin identity and mode toggle"
```

---

## Task 5: Post-Login Redirect — Route Admins to `/app/admin`

**Files:**
- Modify: `web/src/hooks/useAuthForm.ts`

**Interfaces:**
- Consumes: `useUserStore` state `isAdmin`.
- Produces: Admin users are redirected to `/app/admin` after successful login instead of `/app`.

**Why this is critical:** Without this, admin accounts would land on the standard player dashboard after login, which contradicts the user's vision of "if admin account is inputted, show the admin console."

- [ ] **Step 1: Import `useUserStore` at the top of the file**

- [ ] **Step 2: Update `handleSuccessRedirect` (line 145-154) — add `adminState` check**

The redirect function runs inside a `setTimeout(800ms)`. By then, `InitUserStore` would have called `fetchUserStatus` which reads `is_admin` from the database. We use `useUserStore.getState()` (direct store access, not hook) inside the timeout to get the latest value:

```typescript
const handleSuccessRedirect = () => {
  setTimeout(async () => {
    const adminState = useUserStore.getState().isAdmin;
    const isInternalRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//');
    if (isInternalRedirect) router.push(redirect);
    else if (adminState) router.push("/app/admin");
    else if (intent === "owner") router.push("/app/owner");
    else if (intent === "book") router.push("/app");
    else if (intent === "open-play") router.push("/app/explore");
    else router.push("/app");
  }, 800);
};
```

> **EDGE CASE NOTE:** The 800ms delay gives `InitUserStore` time to run `fetchUserStatus`. If the Supabase query is slow, the store may not have `isAdmin = true` yet. Mitigation: the admin can always click the "Admin Console" badge from the player header. The middleware also protects `/app/admin` if a non-admin tries to access it directly.

- [ ] **Step 3: Commit**

```bash
git add web/src/hooks/useAuthForm.ts
git commit -m "feat(auth): route admin users to /app/admin after login"
```

---

## Task 6: Middleware — Admin Route Protection

**Files:**
- Modify: `web/src/middleware.ts`

- [ ] **Step 1: Add `/app/admin` protection block**

This block MUST appear BEFORE the existing `/app/owner` block because URL path matching is sequential. `/app/admin` starts with `/app` so it would be caught by general checks first.

```typescript
// Admin route protection — placed BEFORE /app/owner block
if (pathname.startsWith('/app/admin')) {
  try {
    const adminCheckPromise = supabase
      .from('player_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const adminTimeout = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null }), 1200)
    );

    const { data: adminData } = await Promise.race([adminCheckPromise, adminTimeout]);

    if (!adminData?.is_admin) {
      const url = request.nextUrl.clone();
      url.pathname = '/app';
      return NextResponse.redirect(url);
    }
  } catch (e) {
    // Fail open on timeout — server-side API routes still enforce admin check
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/middleware.ts
git commit -m "feat(middleware): protect /app/admin routes with is_admin check"
```

---

## Task 7: AdminGate & RoleGate Update

**Files:**
- Create: `web/src/components/shared/AdminGate.tsx`
- Modify: `web/src/components/shared/RoleGate.tsx`

**Interfaces:**
- Consumes: `useAuth()` context `user.isAdmin`.
- Produces: `<AdminGate>` component that renders children only if user is admin.

- [ ] **Step 1: Create `AdminGate.tsx`**

```typescript
"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      router.replace('/app');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) return null;
  if (!user.isAdmin) return null;

  return <>{children}</>;
}
```

- [ ] **Step 2: Update `RoleGate.tsx` (line 15) — allow admin users to access all role-gated routes**

```typescript
// Before: const allowedRoles = role === 'owner' ? ['owner', 'demo'] : [role];
// After:
const allowedRoles = role === 'owner' ? ['owner', 'demo', 'admin'] : [role, 'admin'];
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/shared/AdminGate.tsx web/src/components/shared/RoleGate.tsx
git commit -m "feat(auth): add AdminGate component and extend RoleGate for admin access"
```

---

## Task 8: Server-Side Admin Helpers

**Files:**
- Create: `web/src/app/api/admin/_lib/requireAdmin.ts`
- Create: `web/src/app/api/admin/_lib/sendAdminEmail.ts`

- [ ] **Step 1: Create `requireAdmin.ts`** — accepts `SupabaseClient`, verifies `auth.getUser()`, then checks `is_admin` on `player_profiles`. Returns `{ adminId: string }` on success, or `NextResponse` with 401/403.

- [ ] **Step 2: Create `sendAdminEmail.ts`**

**Why a separate email helper:** The existing `/api/email` route (line 43-44 of `route.ts`) restricts the recipient to the authenticated user's own email address for security. Admin notifications need to send emails TO applicants (different people), so we need a direct Resend SDK call server-side.

```typescript
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendAdminEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY not configured — email not sent');
    return false;
  }
  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Picklers <onboarding@resend.dev>';
    await resend.emails.send({ from: fromAddress, to, subject, text: body });
    return true;
  } catch (err) {
    console.error('Admin email send error:', err);
    return false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/admin/_lib/
git commit -m "feat(api): add requireAdmin and sendAdminEmail server-side helpers"
```

---

## Task 9: Admin API — Owner Applications Endpoints

**Files:**
- Create: `web/src/app/api/admin/applications/route.ts`
- Create: `web/src/app/api/admin/applications/[id]/route.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, `sendAdminEmail()`, `owner_applications` table, `player_profiles` table.
- Produces:
  - `GET /api/admin/applications?status=pending` → `OwnerApplication[]` with joined applicant profile
  - `GET /api/admin/applications/:id` → single `OwnerApplication`
  - `PATCH /api/admin/applications/:id` with body `{ action: 'approve' | 'reject' | 'request_revision', rejection_reason?, revision_request_note? }`

- [ ] **Step 1: Create `route.ts`** — GET handler with optional `?status=` filter, orders by `created_at DESC`, joins `applicant:player_profiles!user_id(id, full_name, avatar_url, email)`

- [ ] **Step 2: Create `[id]/route.ts`** — PATCH handler:
  1. Calls `requireAdmin(supabase)` → returns 401/403 if unauthorized
  2. Fetches the application to get `user_id`, `contact_email`, `facility_name`
  3. Validates action is one of `approve`, `reject`, `request_revision`
  4. Maps action to status: `approve` → `approved`, `reject` → `rejected`, `request_revision` → `more_info_requested`
  5. Updates `owner_applications` record with new status, `reviewed_by = adminId`, `reviewed_at = new Date().toISOString()`, and optional `rejection_reason` / `revision_request_note`
  6. **If action is `approve`:** Updates `player_profiles` to set `role = 'owner'` and `verification_status = 'verified'` for the applicant. This is the role upgrade that unlocks the Owner Portal.
  7. Inserts row into `admin_audit_logs` with `admin_id`, `action` (mapped to AuditAction enum), `target_type: 'owner_application'`, `target_id`, `metadata` (includes `facility_name`, `rejection_reason`, `applicant_email`), `ip_address` from `x-forwarded-for` header
  8. Calls `sendAdminEmail()` with templated email:
     - Approve: `"Congratulations! Your facility [name] has been approved on Picklers 🎉"`
     - Reject: `"Your application for [name] was not approved. Reason: [reason]. You may re-apply."`
     - Revision: `"We need additional information for your [name] application: [note]"`
  9. Returns `{ success: true, status: newStatus }`

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/admin/applications/
git commit -m "feat(api): implement owner applications list and approve/reject/revision endpoints"
```

---

## Task 10: Admin API — User Moderation Endpoints

**Files:**
- Create: `web/src/app/api/admin/users/route.ts`
- Create: `web/src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Create `route.ts`** — GET with `?search=`, `?role=`, `?page=` (20 per page). Searches by `full_name ILIKE %search%` or `email ILIKE %search%`. Returns `{ data: AdminUser[], total: number }`.

- [ ] **Step 2: Create `[id]/route.ts`** — PATCH with `{ action: 'ban' | 'unban' | 'promote_admin' | 'demote_admin', reason?, admin_role? }`.
  - `ban`: Sets `is_banned = true`, `banned_reason = reason`, `banned_at = NOW()`. Logs to audit with `action: 'BAN_USER'`.
  - `unban`: Sets `is_banned = false`, `banned_reason = null`, `banned_at = null`. Logs to audit with `action: 'UNBAN_USER'`.
  - `promote_admin`: Sets `is_admin = true`, `admin_role = admin_role`. Logs to audit with `action: 'PROMOTE_ADMIN'`.
  - `demote_admin`: Sets `is_admin = false`, `admin_role = null`, `admin_permissions = '{}'`. Logs to audit with `action: 'DEMOTE_ADMIN'`.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api/admin/users/
git commit -m "feat(api): implement user moderation ban/unban/promote endpoints"
```

---

## Task 11: Admin API — Promotions, Analytics, Audit Log

**Files:**
- Create: `web/src/app/api/admin/promotions/route.ts`
- Create: `web/src/app/api/admin/promotions/[id]/route.ts`
- Create: `web/src/app/api/admin/analytics/route.ts`
- Create: `web/src/app/api/admin/audit-log/route.ts`

- [ ] **Step 1: Promotions routes**
  - GET: List all promos, ordered by `created_at DESC`
  - POST: Create promo — validates `code` uniqueness (try insert, handle unique constraint error), logs `CREATE_PROMO` to audit
  - PATCH `[id]`: Toggle `is_active`, update fields. Logs `DEACTIVATE_PROMO` or `UPDATE_PROMO` to audit.

- [ ] **Step 2: Analytics route** — GET aggregates:
  - `total_users`: `SELECT COUNT(*) FROM player_profiles`
  - `total_owners`: `SELECT COUNT(*) FROM player_profiles WHERE role = 'owner'`
  - `pending_applications`: `SELECT COUNT(*) FROM owner_applications WHERE status = 'pending'`
  - `active_promos`: `SELECT COUNT(*) FROM promotions WHERE is_active = TRUE`
  - `active_facilities`, `total_revenue`, `bookings_today`, `bookings_this_month`: Placeholder values if tables don't exist yet, or real aggregates if `bookings`/`facilities` tables are present.

- [ ] **Step 3: Audit log route** — GET with optional filters `?action=`, `?admin_id=`, `?from=`, `?to=`, `?page=`. Joins `admin:player_profiles!admin_id(full_name, avatar_url)`. Orders by `created_at DESC`. 25 per page.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/api/admin/promotions/ web/src/app/api/admin/analytics/ web/src/app/api/admin/audit-log/
git commit -m "feat(api): implement promotions CRUD, analytics aggregation, and audit log"
```

---

## Task 12: Admin Header Badge (Mode Switcher)

**Files:**
- Create: `web/src/components/admin/AdminHeaderBadge.tsx`
- Modify: `web/src/app/(player)/app/layout.tsx` — import and render `<AdminHeaderBadge />`

- [ ] **Step 1: Create `AdminHeaderBadge.tsx`** — Renders only when `isAdmin === true` (from `useUserStore`). Shows "Admin Console" or "Player View" toggle. Clicking navigates via `router.push` and calls `toggleAdminMode()`.

- [ ] **Step 2: Mount in player layout** — Place `<AdminHeaderBadge />` in the player header bar (both desktop sidebar header area and mobile top header). Renders `null` for non-admin users so it's invisible.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/AdminHeaderBadge.tsx web/src/app/(player)/app/layout.tsx
git commit -m "feat(ui): add AdminHeaderBadge mode switcher in player layout"
```

---

## Task 13: Admin Console Layout & Sidebar

**Files:**
- Create: `web/src/components/admin/AdminSidebar.tsx`
- Create: `web/src/app/(admin)/app/admin/layout.tsx`

**Pattern to mirror:** Owner layout at `web/src/app/(owner)/app/owner/layout.tsx` (298 lines). The admin layout should follow the exact same structural pattern:
- Desktop: sidebar (`<aside>`) + main content with `<AnimatePresence>` page transitions
- Mobile: sticky top header + bottom nav bar
- Logout: confirmation modal identical to owner (lines 266-291)
- Footer: User avatar card + "Switch to Player View" button

- [ ] **Step 1: Create `AdminSidebar.tsx`** — Navigation tabs:

| Tab ID | Label | Path | Icon |
|---|---|---|---|
| `admin-overview` | Overview | `/app/admin` | `LayoutDashboard` |
| `admin-applications` | Applications | `/app/admin/applications` | `FileText` |
| `admin-users` | Users | `/app/admin/users` | `Users` |
| `admin-analytics` | Analytics | `/app/admin/analytics` | `BarChart3` |
| `admin-promotions` | Promotions | `/app/admin/promotions` | `Tag` |
| `admin-audit-log` | Audit Log | `/app/admin/audit-log` | `ScrollText` |

Active tab indicator: `motion.div` with `layoutId="admin-sidebar-active-pill"` and emerald background (`var(--accent-primary)`).

- [ ] **Step 2: Create `layout.tsx`** — Structure:
  ```
  <ProtectedRoute>
    <AdminGate>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <aside>
          <AdminSidebar />
          <div> "Switch to Player View" + Logout + Avatar card </div>
        </aside>
        {/* Main content */}
        <main>
          {/* Mobile header: Logo + "Admin Console" subtitle */}
          <AdminCommandPalette />
          <AnimatePresence mode="wait">
            <motion.div key={pathname}>{children}</motion.div>
          </AnimatePresence>
        </main>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0">...</nav>
      </div>
    </AdminGate>
  </ProtectedRoute>
  ```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/AdminSidebar.tsx web/src/app/(admin)/
git commit -m "feat(ui): add admin console layout with sidebar, mobile nav, and logout modal"
```

---

## Task 14: Admin Overview Dashboard Page

**Files:**
- Create: `web/src/components/admin/StatCard.tsx`
- Create: `web/src/app/(admin)/app/admin/page.tsx`

- [ ] **Step 1: Create `StatCard.tsx`** — Props: `label`, `value`, `icon`, `color`, `trend?`, `pulse?`. Glassmorphic card with hover `scale-[1.02]`. If `pulse` is true and value > 0, show pulsing amber dot (for pending applications).

- [ ] **Step 2: Create `page.tsx`** — Fetches `GET /api/admin/analytics` on mount. Renders:
  - 6-card KPI grid: Total Users, Total Owners, Pending Applications (pulse if > 0), Active Facilities, Bookings Today, Active Promos
  - "Recent Pending Applications" — latest 5 pending applications with avatar + facility name + date. Each clickable → `/app/admin/applications`
  - Quick-action buttons: "Review Applications" → `/app/admin/applications`, "Manage Users" → `/app/admin/users`

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/StatCard.tsx web/src/app/(admin)/app/admin/page.tsx
git commit -m "feat(ui): implement admin overview dashboard with KPI stats"
```

---

## Task 15: Owner Application Queue Page

**Files:**
- Create: `web/src/components/admin/ApplicationCard.tsx`
- Create: `web/src/components/admin/ApplicationDetailDrawer.tsx`
- Create: `web/src/components/admin/RejectApplicationModal.tsx`
- Create: `web/src/app/(admin)/app/admin/applications/page.tsx`

- [ ] **Step 1: Create `ApplicationCard.tsx`** — Props: `application: OwnerApplication`, `onClick`. Renders: applicant avatar + name, facility name, date, status pill.

- [ ] **Step 2: Create `RejectApplicationModal.tsx`** — `AnimatePresence` modal:
  - Dropdown: preset reasons (Incomplete Documents, Invalid Business License, Unverified Identity, Duplicate Facility, Location Mismatch, Custom Reason)
  - `<textarea>` for custom notes
  - Cancel + "Confirm Rejection" buttons
  - Calls `PATCH` and shows error toast on failure

- [ ] **Step 3: Create `ApplicationDetailDrawer.tsx`** — Slide-in from right:
  - Section 1: Applicant profile
  - Section 2: Facility details
  - Section 3: Uploaded documents (inline `<img>` for images, `<iframe>` for PDFs, zoom toggle, download link)
  - Section 4: Action buttons (Approve / Request Revision / Reject)

- [ ] **Step 4: Create `page.tsx`** — Filter tabs (All, Pending, Approved, Rejected, Needs Info) with badge counts. Renders `ApplicationCard` grid. Click opens `ApplicationDetailDrawer`.

- [ ] **Step 5: Wire toasts and state refresh** — After any action completes, refetch the application list. Show appropriate toast.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/(admin)/app/admin/applications/ web/src/components/admin/
git commit -m "feat(ui): implement application queue with detail drawer and reject modal"
```

---

## Task 16: User Moderation Hub Page

**Files:**
- Create: `web/src/app/(admin)/app/admin/users/page.tsx`

- [ ] **Step 1: Create `page.tsx`** — Search bar + role filter + user table + actions menu + ban reason modal + pagination.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(admin)/app/admin/users/
git commit -m "feat(ui): implement user moderation hub page"
```

---

## Task 17: Executive Analytics BI Dashboard Page

**Files:**
- Create: `web/src/app/(admin)/app/admin/analytics/page.tsx`

- [ ] **Step 1: Create `page.tsx`** — 4 large StatCards + Top 5 Facilities leaderboard + activity summary.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(admin)/app/admin/analytics/
git commit -m "feat(ui): implement executive analytics BI dashboard"
```

---

## Task 18: Promotions & Marketing Engine Page

**Files:**
- Create: `web/src/components/admin/PromoForm.tsx`
- Create: `web/src/app/(admin)/app/admin/promotions/page.tsx`

- [ ] **Step 1: Create `PromoForm.tsx`** — `react-hook-form` + Zod validated form for creating promo codes.

- [ ] **Step 2: Create `page.tsx`** — "Create Promo" button opens form modal. Below: promo table with deactivate buttons.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/admin/PromoForm.tsx web/src/app/(admin)/app/admin/promotions/
git commit -m "feat(ui): implement promotions and marketing engine"
```

---

## Task 19: Audit Log Page

**Files:**
- Create: `web/src/app/(admin)/app/admin/audit-log/page.tsx`

- [ ] **Step 1: Create `page.tsx`** — Filter bar + immutable read-only table. NO edit or delete controls.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(admin)/app/admin/audit-log/
git commit -m "feat(ui): implement immutable admin audit log page"
```

---

## Task 20: Global Command Palette (`Cmd + K`)

**Files:**
- Create: `web/src/components/admin/AdminCommandPalette.tsx`

- [ ] **Step 1: Create `AdminCommandPalette.tsx`** — Triggered by `Cmd+K` / `Ctrl+K`. Search input with debounce. Grouped results (Navigation, Applications, Users). Mounted inside admin layout.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/admin/AdminCommandPalette.tsx
git commit -m "feat(ui): add Cmd+K command palette for admin console"
```

---

## Task 21: Migrate Player Owner Application Form to `owner_applications` Table

**Files:**
- Modify: `web/src/app/(player)/app/owner-application/page.tsx`

**Why this is critical:** The existing player owner-application form (line 238) inserts into `facility_applications`, but the admin system reads from `owner_applications`. Without this migration, the admin application queue will be EMPTY — approved/rejected/revision actions will never work.

- [ ] **Step 1: Update the Supabase insert call (line 238)**

Change:
```typescript
const { error } = await supabase.from('facility_applications').insert({
  user_id: user?.id || null,
  facility_name: data.facilityName,
  address: data.address,
  courts_count: data.courtsCount,
  surface_type: data.surfaceType,
  first_name: data.firstName,
  last_name: data.lastName,
  email: data.email,
  phone: data.phone,
  business_permit_url: permitUrl,
  proof_of_identity_url: idUrl,
  status: 'pending'
});
```

To:
```typescript
const { error } = await supabase.from('owner_applications').insert({
  user_id: user?.id || null,
  facility_name: data.facilityName,
  facility_address: data.address,
  court_count: data.courtsCount,
  surface_type: data.surfaceType,
  business_name: data.facilityName, // Use facility name as default business name
  contact_email: data.email,
  contact_phone: data.phone,
  government_id_url: idUrl,
  business_license_url: permitUrl,
  status: 'pending'
});
```

> **NOTE:** Field mapping changes: `address` → `facility_address`, `courts_count` → `court_count`, `first_name`/`last_name` → absorbed into `business_name`, `email` → `contact_email`, `phone` → `contact_phone`, `business_permit_url` → `business_license_url`, `proof_of_identity_url` → `government_id_url`.

- [ ] **Step 2: Commit**

```bash
git add web/src/app/(player)/app/owner-application/page.tsx
git commit -m "fix(owner-app): migrate application form from facility_applications to owner_applications"
```

---

## Dependency Graph

```
Task 1 (DB Migration)
  └── Task 2 (Types)
        ├── Task 3 (AuthContext) ──┐
        │     └── Task 5 (useAuthForm redirect)
        ├── Task 4 (Zustand Store) ─┤
        │                           └── Task 12 (HeaderBadge)
        ├── Task 7 (AdminGate) ────── Task 13 (Layout + Sidebar)
        │                               ├── Task 14 (Overview)
        │                               ├── Task 15 (Applications Queue)
        │                               ├── Task 16 (Users Moderation)
        │                               ├── Task 17 (Analytics BI)
        │                               ├── Task 18 (Promotions)
        │                               ├── Task 19 (Audit Log)
        │                               └── Task 20 (Cmd+K Palette)
        ├── Task 6 (Middleware)
        └── Task 8 (API Helpers) ──── Task 9 (Applications API)
                                   ├── Task 10 (Users API)
                                   └── Task 11 (Promos/Analytics/Audit API)
Task 21 (Migrate owner-application form) ← Can run in parallel with Tasks 3-20
```

---

## Verification Plan

### Security Checks
1. **Non-admin route block:** Log in as a regular player → Navigate to `/app/admin` → Confirm redirect to `/app`.
2. **Admin badge visibility:** Log in as admin → Confirm "Admin Console" badge appears in the player header.
3. **API auth enforcement:** Call `PATCH /api/admin/applications/:id` from a non-admin session → Confirm `403 Forbidden`.
4. **RLS enforcement:** Attempt to query `admin_audit_logs` as a non-admin via Supabase client → Confirm empty result.

### Login Flow
5. **Regular player login:** Enter player credentials at `/auth` → Confirm redirect to `/app` (standard player dashboard).
6. **Admin login:** Enter admin credentials at `/auth` → Confirm redirect to `/app/admin` (admin console).
7. **Owner login:** Enter owner credentials at `/auth` → Confirm redirect to `/app/owner` (owner portal, unchanged).

### Owner Application Workflow (End-to-End)
8. Log in as a regular player → Submit owner application → Confirm row appears in `owner_applications` table with `status = 'pending'`.
9. Log in as admin → Open Applications queue → Confirm the submitted application appears under "Pending" tab.
10. Click on application → Confirm detail drawer opens showing all fields and uploaded documents.
11. Click **Approve** → Confirm dialog → Confirm: status → `approved`, player role → `owner` in database, emerald toast, row in `admin_audit_logs`, email sent to applicant.
12. Submit another application → Click **Reject** with reason "Invalid Business License" → Confirm: status → `rejected`, reason saved, red toast, audit log row, email sent.
13. Submit another application → Click **Request Revision** with note → Confirm: status → `more_info_requested`, note saved, audit log row, email sent.

### Mode Switching
14. As admin in Admin Console → Click "Player View" → Confirm URL changes to `/app`, all player features (booking, matches, community, chat) work normally.
15. Click "Admin Console" from player view → Confirm return to `/app/admin`.

### User Moderation
16. Search for a user by email → Click Ban → Enter reason → Confirm `is_banned = true` in database, audit log row created.
17. Click Unban → Confirm `is_banned = false`, audit log row created.

### Promotions
18. Create promo `PICKLE20` (20% off, 100 max uses, 30-day expiry) → Confirm it appears in table with status "Active".
19. Click Deactivate → Confirm `is_active = false`, audit log row created.

### Command Palette
20. Press `Cmd+K` / `Ctrl+K` anywhere in Admin Console → Confirm search palette opens.
21. Press `Escape` → Confirm palette closes.

### Audit Log Integrity
22. Open Audit Log page → Confirm all actions from steps 11-19 appear with correct admin ID, action type, and timestamp. Confirm NO Edit or Delete controls exist.
