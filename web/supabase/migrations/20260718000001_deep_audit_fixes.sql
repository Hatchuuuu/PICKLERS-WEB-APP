-- =====================================================================
-- MIGRATION: 20260718000001_deep_audit_fixes.sql
-- Description: Applies P0 and P1 security and data integrity fixes 
--              identified during the deep audit.
-- =====================================================================

-- 1. Fix self-role-escalation
DROP POLICY IF EXISTS "Users can update own profile" ON public.player_profiles;
CREATE POLICY "Users can update own profile" ON public.player_profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (role = (SELECT role FROM public.player_profiles WHERE id = auth.uid()));

-- 2. Fix open notifications INSERT
DROP POLICY IF EXISTS "System can insert notifications for users" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Hardening RPCs
CREATE OR REPLACE FUNCTION search_tournaments(search_term TEXT)
RETURNS SETOF public.tournaments
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN RETURN QUERY SELECT * FROM tournaments WHERE name % search_term ORDER BY similarity(name, search_term) DESC LIMIT 20; END;
$$;

CREATE OR REPLACE FUNCTION search_facilities(search_term TEXT)
RETURNS SETOF public.facilities
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN RETURN QUERY SELECT * FROM facilities WHERE name % search_term ORDER BY similarity(name, search_term) DESC LIMIT 20; END;
$$;

-- 4. Matches needs created_by
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated users can update matches." ON public.matches;
CREATE POLICY "Creators can update their matches" ON public.matches
FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can delete matches" ON public.matches;
CREATE POLICY "Creators can delete their matches" ON public.matches
FOR DELETE USING (auth.uid() = created_by);

-- 5. Negative wallet balance protection
ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);
