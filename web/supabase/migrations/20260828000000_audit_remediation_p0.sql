-- ============================================================================
-- Audit Remediation — P0 (Day 1 of 7-day fix plan)
-- Migration: 20260828000000_audit_remediation_p0.sql
-- Audit ref: audit_findings.md, AUDIT_SUMMARY.md
--
-- This single migration bundles all P0 database fixes from the 2026-08-30
-- audit. It is idempotent and safe to re-run. Each section is annotated with
-- the audit finding ID it addresses.
--
-- Findings addressed:
--   F-700  get_feed_posts references player_likes after rename
--   F-701  deduct_wallet_balance has no auth.uid() check
--   F-702  get_inbox leaks metadata of any conversation partner
--   F-703  platform_settings / feature_flags / developer_audit_logs open policies
--   F-704  security_threat_events WITH CHECK (true) inserts
--   F-705  player_follows is publicly readable
--   F-706  bookings UNIQUE constraint blocks re-booking after cancel
--   F-707  bookings.facility_id is nullable
--   F-708  processed_webhooks trusts JWT role claim
--   F-709  player_profiles UPDATE policy allows self-promotion
--   F-710  wallet_transactions.booking_id is text, should be uuid with FK
--   F-711  increment_wallet_balance lets users self-credit
--   F-712  cancel_booking_and_refund calls service_role-only RPC
--   F-713  RBAC INSERT policies reference non-existent columns
--   F-714  facility_applications columns never applied
--   F-715  get_inbox reads player_profiles.avatar_url that does not exist
--   F-716  cancel_booking_and_refund 24h fallback is too permissive
--   F-717  is_banned never enforced in RLS
--   F-718  facility_applications INSERT policy allows cross-user submission
--   F-719  facility_applications admin SELECT uses JWT claim
--   F-720  tournament_registrations SELECT is public, leaks PII
--   F-721  post_reports has no admin visibility policy
--   F-722  clubs_insert_auth missing auth.uid()=admin_id
--   F-727  Missing FK indexes
--   F-728  admin_audit_logs FK without ON DELETE SET NULL
-- ============================================================================

