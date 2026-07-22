-- =====================================================================
-- RBAC AND DEMO SANDBOX MIGRATION
-- Adds strict isolation between real production data and demo data.
-- =====================================================================

-- 1. UPDATE ROLE CONSTRAINTS
ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_role_check;
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_role_check CHECK (role IN ('player', 'owner', 'admin', 'demo'));

-- 2. ADD IS_DEMO COLUMN TO TRANSACTIONAL TABLES
ALTER TABLE public.feed_posts ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_comments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.feed_likes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

-- 3. CREATE AUTH HELPER FUNCTIONS (STABLE for Performance)
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS TEXT AS $$
  SELECT role FROM public.player_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_demo_user() RETURNS BOOLEAN AS $$
  SELECT is_demo FROM public.player_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. APPLY RLS POLICIES FOR FEED POSTS
DROP POLICY IF EXISTS "feed_posts_select_all" ON public.feed_posts;
CREATE POLICY "feed_posts_rbac_select" ON public.feed_posts FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  (public.is_demo_user() = true AND is_demo = true) OR 
  (public.is_demo_user() = false AND is_demo = false)
);

DROP POLICY IF EXISTS "feed_posts_insert_auth" ON public.feed_posts;
CREATE POLICY "feed_posts_rbac_insert" ON public.feed_posts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND is_demo = public.is_demo_user()
);

-- 5. APPLY RLS POLICIES FOR CLUBS
DROP POLICY IF EXISTS "clubs_select_all" ON public.clubs;
CREATE POLICY "clubs_rbac_select" ON public.clubs FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  (public.is_demo_user() = true AND is_demo = true) OR 
  (public.is_demo_user() = false AND is_demo = false)
);

DROP POLICY IF EXISTS "clubs_insert_auth" ON public.clubs;
CREATE POLICY "clubs_rbac_insert" ON public.clubs FOR INSERT WITH CHECK (
  auth.uid() = owner_id AND is_demo = public.is_demo_user()
);

-- 6. APPLY RLS POLICIES FOR CLUB MEMBERS
DROP POLICY IF EXISTS "club_members_select_all" ON public.club_members;
CREATE POLICY "club_members_rbac_select" ON public.club_members FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  (public.is_demo_user() = true AND is_demo = true) OR 
  (public.is_demo_user() = false AND is_demo = false)
);

DROP POLICY IF EXISTS "club_members_insert_auth" ON public.club_members;
CREATE POLICY "club_members_rbac_insert" ON public.club_members FOR INSERT WITH CHECK (
  auth.uid() = player_id AND is_demo = public.is_demo_user()
);

-- 7. APPLY RLS POLICIES FOR FEED COMMENTS
DROP POLICY IF EXISTS "feed_comments_select_all" ON public.feed_comments;
CREATE POLICY "feed_comments_rbac_select" ON public.feed_comments FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  (public.is_demo_user() = true AND is_demo = true) OR 
  (public.is_demo_user() = false AND is_demo = false)
);

DROP POLICY IF EXISTS "feed_comments_insert_auth" ON public.feed_comments;
CREATE POLICY "feed_comments_rbac_insert" ON public.feed_comments FOR INSERT WITH CHECK (
  auth.uid() = author_id AND is_demo = public.is_demo_user()
);

-- 8. APPLY RLS POLICIES FOR FEED LIKES
DROP POLICY IF EXISTS "feed_likes_select_all" ON public.feed_likes;
CREATE POLICY "feed_likes_rbac_select" ON public.feed_likes FOR SELECT USING (
  public.get_user_role() = 'admin' OR 
  (public.is_demo_user() = true AND is_demo = true) OR 
  (public.is_demo_user() = false AND is_demo = false)
);

DROP POLICY IF EXISTS "feed_likes_insert_auth" ON public.feed_likes;
CREATE POLICY "feed_likes_rbac_insert" ON public.feed_likes FOR INSERT WITH CHECK (
  auth.uid() = player_id AND is_demo = public.is_demo_user()
);
