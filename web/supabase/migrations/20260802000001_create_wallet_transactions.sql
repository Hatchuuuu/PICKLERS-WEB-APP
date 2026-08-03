-- Migration: Create wallet_transactions table and security policies
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL DEFAULT 'refund',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own wallet transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet transactions"
    ON public.wallet_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
