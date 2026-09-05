-- =============================================
-- ADMIN CONSOLE REMEDIATION SCHEMA
-- =============================================

-- 1. Persistent Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_by UUID        REFERENCES public.player_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value) VALUES
  ('platform_fee_percent', '10'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('auto_verify_owners', 'false'::jsonb),
  ('max_booking_advance_days', '14'::jsonb),
  ('allow_demo_accounts', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON public.platform_settings;
CREATE POLICY "settings_select" ON public.platform_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "settings_update" ON public.platform_settings;
CREATE POLICY "settings_update" ON public.platform_settings FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "settings_insert" ON public.platform_settings;
CREATE POLICY "settings_insert" ON public.platform_settings FOR INSERT WITH CHECK (public.is_admin());

-- 2. Moderation Columns on feed_posts and posts tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feed_posts') THEN
    ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
    ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.player_profiles(id);
    ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderation_note TEXT DEFAULT NULL;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.player_profiles(id);
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- 3. Payout Batches Table
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by    UUID          NOT NULL REFERENCES public.player_profiles(id),
  triggered_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  recipient_count INTEGER       NOT NULL DEFAULT 0,
  status          TEXT          NOT NULL DEFAULT 'completed' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  metadata        JSONB         NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_select" ON public.payout_batches;
CREATE POLICY "payout_select" ON public.payout_batches FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "payout_insert" ON public.payout_batches;
CREATE POLICY "payout_insert" ON public.payout_batches FOR INSERT WITH CHECK (public.is_admin());
