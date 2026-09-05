-- ============================================================================
-- Foreign Key B-Tree Index Optimization Migration
-- Migration: 20260814_add_fk_indexes.sql
-- ============================================================================

-- 1. Indexes for owner_applications
CREATE INDEX IF NOT EXISTS idx_owner_applications_user_id ON public.owner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_applications_reviewed_by ON public.owner_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_owner_applications_status ON public.owner_applications(status);

-- 2. Indexes for admin_audit_logs
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_id ON public.admin_audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- 3. Indexes for developer_audit_logs
CREATE INDEX IF NOT EXISTS idx_developer_audit_logs_developer_id ON public.developer_audit_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_developer_audit_logs_created_at ON public.developer_audit_logs(created_at DESC);

-- 4. Indexes for player_profiles console access queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_account_status ON public.player_profiles(account_status);
