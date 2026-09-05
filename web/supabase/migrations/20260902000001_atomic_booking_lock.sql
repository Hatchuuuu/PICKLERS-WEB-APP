-- migration: 20260902000001_atomic_booking_lock.sql
-- A-002 FIX: Atomic advisory-lock-based booking slot check.
--
-- Problem: The application checked slot availability via a cache read then a
-- DB query, then inserted. Two concurrent requests within the same 30-second
-- cache window both saw the slot as available and both inserted — creating
-- double-bookings.
--
-- Solution: A SECURITY DEFINER function that acquires a transactional advisory
-- lock keyed on a hash of (facility_id, court_name, date, time) before
-- re-checking availability. Because pg_try_advisory_xact_lock is transactional,
-- any concurrent call for the same slot will fail-fast instead of racing.
--
-- The application replaces its cache-check with a call to this function.
-- If it returns false, the slot is taken (or locked) → 409.
-- If it returns true, the caller proceeds to insert immediately.

CREATE OR REPLACE FUNCTION public.try_book_slot(
  p_facility_id integer,
  p_court_name  text,
  p_date        date,
  p_time        text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_id     bigint;
  v_existing_id uuid;
BEGIN
  -- Derive a stable integer advisory lock key from the slot parameters.
  -- hashtext() is built-in, deterministic, and fast.
  v_lock_id := hashtext(
    p_facility_id::text || '|' || p_court_name || '|' || p_date::text || '|' || p_time
  );

  -- Try to acquire an EXCLUSIVE advisory lock scoped to the current transaction.
  -- pg_try_advisory_xact_lock is non-blocking: it returns false immediately
  -- if another transaction holds the lock for the same key.
  IF NOT pg_try_advisory_xact_lock(v_lock_id) THEN
    RETURN false; -- Another transaction is currently booking this exact slot
  END IF;

  -- Re-check for a confirmed booking inside the advisory lock window.
  -- This is the authoritative check — the advisory lock ensures no other
  -- transaction can be between this SELECT and a subsequent INSERT.
  SELECT id INTO v_existing_id
  FROM public.bookings
  WHERE facility_id = p_facility_id
    AND court_name  = p_court_name
    AND date        = p_date
    AND time        = p_time
    AND status      = 'confirmed'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN false; -- Slot is already confirmed
  END IF;

  RETURN true; -- Safe to proceed with the INSERT
END;
$$;

-- Grant execute to authenticated users (the booking API uses the anon/user client)
GRANT EXECUTE ON FUNCTION public.try_book_slot(integer, text, date, text) TO authenticated;

-- Revoke from public for defence in depth
REVOKE EXECUTE ON FUNCTION public.try_book_slot(integer, text, date, text) FROM public;
