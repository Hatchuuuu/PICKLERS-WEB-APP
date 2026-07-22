-- =====================================================================
-- PHASE 1B: FEED OPTIMIZATIONS & STORAGE SECURITY
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. STORAGE BUCKET RLS POLICIES FOR 'feed-images'
-- ─────────────────────────────────────────────────────────────────────

-- Ensure bucket exists (this is safe if it already exists via Dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-images', 
  'feed-images', 
  true, 
  5242880, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Allow public read access
DROP POLICY IF EXISTS "Public access to feed-images" ON storage.objects;
CREATE POLICY "Public access to feed-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-images');

-- Allow authenticated users to upload to a folder matching their user ID
DROP POLICY IF EXISTS "Auth users can upload to their own folder" ON storage.objects;
CREATE POLICY "Auth users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. FEED OPTIMIZATION RPC (Fix N+1 and Support Cursor Pagination)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  viewer_id UUID,
  max_limit INT,
  after_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.feed_posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.feed_posts p
  WHERE
    (
      p.author_id = viewer_id
      OR p.author_id IN (
        SELECT liked_id FROM public.player_likes WHERE liker_id = viewer_id
      )
    )
    AND (after_cursor IS NULL OR p.created_at < after_cursor)
  ORDER BY p.created_at DESC
  LIMIT max_limit;
END;
$$;

COMMENT ON FUNCTION public.get_feed_posts IS 'Optimized query to fetch feed posts for a user based on who they follow, with cursor-based pagination.';
