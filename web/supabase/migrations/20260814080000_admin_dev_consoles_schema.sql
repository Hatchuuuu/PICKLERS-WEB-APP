-- ==============================================================================
-- ADMIN & DEVELOPER CONSOLES EXTENSION SCHEMA
-- platform_settings, feature_flags, developer_audit_logs, dev_role column
-- ==============================================================================

-- 1. Ensure dev_role column exists on player_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'player_profiles' 
      AND column_name = 'dev_role'
  ) THEN
    ALTER TABLE public.player_profiles ADD COLUMN dev_role TEXT;
  END IF;
END $$;

-- 2. platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default platform settings if not present
INSERT INTO public.platform_settings (key, value)
VALUES
  ('platform_fee_percent', '10'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('auto_verify_owners', 'false'::jsonb),
  ('max_booking_advance_days', '14'::jsonb),
  ('allow_demo_accounts', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  environment TEXT NOT NULL DEFAULT 'production',
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  targeting_rules JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. developer_audit_logs table
CREATE TABLE IF NOT EXISTS public.developer_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  environment TEXT NOT NULL DEFAULT 'production',
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_dev_audit_developer ON public.developer_audit_logs(developer_id);
CREATE INDEX IF NOT EXISTS idx_dev_audit_created_at ON public.developer_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_all" ON public.platform_settings;
CREATE POLICY "platform_settings_all" ON public.platform_settings FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "feature_flags_all" ON public.feature_flags;
CREATE POLICY "feature_flags_all" ON public.feature_flags FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "developer_audit_logs_all" ON public.developer_audit_logs;
CREATE POLICY "developer_audit_logs_all" ON public.developer_audit_logs FOR ALL USING (TRUE);