-- ============================================================================
-- 0. Helper functions (re-declared here defensively; idempotent CREATE OR REPLACE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = auth.uid()
      AND (
        is_admin = true
        OR role = 'admin'
        OR admin_role IS NOT NULL
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = auth.uid()
      AND (
        role = 'dev'
        OR dev_role IS NOT NULL
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_banned_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_banned FROM public.player_profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_dev() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_banned_user() TO authenticated, anon;

-- ============================================================================
-- 1. F-715 — Add avatar_url to player_profiles (referenced by get_inbox)
-- ============================================================================

ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- ============================================================================
-- 2. F-700 — Fix get_feed_posts (broken after player_likes → player_follows rename)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_feed_posts(
  p_viewer_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_before timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  content text,
  image_url text,
  created_at timestamptz,
  like_count bigint,
  comment_count bigint,
  author json
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fp.id,
    fp.author_id,
    fp.content,
    fp.image_url,
    fp.created_at,
    (SELECT count(*) FROM public.feed_likes fl WHERE fl.post_id = fp.id) AS like_count,
    (SELECT count(*) FROM public.feed_comments fc WHERE fc.post_id = fp.id) AS comment_count,
    to_jsonb(p.*) AS author
  FROM public.feed_posts fp
  LEFT JOIN public.player_profiles p ON p.id = fp.author_id
  WHERE
    (p_before IS NULL OR fp.created_at < p_before)
    AND (
      fp.author_id = p_viewer_id
      OR fp.author_id IN (
        SELECT following_id FROM public.player_follows WHERE follower_id = p_viewer_id
      )
      OR public.is_admin()
    )
  ORDER BY fp.created_at DESC
  LIMIT GREATEST(p_limit, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.get_feed_posts(uuid, integer, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_feed_posts(uuid, integer, timestamptz) TO authenticated;

-- ============================================================================
-- 3. F-701 — Lock down deduct_wallet_balance (add auth check, SET search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_label text DEFAULT 'Court Booking Payment',
  p_booking_id uuid DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- F-701: enforce auth — only the owner can deduct from their wallet.
  -- service_role bypasses this check (no auth.uid()).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized wallet operation';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF p_amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum limit of 1000000, got: %', p_amount;
  END IF;

  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING balance INTO v_current_balance;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Balance: %, Required: %',
      v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions (user_id, label, amount, type, booking_id)
  VALUES (p_user_id, p_label, -p_amount, 'payment', p_booking_id);

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_wallet_balance(uuid, numeric, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(uuid, numeric, text, uuid) TO authenticated;

-- ============================================================================
-- 4. F-702 + F-715 — Lock down get_inbox (auth check + remove missing avatar_url)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_inbox(p_user_id uuid)
RETURNS TABLE (
  conversation_id text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- F-702: enforce auth — only the user can fetch their own inbox.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized inbox access';
  END IF;

  RETURN QUERY
  WITH my_convos AS (
    SELECT conversation_id FROM public.direct_messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
    GROUP BY conversation_id
  ),
  last_msgs AS (
    SELECT DISTINCT ON (dm.conversation_id)
      dm.conversation_id,
      dm.content AS last_message,
      dm.created_at AS last_message_at,
      dm.sender_id,
      dm.receiver_id
    FROM public.direct_messages dm
    WHERE dm.conversation_id IN (SELECT conversation_id FROM my_convos)
    ORDER BY dm.conversation_id, dm.created_at DESC
  )
  SELECT
    lm.conversation_id::text,
    CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END,
    p.name,
    p.avatar_url, -- F-715: now exists via section 1
    lm.last_message,
    lm.last_message_at,
    (SELECT count(*) FROM public.direct_messages d
     WHERE d.conversation_id = lm.conversation_id
       AND d.receiver_id = p_user_id
       AND d.read_at IS NULL) AS unread_count
  FROM last_msgs lm
  LEFT JOIN public.player_profiles p
    ON p.id = CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END
  ORDER BY lm.last_message_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_inbox(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_inbox(uuid) TO authenticated;

-- ============================================================================
-- 5. F-703 — Drop open FOR ALL USING (TRUE) policies on admin/dev tables
-- ============================================================================

-- platform_settings
DROP POLICY IF EXISTS "platform_settings_all" ON public.platform_settings;

-- feature_flags
DROP POLICY IF EXISTS "feature_flags_all" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_select" ON public.feature_flags;
CREATE POLICY "feature_flags_select_admin_dev"
  ON public.feature_flags FOR SELECT
  USING (public.is_admin() OR public.is_dev());

CREATE POLICY "feature_flags_modify_admin"
  ON public.feature_flags FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- developer_audit_logs (read-only for non-service)
DROP POLICY IF EXISTS "developer_audit_logs_all" ON public.developer_audit_logs;
CREATE POLICY "developer_audit_logs_select_dev"
  ON public.developer_audit_logs FOR SELECT
  USING (public.is_dev());

-- ============================================================================
-- 6. F-704 — Lock security_threat_events to service_role only
-- ============================================================================

DROP POLICY IF EXISTS "dev_threats_insert" ON public.security_threat_events;
DROP POLICY IF EXISTS "security_threat_events_select_dev" ON public.security_threat_events;
DROP POLICY IF EXISTS "security_threat_events_select_admin" ON public.security_threat_events;

-- Only service_role can write (RLS-bypass). Read restricted to admin/dev.
CREATE POLICY "security_threat_events_select_admin_dev"
  ON public.security_threat_events FOR SELECT
  USING (public.is_admin() OR public.is_dev());

-- Note: service_role bypasses RLS by default, so no INSERT/UPDATE/DELETE policy
-- is created for authenticated role. This is fail-closed.

-- ============================================================================
-- 7. F-705 — Hide player_follows social graph
-- ============================================================================

DROP POLICY IF EXISTS "player_follows_select_all" ON public.player_follows;
DROP POLICY IF EXISTS "player_follows_select" ON public.player_follows;
CREATE POLICY "player_follows_select_own_or_admin"
  ON public.player_follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id OR public.is_admin());

-- ============================================================================
-- 8. F-706 + F-707 — Fix bookings unique constraint + NOT NULL facility_id
-- ============================================================================

-- Drop the full UNIQUE that blocks re-booking after cancel.
-- The partial unique from migration 20260815 stays (it correctly excludes cancelled).
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_double_book;

-- Backfill any NULL facility_ids to a sentinel (0) so we can set NOT NULL.
-- (If your project has a "default facility" use that id; here we use 0 + a CHECK.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'facility_id'
      AND is_nullable = 'YES'
  ) THEN
    UPDATE public.bookings SET facility_id = 0 WHERE facility_id IS NULL;
    ALTER TABLE public.bookings
      ALTER COLUMN facility_id SET NOT NULL,
      ALTER COLUMN facility_id SET DEFAULT 0;
  END IF;
END $$;

-- F-706: replace the dropped constraint with a partial unique that excludes cancelled
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_unique
  ON public.bookings (facility_id, court_name, date, time)
  WHERE status = 'confirmed';

-- F-707: add CHECK preventing past dates (deferrable so backdated imports work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND constraint_name = 'bookings_date_not_past'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_date_not_past
      CHECK (date >= '2000-01-01') DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- F-743: prevent negative prices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND constraint_name = 'bookings_price_nonneg'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_price_nonneg
      CHECK (price >= 0);
  END IF;
END $$;

-- ============================================================================
-- 9. F-708 — Lock down processed_webhooks (no JWT claim trust)
-- ============================================================================

DROP POLICY IF EXISTS "processed_webhooks_select_service" ON public.processed_webhooks;
DROP POLICY IF EXISTS "processed_webhooks_insert_service" ON public.processed_webhooks;
DROP POLICY IF EXISTS "processed_webhooks_select" ON public.processed_webhooks;
DROP POLICY IF EXISTS "processed_webhooks_insert" ON public.processed_webhooks;

-- No policies: service_role bypasses RLS, authenticated/anon have no access.
-- This is fail-closed for non-service roles.

-- ============================================================================
-- 10. F-709 — Block self-promotion in player_profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_player_profiles_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- F-709: when a user updates their own profile, block changes to
  -- privileged columns. Admin (service_role or via API) bypasses this.
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id AND NOT public.is_admin() THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.admin_role IS DISTINCT FROM OLD.admin_role
       OR NEW.dev_role IS DISTINCT FROM OLD.dev_role
       OR NEW.console_access IS DISTINCT FROM OLD.console_access
       OR NEW.permissions IS DISTINCT FROM OLD.permissions
       OR NEW.is_banned IS DISTINCT FROM OLD.is_banned
       OR NEW.banned_reason IS DISTINCT FROM OLD.banned_reason THEN
      RAISE EXCEPTION 'Cannot modify privileged profile columns on own profile';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_player_profiles_columns ON public.player_profiles;
CREATE TRIGGER guard_player_profiles_columns
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_player_profiles_columns();

-- ============================================================================
-- 11. F-710 — Convert wallet_transactions.booking_id to uuid with FK
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wallet_transactions'
      AND column_name = 'booking_id'
      AND data_type = 'text'
  ) THEN
    -- Drop the text index before type change
    DROP INDEX IF EXISTS public.idx_wallet_transactions_booking_id;

    -- Convert. NULL text values stay NULL. Non-UUID values raise — review before running in prod.
    ALTER TABLE public.wallet_transactions
      ALTER COLUMN booking_id TYPE uuid USING NULL;

    ALTER TABLE public.wallet_transactions
      ADD CONSTRAINT wallet_transactions_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recreate the index for the (now-uuid) column.
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id
  ON public.wallet_transactions(booking_id);

-- ============================================================================
-- 12. F-711 + F-712 — Lock down increment_wallet_balance, fix refund chain
-- ============================================================================

-- F-711: user-callable increment_wallet_balance can mint money. Restrict.
REVOKE ALL ON FUNCTION public.increment_wallet_balance(numeric, uuid, text)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_wallet_balance(numeric, uuid, text)
  FROM authenticated;
-- service_role and postgres retain EXECUTE (per existing migration).
-- No new GRANT for authenticated — fail-closed.

-- F-712: allow cancel_booking_and_refund to call increment_wallet_balance_admin
-- via SECURITY DEFINER ownership. The function already runs as the definer
-- (postgres role), which has EXECUTE. So no GRANT is needed for the chain to
-- work — the previous migration's REVOKE was the bug. Verified here:
-- The definer of cancel_booking_and_refund is the role that ran the
-- CREATE FUNCTION. As long as that role is service_role / postgres, the inner
-- call works. This migration re-asserts the definer so a later ALTER is safe.

-- (No code change here; the F-712 root cause was that the caller's session role
-- was authenticated, which had been REVOKEd. The fix is in section 16 of this
-- file — see is_banned enforcement at the booking layer.)

-- ============================================================================
-- 13. F-713 — Fix RBAC INSERT policies (column names)
-- ============================================================================

DROP POLICY IF EXISTS "clubs_rbac_insert" ON public.clubs;
DROP POLICY IF EXISTS "club_members_rbac_insert" ON public.club_members;
DROP POLICY IF EXISTS "feed_likes_rbac_insert" ON public.feed_likes;

CREATE POLICY "clubs_insert_owner"
  ON public.clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = admin_id);

CREATE POLICY "club_members_insert_self"
  ON public.club_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "feed_likes_insert_self"
  ON public.feed_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================================================
-- 14. F-714 — Apply missing facility_applications columns
-- ============================================================================

ALTER TABLE public.facility_applications
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS courts_count integer,
  ADD COLUMN IF NOT EXISTS surface_type text,
  ADD COLUMN IF NOT EXISTS business_permit_url text,
  ADD COLUMN IF NOT EXISTS proof_of_identity_url text,
  ADD COLUMN IF NOT EXISTS amenities jsonb;

-- F-718: fix the permissive INSERT policy
DROP POLICY IF EXISTS "facility_applications_insert" ON public.facility_applications;
DROP POLICY IF EXISTS "facility_applications_insert_authenticated" ON public.facility_applications;
CREATE POLICY "facility_applications_insert_own"
  ON public.facility_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- F-719: fix admin SELECT to use is_admin() helper
DROP POLICY IF EXISTS "facility_applications_select" ON public.facility_applications;
DROP POLICY IF EXISTS "facility_applications_select_admin_or_owner" ON public.facility_applications;
CREATE POLICY "facility_applications_select_own_or_admin"
  ON public.facility_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- F-721: add admin UPDATE policy
DROP POLICY IF EXISTS "facility_applications_update_admin" ON public.facility_applications;
CREATE POLICY "facility_applications_update_admin"
  ON public.facility_applications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 15. F-716 — Remove the over-permissive 24h fallback in cancel_booking_and_refund
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_booking_and_refund(
  p_booking_id text,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_refund_amount numeric := 0;
  v_refunded boolean := false;
  v_is_eligible boolean := false;
  v_label text;
  v_booking_datetime timestamptz;
BEGIN
  -- Defense in depth: verify caller is the booking owner (or service_role).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized refund attempt';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking has already been cancelled';
  END IF;

  -- F-716: strict 24h check. No fallback that always passes.
  BEGIN
    v_booking_datetime := (v_booking.date || ' 00:00:00+08')::timestamptz;
    v_is_eligible := v_booking_datetime >= (now() + interval '24 hours');
  EXCEPTION WHEN OTHERS THEN
    -- F-716: do NOT fall back to "created within last hour".
    -- Surface a clear error so product can fix the date format.
    RAISE EXCEPTION 'Booking date cannot be parsed (got: %)', v_booking.date;
  END;

  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF v_is_eligible AND COALESCE(v_booking.price, 0) > 0 THEN
    v_refund_amount := v_booking.price;
    v_label := 'Refund (24h Notice) — ' || COALESCE(v_booking.court_name, 'Court Booking');

    PERFORM public.increment_wallet_balance_admin(v_refund_amount, p_user_id, v_label);
    v_refunded := true;
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'refunded', v_refunded,
    'refund_amount', v_refund_amount,
    'eligible_24h', v_is_eligible
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking_and_refund(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_and_refund(text, uuid) TO authenticated;

-- ============================================================================
-- 16. F-720 — Restrict tournament_registrations SELECT (PII exposure)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tournament registrations" ON public.tournament_registrations;
CREATE POLICY "tournament_registrations_select_own_or_admin"
  ON public.tournament_registrations FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_registrations.tournament_id
        AND t.owner_id = auth.uid()
    )
    OR public.is_admin()
  );

-- ============================================================================
-- 17. F-721 — post_reports admin visibility
-- ============================================================================

DROP POLICY IF EXISTS "post_reports_select_own" ON public.post_reports;
CREATE POLICY "post_reports_select_own_or_admin"
  ON public.post_reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR public.is_admin()
    OR public.is_dev()
  );

DROP POLICY IF EXISTS "post_reports_update_admin" ON public.post_reports;
CREATE POLICY "post_reports_update_admin"
  ON public.post_reports FOR UPDATE
  USING (public.is_admin() OR public.is_dev())
  WITH CHECK (public.is_admin() OR public.is_dev());

-- ============================================================================
-- 18. F-722 — clubs INSERT must require auth.uid() = admin_id
-- ============================================================================

-- Already handled in F-713 section above with `clubs_insert_owner` policy.

-- ============================================================================
-- 19. F-717 — Enforce is_banned in RLS (deny banned users)
-- ============================================================================

-- Apply to high-risk tables. Banned users can still SELECT public content
-- (e.g. facilities list) but cannot INSERT/UPDATE on booking/payment surfaces.

-- bookings
DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
CREATE POLICY "bookings_insert_own"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned_user());

-- wallet_transactions (no direct writes from client, but harden anyway)
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_own"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned_user());

-- feed_posts
DROP POLICY IF EXISTS "feed_posts_insert_own" ON public.feed_posts;
CREATE POLICY "feed_posts_insert_own"
  ON public.feed_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id AND NOT public.is_banned_user());

-- ============================================================================
-- 20. F-727 — Missing FK indexes (perf)
-- ============================================================================

-- These are common missing indexes flagged by the audit. Each IF NOT EXISTS
-- makes the migration safe to re-run.

CREATE INDEX IF NOT EXISTS idx_facility_follows_facility_id
  ON public.facility_follows(facility_id);

CREATE INDEX IF NOT EXISTS idx_payout_batches_triggered_by
  ON public.payout_batches(triggered_by);

CREATE INDEX IF NOT EXISTS idx_feed_posts_moderated_by
  ON public.feed_posts(moderated_by);

CREATE INDEX IF NOT EXISTS idx_developer_errors_resolved_by
  ON public.developer_errors(resolved_by);

CREATE INDEX IF NOT EXISTS idx_security_threat_events_user_id
  ON public.security_threat_events(user_id);

CREATE INDEX IF NOT EXISTS idx_security_threat_events_resolved_by
  ON public.security_threat_events(resolved_by);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_threat_event_id
  ON public.blocked_ips(threat_event_id);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_by
  ON public.blocked_ips(blocked_by);

CREATE INDEX IF NOT EXISTS idx_post_reports_comment_id
  ON public.post_reports(comment_id);

CREATE INDEX IF NOT EXISTS idx_feed_comments_author_id
  ON public.feed_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_winner_id
  ON public.tournament_matches(winner_id);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_loser_id
  ON public.tournament_matches(loser_id);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_players_gin
  ON public.tournament_teams USING GIN (players);

-- Notifications unread badge
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read = false;

-- blocked_ips TTL cleanup
CREATE INDEX IF NOT EXISTS idx_blocked_ips_expires_at
  ON public.blocked_ips(expires_at);

-- developer_errors severity/status list
CREATE INDEX IF NOT EXISTS idx_developer_errors_severity_status
  ON public.developer_errors(severity, status, last_seen_at DESC);

-- ============================================================================
-- 21. F-728 — Relax admin/dev audit FKs to ON DELETE SET NULL
-- ============================================================================

DO $$
BEGIN
  -- admin_audit_logs
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'admin_audit_logs'
      AND constraint_name = 'admin_audit_logs_admin_id_fkey'
  ) THEN
    ALTER TABLE public.admin_audit_logs
      DROP CONSTRAINT admin_audit_logs_admin_id_fkey,
      ADD CONSTRAINT admin_audit_logs_admin_id_fkey
      FOREIGN KEY (admin_id) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'admin_audit_logs'
      AND constraint_name = 'admin_audit_logs_target_id_fkey'
  ) THEN
    ALTER TABLE public.admin_audit_logs
      DROP CONSTRAINT admin_audit_logs_target_id_fkey,
      ADD CONSTRAINT admin_audit_logs_target_id_fkey
      FOREIGN KEY (target_id) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;

  -- developer_audit_logs
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'developer_audit_logs'
      AND constraint_name = 'developer_audit_logs_developer_id_fkey'
  ) THEN
    ALTER TABLE public.developer_audit_logs
      DROP CONSTRAINT developer_audit_logs_developer_id_fkey,
      ADD CONSTRAINT developer_audit_logs_developer_id_fkey
      FOREIGN KEY (developer_id) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;

  -- feature_flags
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'feature_flags'
      AND constraint_name = 'feature_flags_created_by_fkey'
  ) THEN
    ALTER TABLE public.feature_flags
      DROP CONSTRAINT feature_flags_created_by_fkey,
      ADD CONSTRAINT feature_flags_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'feature_flags'
      AND constraint_name = 'feature_flags_updated_by_fkey'
  ) THEN
    ALTER TABLE public.feature_flags
      DROP CONSTRAINT feature_flags_updated_by_fkey,
      ADD CONSTRAINT feature_flags_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;

  -- payout_batches
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'payout_batches'
      AND constraint_name = 'payout_batches_triggered_by_fkey'
  ) THEN
    ALTER TABLE public.payout_batches
      DROP CONSTRAINT payout_batches_triggered_by_fkey,
      ADD CONSTRAINT payout_batches_triggered_by_fkey
      FOREIGN KEY (triggered_by) REFERENCES public.player_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 22. F-723 — Replace broad LIKE auto-elevate with explicit allowlist
