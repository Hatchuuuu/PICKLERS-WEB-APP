-- ============================================================================
-- Security & Production Remediation Migration: Wallet RPC, 24h Refund & Tournaments
-- Migration: 20260827000000_fix_wallet_rpc_and_tournaments.sql
-- ============================================================================

-- 1. Create increment_wallet_balance_admin RPC for secure server-side wallet operations (Webhooks, Admin credits)
CREATE OR REPLACE FUNCTION public.increment_wallet_balance_admin(
  amount NUMERIC,
  user_id UUID,
  p_label TEXT DEFAULT 'Wallet Top-Up (PayMongo)'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive number, got: %', amount;
  END IF;

  IF amount > 1000000 THEN
    RAISE EXCEPTION 'Amount exceeds maximum limit of 1000000, got: %', amount;
  END IF;

  -- Lock wallet row for atomic update
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE wallets.user_id = increment_wallet_balance_admin.user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (increment_wallet_balance_admin.user_id, amount)
    RETURNING balance INTO v_new_balance;
  ELSE
    v_new_balance := v_current_balance + amount;
    UPDATE public.wallets
    SET balance = v_new_balance,
        updated_at = now()
    WHERE wallets.user_id = increment_wallet_balance_admin.user_id;
  END IF;

  INSERT INTO public.wallet_transactions (user_id, label, amount, type)
  VALUES (increment_wallet_balance_admin.user_id, p_label, amount, 'topup');

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance_admin(NUMERIC, UUID, TEXT) TO postgres;

-- 2. Enhance cancel_booking_and_refund with 24-hour policy enforcement and secure refund
CREATE OR REPLACE FUNCTION public.cancel_booking_and_refund(
  p_booking_id text,
  p_user_id uuid
)
RETURNS json AS $$
DECLARE
  v_booking record;
  v_refund_amount numeric := 0;
  v_refunded boolean := false;
  v_is_eligible boolean := false;
  v_label text;
  v_booking_datetime timestamptz;
BEGIN
  -- Fetch booking record ensuring owner matching
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or access denied';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking has already been cancelled';
  END IF;

  -- 24-Hour Policy Check:
  BEGIN
    v_booking_datetime := (v_booking.date || ' 00:00:00+08')::timestamptz;
    IF v_booking_datetime >= (now() + interval '24 hours') THEN
      v_is_eligible := true;
    ELSE
      v_is_eligible := false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: if date parsing fails, allow refund if booking was created recently (<1 hour ago)
    v_is_eligible := (v_booking.created_at >= (now() - interval '1 hour'));
  END;

  -- Update booking status to cancelled
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE id::text = p_booking_id AND user_id = p_user_id;

  -- Only issue refund if eligible under the 24-hour rule
  IF v_is_eligible AND COALESCE(v_booking.price, 0) > 0 THEN
    v_refund_amount := v_booking.price;
    v_label := 'Refund (24h Notice) — ' || COALESCE(v_booking.court_name, 'Court Booking');
    
    PERFORM public.increment_wallet_balance_admin(v_refund_amount, p_user_id, v_label);
    v_refunded := true;
  ELSE
    v_refund_amount := 0;
    v_refunded := false;
  END IF;

  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'refunded', v_refunded,
    'refund_amount', v_refund_amount,
    'eligible_24h', v_is_eligible
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tournament Registrations Table & RLS
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  partner_name text,
  player_level text DEFAULT '2.5',
  contact_phone text,
  contact_email text,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_tournament_user UNIQUE (tournament_id, user_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tournament registrations" ON public.tournament_registrations;
CREATE POLICY "Users can view tournament registrations" ON public.tournament_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can register for tournaments" ON public.tournament_registrations;
CREATE POLICY "Users can register for tournaments" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel their own registrations" ON public.tournament_registrations;
CREATE POLICY "Users can cancel their own registrations" ON public.tournament_registrations
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user ON public.tournament_registrations(user_id);
