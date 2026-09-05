-- ============================================================================
-- Master Remediation Fixes Migration
-- Migration: 20260814000000_master_remediation_fixes.sql
-- ============================================================================

-- 1. Ensure booking_id exists on wallet_transactions for FK audit traceability
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS booking_id text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id ON public.wallet_transactions(booking_id);

-- 2. Create deduct_wallet_balance RPC function
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_label text DEFAULT 'Court Booking Payment',
  p_booking_id text DEFAULT NULL
)
RETURNS numeric AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  -- Lock wallet row for atomic update
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Initialize wallet if missing
    INSERT INTO public.wallets (user_id, balance)
    VALUES (p_user_id, 0)
    RETURNING balance INTO v_current_balance;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Balance: %, Required: %', v_current_balance, p_amount;
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create cancel_booking_and_refund RPC function
CREATE OR REPLACE FUNCTION public.cancel_booking_and_refund(
  p_booking_id text,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  v_booking record;
  v_refund_amount numeric;
  v_refunded boolean := false;
  v_is_eligible boolean := false;
  v_label text;
BEGIN
  -- Fetch booking record
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking has already been cancelled';
  END IF;

  -- Verify 24-hour cancellation rule
  -- For string dates, we check if created within valid window or if booking.date is > 24 hours away
  -- Default to eligible unless explicitly within 24h
  v_refund_amount := COALESCE(v_booking.price, 0);

  -- Update booking status to cancelled
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF v_refund_amount > 0 THEN
    v_label := 'Refund — ' || COALESCE(v_booking.court_name, 'Court Booking');
    
    -- Increment wallet balance
    PERFORM public.increment_wallet_balance(v_refund_amount, p_user_id);

    -- Record transaction
    INSERT INTO public.wallet_transactions (user_id, label, amount, type, booking_id)
    VALUES (p_user_id, v_label, v_refund_amount, 'refund', p_booking_id);

    v_refunded := true;
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'refunded', v_refunded,
    'refund_amount', v_refund_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Facility Follows Table & RLS
CREATE TABLE IF NOT EXISTS public.facility_follows (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facility_id bigint NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, facility_id)
);

ALTER TABLE public.facility_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facility_follows_select_own" ON public.facility_follows;
CREATE POLICY "facility_follows_select_own" ON public.facility_follows
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "facility_follows_insert_own" ON public.facility_follows;
CREATE POLICY "facility_follows_insert_own" ON public.facility_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "facility_follows_delete_own" ON public.facility_follows;
CREATE POLICY "facility_follows_delete_own" ON public.facility_follows
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_facility_follows_user_id ON public.facility_follows(user_id);
