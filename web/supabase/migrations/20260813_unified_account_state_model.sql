-- ============================================================================
-- Unified Account State Model Migration
-- Migration: 20260813_unified_account_state_model.sql
-- ============================================================================

-- 1. Extend player_profiles table with account_status and dev_role
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  ADD COLUMN IF NOT EXISTS dev_role TEXT DEFAULT NULL;

ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_dev_role_check;
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_dev_role_check
  CHECK (dev_role IS NULL OR dev_role IN (
    'super_developer', 'lead_dev', 'lead_architect', 'platform_engineer', 
    'sre_devops', 'backend_engineer', 'frontend_engineer', 'security_engineer', 
    'developer_viewer', 'developer', 'senior_dev', 'qa_engineer'
  ));

-- Update admin_role constraint to include full set of roles
ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_admin_role_check;
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_admin_role_check 
  CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'platform_admin', 'operations_admin', 'finance_admin', 'moderator', 'content_manager', 'analytics_viewer'));

-- 2. Normalize existing accounts
UPDATE public.player_profiles
SET account_status = 'suspended'
WHERE is_banned = TRUE AND account_status = 'active';

UPDATE public.player_profiles
SET console_access = ARRAY['player', 'admin']
WHERE (is_admin = TRUE OR role = 'admin') AND (role IS NULL OR role != 'dev')
  AND NOT ('admin' = ANY(console_access));

UPDATE public.player_profiles
SET console_access = ARRAY['player', 'dev']
WHERE role = 'dev' AND (is_admin IS NOT TRUE AND role != 'admin')
  AND NOT ('dev' = ANY(console_access));

UPDATE public.player_profiles
SET console_access = ARRAY['player', 'admin', 'dev']
WHERE (is_admin = TRUE OR role = 'admin') AND role = 'dev'
  AND NOT ('dev' = ANY(console_access));

-- 3. Security & Helper Functions
CREATE OR REPLACE FUNCTION public.has_console_access(target_console TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = auth.uid() 
      AND COALESCE(account_status, 'active') = 'active'
      AND COALESCE(is_banned, false) = false
      AND target_console = ANY(console_access)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.has_console_access('admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS BOOLEAN AS $$
  SELECT public.has_console_access('dev');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Update Developer Console RLS Policies to use is_dev()
DROP POLICY IF EXISTS "dev_audit_log_select" ON public.developer_audit_logs;
CREATE POLICY "dev_audit_log_select" ON public.developer_audit_logs FOR SELECT USING (public.is_dev());

DROP POLICY IF EXISTS "dev_audit_log_insert" ON public.developer_audit_logs;
CREATE POLICY "dev_audit_log_insert" ON public.developer_audit_logs FOR INSERT WITH CHECK (public.is_dev());

DROP POLICY IF EXISTS "feature_flags_manage" ON public.feature_flags;
CREATE POLICY "feature_flags_manage" ON public.feature_flags FOR ALL USING (public.is_dev());
