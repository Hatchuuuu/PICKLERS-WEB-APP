-- ============================================================================
-- Developer Console Telemetry, Error Intelligence & Webhook Logging Schema
-- Migration: 20260817_dev_console_telemetry_schema.sql
-- ============================================================================

-- 1. developer_errors — application exception intelligence
CREATE TABLE IF NOT EXISTS public.developer_errors (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type          TEXT        NOT NULL,
  message             TEXT        NOT NULL,
  stack_trace         TEXT,
  component           TEXT        NOT NULL DEFAULT 'api',
  environment         TEXT        NOT NULL DEFAULT 'production',
  severity            TEXT        NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warn', 'error', 'fatal')),
  status              TEXT        NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'investigating', 'resolved')),
  occurrence_count    INTEGER     NOT NULL DEFAULT 1,
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  resolved_by         UUID        REFERENCES public.player_profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. webhook_events — outbound webhook dispatch & retry ledger
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          TEXT        NOT NULL,
  endpoint_url        TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  http_status         INTEGER,
  payload             JSONB       NOT NULL DEFAULT '{}'::jsonb,
  response_body       TEXT,
  attempt             INTEGER     NOT NULL DEFAULT 1,
  max_attempts        INTEGER     NOT NULL DEFAULT 3,
  duration_ms         INTEGER,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. application_logs — central application telemetry logs
CREATE TABLE IF NOT EXISTS public.application_logs (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level               TEXT        NOT NULL DEFAULT 'INFO' CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  service             TEXT        NOT NULL DEFAULT 'web-app',
  message             TEXT        NOT NULL,
  request_id          TEXT,
  trace_id            TEXT,
  metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb
);

-- Row Level Security
ALTER TABLE public.developer_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_logs  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_errors_manage" ON public.developer_errors;
CREATE POLICY "dev_errors_manage" ON public.developer_errors FOR ALL USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "webhook_events_manage" ON public.webhook_events;
CREATE POLICY "webhook_events_manage" ON public.webhook_events FOR ALL USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "application_logs_manage" ON public.application_logs;
CREATE POLICY "application_logs_manage" ON public.application_logs FOR ALL USING (public.is_dev() OR public.is_admin());
