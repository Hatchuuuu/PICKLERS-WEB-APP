-- ============================================================================
-- RBAC & Console Access Migration
-- Migration: 20260812_rbac_and_dev_console.sql
-- ============================================================================

-- 1. Add console_access and permissions columns to player_profiles
ALTER TABLE public.player_profiles 
  ADD COLUMN IF NOT EXISTS console_access TEXT[] NOT NULL DEFAULT '{player}'::text[],
  ADD COLUMN IF NOT EXISTS permissions    TEXT[] NOT NULL DEFAULT '{}'::text[];

-- 2. Migrate existing admin and dev roles to explicit console_access arrays
UPDATE public.player_profiles
SET console_access = ARRAY['player', 'admin']
WHERE (is_admin = TRUE OR role = 'admin') AND (role IS NULL OR role != 'dev');

UPDATE public.player_profiles
SET console_access = ARRAY['player', 'dev']
WHERE role = 'dev' AND (is_admin IS NOT TRUE AND role != 'admin');

UPDATE public.player_profiles
SET console_access = ARRAY['player', 'admin', 'dev']
WHERE (is_admin = TRUE OR role = 'admin') AND role = 'dev';
