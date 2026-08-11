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
CREATE TABLE IF NOT EXISTS public.owner_applications (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  business_name          TEXT        NOT NULL,
  tax_id_or_reg_no       TEXT,
  contact_email          TEXT        NOT NULL,
  contact_phone          TEXT        NOT NULL,
  facility_name          TEXT        NOT NULL,
  facility_address       TEXT        NOT NULL,
  court_count            INTEGER     NOT NULL DEFAULT 1 CHECK (court_count >= 1),
  surface_type           TEXT,
  indoor_outdoor         TEXT        CHECK (indoor_outdoor IN ('Indoor', 'Outdoor', 'Both')),
  operating_hours        TEXT,
  additional_notes       TEXT,
  government_id_url      TEXT,
  business_license_url   TEXT,
  proof_of_ownership_url TEXT,
  facility_photos_urls   TEXT[]      NOT NULL DEFAULT '{}',
  status                 TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'more_info_requested')),
  rejection_reason       TEXT,
  revision_request_note  TEXT,
  reviewed_by            UUID        REFERENCES public.player_profiles(id),
  reviewed_at            TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_owner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_owner_applications_updated_at ON public.owner_applications;
CREATE TRIGGER trg_owner_applications_updated_at
  BEFORE UPDATE ON public.owner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_owner_applications_updated_at();

-- 3. admin_audit_logs — immutable ledger
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

-- Row Level Security
ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions         ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin' OR role = 'dev')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "owner_app_select" ON public.owner_applications;
CREATE POLICY "owner_app_select"  ON public.owner_applications FOR SELECT  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "owner_app_insert" ON public.owner_applications;
CREATE POLICY "owner_app_insert"  ON public.owner_applications FOR INSERT  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "owner_app_update" ON public.owner_applications;
CREATE POLICY "owner_app_update"  ON public.owner_applications FOR UPDATE  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_log_select" ON public.admin_audit_logs;
CREATE POLICY "audit_log_select"  ON public.admin_audit_logs FOR SELECT  USING (public.is_admin());

DROP POLICY IF EXISTS "audit_log_insert" ON public.admin_audit_logs;
CREATE POLICY "audit_log_insert"  ON public.admin_audit_logs FOR INSERT  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promo_select" ON public.promotions;
CREATE POLICY "promo_select"      ON public.promotions FOR SELECT USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "promo_insert" ON public.promotions;
CREATE POLICY "promo_insert"      ON public.promotions FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "promo_update" ON public.promotions;
CREATE POLICY "promo_update"      ON public.promotions FOR UPDATE USING (public.is_admin());
