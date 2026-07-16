CREATE OR REPLACE FUNCTION public.increment_wallet_balance(amount INTEGER, user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.wallets 
  SET balance = balance + amount 
  WHERE wallets.user_id = increment_wallet_balance.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
