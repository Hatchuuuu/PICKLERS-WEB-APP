-- =====================================================================
-- Migration: Rename player_likes → player_follows
-- Aligns the social graph table naming with "follow" terminology.
-- The table was previously named "player_likes" but served as a follow
-- system. This migration renames the table and its columns for clarity.
-- =====================================================================

DO $$
BEGIN
  -- ── Step 1: Rename the table (safe — IF NOT EXISTS handled via check)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_likes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'player_follows'
  ) THEN
    ALTER TABLE public.player_likes RENAME TO player_follows;
  END IF;

  -- ── Step 2: Rename columns (only if they still have old names)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_follows' AND column_name = 'liker_id'
  ) THEN
    ALTER TABLE public.player_follows RENAME COLUMN liker_id TO follower_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'player_follows' AND column_name = 'liked_id'
  ) THEN
    ALTER TABLE public.player_follows RENAME COLUMN liked_id TO following_id;
  END IF;

  -- ── Step 3: Drop old RLS policies and recreate with new names
  DROP POLICY IF EXISTS "player_likes_select_all" ON public.player_follows;
  DROP POLICY IF EXISTS "player_likes_insert_self" ON public.player_follows;
  DROP POLICY IF EXISTS "player_likes_delete_self" ON public.player_follows;

  -- Recreate policies referencing new column name
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_select_all'
  ) THEN
    CREATE POLICY "player_follows_select_all" ON public.player_follows FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_insert_self'
  ) THEN
    CREATE POLICY "player_follows_insert_self" ON public.player_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_follows' AND policyname = 'player_follows_delete_self'
  ) THEN
    CREATE POLICY "player_follows_delete_self" ON public.player_follows FOR DELETE USING (auth.uid() = follower_id);
  END IF;

  -- ── Step 4: Recreate indexes with new names (old index names are dropped first)
  DROP INDEX IF EXISTS public.idx_player_likes_liker;
  DROP INDEX IF EXISTS public.idx_player_likes_liked;

END $$;

-- Recreate indexes outside of DO block for safety
CREATE INDEX IF NOT EXISTS idx_player_follows_follower ON public.player_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_player_follows_following ON public.player_follows(following_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_follows_unique ON public.player_follows(follower_id, following_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'player_follows_follower_id_following_id_key'
  );
