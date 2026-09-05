-- ============================================================================
-- Developer Console System Tables & RLS Policies
-- Migration: 20260812_create_dev_console_system.sql
-- ============================================================================

-- 1. developer_audit_logs — immutable technical operation ledger
CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID        NOT NULL REFERENCES public.player_profiles(id),
  action       TEXT        NOT NULL,
  category     TEXT        NOT NULL DEFAULT 'system',
  environment  TEXT        NOT NULL DEFAULT 'development',
  target_type  TEXT,
  target_id    TEXT,
  details      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. feature_flags — runtime feature management
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 TEXT        UNIQUE NOT NULL,
  name                TEXT        NOT NULL,
  description         TEXT,
  is_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
  environment         TEXT        NOT NULL DEFAULT 'production',
  rollout_percentage  INTEGER     NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  targeting_rules     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_by          UUID        REFERENCES public.player_profiles(id),
  updated_by          UUID        REFERENCES public.player_profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_audit_log_select" ON public.developer_audit_logs;
CREATE POLICY "dev_audit_log_select" ON public.developer_audit_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "dev_audit_log_insert" ON public.developer_audit_logs;
CREATE POLICY "dev_audit_log_insert" ON public.developer_audit_logs FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "feature_flags_select" ON public.feature_flags;
CREATE POLICY "feature_flags_select" ON public.feature_flags FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "feature_flags_manage" ON public.feature_flags;
CREATE POLICY "feature_flags_manage" ON public.feature_flags FOR ALL USING (public.is_admin());
