-- =====================================================================
-- Migration: Create post_reports table (20260815)
-- Enables community members to flag/report inappropriate posts/comments
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.post_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES public.feed_comments(id) ON DELETE CASCADE,
  reason      text NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'other')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_auth" ON public.post_reports;
CREATE POLICY "reports_insert_auth" ON public.post_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON public.post_reports;
CREATE POLICY "reports_select_own" ON public.post_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_post_reports_post ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_reporter ON public.post_reports(reporter_id);
