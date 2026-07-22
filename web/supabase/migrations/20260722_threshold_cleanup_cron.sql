-- =====================================================================
-- MIGRATION: Threshold Cleanup Function + pg_cron Schedule
-- 2026-07-22 — Account Architecture Phase 1
-- =====================================================================
-- check_and_purge_seed_data():
--   Runs daily at 3 AM UTC via pg_cron.
--   Counts real (non-demo, non-seed) users + facilities.
--   If either threshold is exceeded → deletes all is_seed=true rows
--   in FK dependency order → flips platform_config.seed_data_active = false.
--   Returns a JSON status object for observability.
-- =====================================================================

-- -----------------------------------------------------------------------
-- 1. MAIN CLEANUP FUNCTION (called by pg_cron, service_role bypasses RLS)
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_purge_seed_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active                   BOOLEAN;
  v_threshold_users             INTEGER;
  v_threshold_facilities        INTEGER;
  v_real_user_count             INTEGER;
  v_real_facility_count         INTEGER;
  v_purged                      BOOLEAN := false;
BEGIN
  -- Short-circuit if already purged
  SELECT seed_data_active, seed_cleanup_threshold_users, seed_cleanup_threshold_facilities
  INTO   v_is_active, v_threshold_users, v_threshold_facilities
  FROM   public.platform_config
  WHERE  id = 1
  LIMIT  1;

  IF NOT COALESCE(v_is_active, true) THEN
    RETURN jsonb_build_object(
      'status',  'already_purged',
      'purged',  false
    );
  END IF;

  -- Count real (non-demo, non-seed) player/owner accounts
  SELECT COUNT(*)
  INTO   v_real_user_count
  FROM   public.player_profiles
  WHERE  is_demo = false
    AND  is_seed = false
    AND  role IN ('player', 'owner');

  -- Count real (non-demo, non-seed) facilities
  SELECT COUNT(*)
  INTO   v_real_facility_count
  FROM   public.facilities
  WHERE  is_demo = false
    AND  is_seed = false;

  -- If EITHER threshold is exceeded, purge seed data
  IF v_real_user_count > v_threshold_users
  OR v_real_facility_count > v_threshold_facilities
  THEN
    -- Delete in FK dependency order (children first to avoid constraint violations)
    DELETE FROM public.feed_likes      WHERE is_seed = true;
    DELETE FROM public.feed_comments   WHERE is_seed = true;
    DELETE FROM public.feed_posts      WHERE is_seed = true;
    DELETE FROM public.club_members    WHERE is_seed = true;
    DELETE FROM public.clubs           WHERE is_seed = true;
    DELETE FROM public.direct_messages WHERE is_seed = true;
    DELETE FROM public.bookings        WHERE is_seed = true;
    DELETE FROM public.matches         WHERE is_seed = true;
    DELETE FROM public.courts          WHERE is_seed = true;
    DELETE FROM public.facilities      WHERE is_seed = true;
    -- NOTE: player_profiles with is_seed=true are intentionally NOT deleted.
    -- They reference auth.users entries (FK constraint). Instead, they become
    -- invisible via RLS once seed_data_active = false.
    -- They may be garbage-collected later via a separate admin maintenance job.

    -- Flip the circuit breaker
    UPDATE public.platform_config
    SET    seed_data_active = false,
           seed_purged_at   = now(),
           updated_at       = now()
    WHERE  id = 1;

    v_purged := true;
  END IF;

  RETURN jsonb_build_object(
    'status',                  CASE WHEN v_purged THEN 'purged' ELSE 'below_threshold' END,
    'purged',                  v_purged,
    'real_users',              v_real_user_count,
    'real_facilities',         v_real_facility_count,
    'threshold_users',         v_threshold_users,
    'threshold_facilities',    v_threshold_facilities,
    'checked_at',              now()
  );
END;
$$;

-- Restrict direct calls from authenticated users (pg_cron uses service_role)
REVOKE ALL ON FUNCTION public.check_and_purge_seed_data() FROM PUBLIC;

COMMENT ON FUNCTION public.check_and_purge_seed_data() IS
  'Daily cron: purges all is_seed=true rows once real user/facility thresholds are '
  'exceeded. Runs as service_role via pg_cron. Returns JSON status for observability.';

-- -----------------------------------------------------------------------
-- 2. ADMIN MANUAL TRIGGER (authenticated endpoint)
-- Allows an admin to manually trigger cleanup from the dashboard
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_trigger_seed_purge()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: admin role required to trigger seed purge';
  END IF;
  RETURN public.check_and_purge_seed_data();
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_trigger_seed_purge() TO authenticated;

COMMENT ON FUNCTION public.admin_trigger_seed_purge() IS
  'Admin-only wrapper around check_and_purge_seed_data(). '
  'Can be called via Supabase RPC from the admin dashboard.';

-- -----------------------------------------------------------------------
-- 3. pg_cron SCHEDULE
-- Requires: pg_cron extension enabled in Supabase Dashboard
--           Settings > Integrations > pg_cron
-- Schedule: Every day at 3:00 AM UTC
-- -----------------------------------------------------------------------
-- Use DO block with exception handling so the migration doesn't fail
-- if pg_cron is not yet enabled.
DO $$
BEGIN
  -- Only schedule if cron schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN
    PERFORM cron.schedule(
      'purge-seed-data-daily',
      '0 3 * * *',
      $$SELECT public.check_and_purge_seed_data()$$
    );
    RAISE NOTICE 'pg_cron schedule "purge-seed-data-daily" created successfully.';
  ELSE
    RAISE NOTICE 'pg_cron extension not found. Schedule the following manually once enabled:';
    RAISE NOTICE '  SELECT cron.schedule(''purge-seed-data-daily'', ''0 3 * * *'', ''SELECT public.check_and_purge_seed_data()'');';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron schedule: %. Create manually after enabling pg_cron.', SQLERRM;
END;
$$;
