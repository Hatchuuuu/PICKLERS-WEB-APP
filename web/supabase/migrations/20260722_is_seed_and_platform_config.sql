-- =====================================================================
-- MIGRATION: is_seed + platform_config + Updated RLS Policies
-- 2026-07-22 — Account Architecture Phase 1
-- =====================================================================
-- Three data universes isolated by boolean flags:
--   is_demo = true  → permanent demo sandbox (demo + admin only)
--   is_seed = true  → cold-start data (all real users while seed_data_active=true)
--   both false      → real production data
-- =====================================================================

-- 1. ADD is_seed COLUMN TO ALL AFFECTED TABLES
ALTER TABLE public.player_profiles   ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.facilities        ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.courts            ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.matches           ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.clubs             ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.club_members      ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_posts        ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_comments     ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_likes        ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.direct_messages   ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.bookings          ADD COLUMN IF NOT EXISTS is_seed BOOLEAN DEFAULT false NOT NULL;

-- -----------------------------------------------------------------------
-- 2. CREATE platform_config TABLE (single-row config, enforced by CHECK)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_config (
  id                                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  seed_data_active                  BOOLEAN NOT NULL DEFAULT true,
  seed_cleanup_threshold_users      INTEGER NOT NULL DEFAULT 20,
  seed_cleanup_threshold_facilities INTEGER NOT NULL DEFAULT 5,
  seed_purged_at                    TIMESTAMPTZ,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the config row (idempotent)
INSERT INTO public.platform_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Enable RLS (only admins can read/write; pg_cron uses service_role which bypasses RLS)
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_config_admin_all" ON public.platform_config;
CREATE POLICY "platform_config_admin_all" ON public.platform_config
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- -----------------------------------------------------------------------
-- 3. CREATE is_seed_visible() HELPER FUNCTION
-- STABLE: result may be cached per transaction for performance
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_seed_visible()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT seed_data_active FROM public.platform_config WHERE id = 1 LIMIT 1),
    true  -- default to visible if config row is missing (safe fallback)
  );
$$;

COMMENT ON FUNCTION public.is_seed_visible() IS
  'Returns true while cold-start seed data should be visible to real users. '
  'Automatically returns false after the threshold cleanup runs.';

-- -----------------------------------------------------------------------
-- 4. UPDATED RLS SELECT POLICIES
-- Pattern: admin sees all | demo sees is_demo rows | real users see
--          real rows + seed rows (while is_seed_visible())
-- -----------------------------------------------------------------------

-- FACILITIES
DROP POLICY IF EXISTS "Allow public read access on facilities" ON public.facilities;
DROP POLICY IF EXISTS "facilities_rbac_select" ON public.facilities;
CREATE POLICY "facilities_rbac_select" ON public.facilities FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- COURTS
DROP POLICY IF EXISTS "Allow public read access on courts" ON public.courts;
DROP POLICY IF EXISTS "courts_rbac_select" ON public.courts;
CREATE POLICY "courts_rbac_select" ON public.courts FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- MATCHES
DROP POLICY IF EXISTS "Matches are viewable by everyone." ON public.matches;
DROP POLICY IF EXISTS "matches_rbac_select" ON public.matches;
CREATE POLICY "matches_rbac_select" ON public.matches FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- PLAYER PROFILES (own row always visible regardless of flags)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.player_profiles;
DROP POLICY IF EXISTS "profiles_rbac_select" ON public.player_profiles;
CREATE POLICY "profiles_rbac_select" ON public.player_profiles FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR auth.uid() = id
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- CLUBS
DROP POLICY IF EXISTS "clubs_rbac_select" ON public.clubs;
CREATE POLICY "clubs_rbac_select" ON public.clubs FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- CLUB MEMBERS
DROP POLICY IF EXISTS "club_members_rbac_select" ON public.club_members;
CREATE POLICY "club_members_rbac_select" ON public.club_members FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED POSTS
DROP POLICY IF EXISTS "feed_posts_rbac_select" ON public.feed_posts;
CREATE POLICY "feed_posts_rbac_select" ON public.feed_posts FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED COMMENTS
DROP POLICY IF EXISTS "feed_comments_rbac_select" ON public.feed_comments;
CREATE POLICY "feed_comments_rbac_select" ON public.feed_comments FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- FEED LIKES
DROP POLICY IF EXISTS "feed_likes_rbac_select" ON public.feed_likes;
CREATE POLICY "feed_likes_rbac_select" ON public.feed_likes FOR SELECT USING (
  public.get_user_role() = 'admin'
  OR (is_demo = true  AND public.is_demo_user() = true)
  OR (is_seed = true  AND is_demo = false AND public.is_seed_visible() = true AND public.get_user_role() != 'demo')
  OR (is_demo = false AND is_seed = false)
);

-- -----------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES (partial — only index seed rows for cleanup speed)
-- -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facilities_is_seed     ON public.facilities(is_seed)     WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_courts_is_seed         ON public.courts(is_seed)         WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_matches_is_seed        ON public.matches(is_seed)        WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_clubs_is_seed          ON public.clubs(is_seed)          WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_feed_posts_is_seed     ON public.feed_posts(is_seed)     WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_feed_comments_is_seed  ON public.feed_comments(is_seed)  WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_feed_likes_is_seed     ON public.feed_likes(is_seed)     WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_player_profiles_is_seed ON public.player_profiles(is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_seed ON public.direct_messages(is_seed) WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_bookings_is_seed       ON public.bookings(is_seed)       WHERE is_seed = true;
CREATE INDEX IF NOT EXISTS idx_club_members_is_seed   ON public.club_members(is_seed)   WHERE is_seed = true;
