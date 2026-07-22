-- =====================================================================
-- PHASE 1: COMMUNITY FEED + MESSAGING PERFORMANCE
-- Run this migration in Supabase SQL Editor
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. MESSAGING PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dm_sender
  ON public.direct_messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_receiver
  ON public.direct_messages(receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_unread
  ON public.direct_messages(receiver_id, read)
  WHERE read = false;

-- ─────────────────────────────────────────────────────────────────────
-- 2. FEED POSTS TABLE
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text,
  image_url     text,
  like_count    int NOT NULL DEFAULT 0,
  comment_count int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feed_posts_has_content CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_posts_select_all" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "feed_posts_insert_auth" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "feed_posts_update_own" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "feed_posts_delete_own" ON public.feed_posts FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 3. FEED LIKES TABLE
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_likes_select_all" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "feed_likes_insert_self" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_likes_delete_self" ON public.feed_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON public.feed_likes(user_id);

-- Auto-update like_count trigger
CREATE OR REPLACE FUNCTION public.update_feed_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feed_like_count ON public.feed_likes;
CREATE TRIGGER trg_feed_like_count
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_feed_like_count();

-- ─────────────────────────────────────────────────────────────────────
-- 4. FEED COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_comments_select_all" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "feed_comments_insert_auth" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "feed_comments_delete_own" ON public.feed_comments FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON public.feed_comments(post_id, created_at DESC);

-- Auto-update comment_count trigger
CREATE OR REPLACE FUNCTION public.update_feed_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_feed_comment_count ON public.feed_comments;
CREATE TRIGGER trg_feed_comment_count
  AFTER INSERT OR DELETE ON public.feed_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_feed_comment_count();

-- ─────────────────────────────────────────────────────────────────────
-- 5. REALTIME PUBLICATION
-- ─────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;

-- ─────────────────────────────────────────────────────────────────────
-- 6. TIMESTAMP TRIGGERS FOR NEW TABLES
-- ─────────────────────────────────────────────────────────────────────
CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- ─────────────────────────────────────────────────────────────────────
-- 7. TABLE COMMENTS
-- ─────────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.feed_posts IS 'Facebook-style community feed posts with text and/or images. Author-isolated via author_id. RLS: public read, author-only write.';
COMMENT ON TABLE public.feed_likes IS 'Like/heart tracking for feed posts. Auto-updates feed_posts.like_count via trigger. RLS: public read, self-only write.';
COMMENT ON TABLE public.feed_comments IS 'Comments on feed posts. Auto-updates feed_posts.comment_count via trigger. RLS: public read, self-only write.';

-- ─────────────────────────────────────────────────────────────────────
-- 8. STORAGE BUCKET FOR FEED IMAGES
-- ─────────────────────────────────────────────────────────────────────
-- NOTE: Run this in the Supabase Dashboard > Storage or via supabase CLI:
-- Create bucket: feed-images (public: true, file size limit: 5MB, allowed MIME types: image/*)
-- The Storage bucket must be created via the Dashboard UI or supabase CLI, not raw SQL.
