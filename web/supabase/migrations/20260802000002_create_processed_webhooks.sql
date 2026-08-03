-- Migration: Create processed_webhooks table for PayMongo webhook idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service-role (supabaseAdmin) can manage processed_webhooks
-- No authenticated user should be able to read or write webhook records
CREATE POLICY "Service role full access to processed_webhooks"
    ON public.processed_webhooks
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