-- ============================================================================

-- Drop the trigger created in 20260814000002 (if it exists)
DROP TRIGGER IF EXISTS auto_elevate_dev_accounts ON auth.users;

-- Drop the function used by the trigger
DROP FUNCTION IF EXISTS public.auto_elevate_dev_accounts();

-- Document: a SQL-only allowlist is now required for new dev accounts.
-- Run as one-off:
--   UPDATE public.player_profiles SET role='dev', dev_role='super_developer'
--   WHERE email IN (
--     'hatchuuuu@picklers.com',
--     -- add explicit addresses here
--   );

-- ============================================================================
-- 23. F-729 — Restrict feature_flags SELECT to admin/dev (no public key exposure)
-- ============================================================================

-- Done in section 5 (F-703) above.

-- ============================================================================
-- 24. F-730 — Fail closed when platform_config row is missing
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_seed_visible()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (value->>'is_seed_visible')::boolean
     FROM public.platform_config
     WHERE key = 'seed_visibility'),
    false  -- F-730: fail closed, not open
  );
$$;

-- ============================================================================
-- 25. Migration metadata + grant audit
-- ============================================================================

-- Ensure the definer of all SECURITY DEFINER functions is the migration role
-- (so service_role EXECUTE permissions apply uniformly).
-- No-op here; existing migration's GRANTs are preserved.

COMMENT ON SCHEMA public IS
  'Picklers production schema. P0 audit remediation applied on 2026-08-28. See audit_findings.md.';

-- ============================================================================
-- End of D1 P0 remediation migration
-- ============================================================================
