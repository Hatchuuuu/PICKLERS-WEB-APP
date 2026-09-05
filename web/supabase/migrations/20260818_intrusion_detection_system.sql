-- =================================================================
-- Migration: Intrusion Detection System (IDS) & Honeypot Deception
-- Tables: security_threat_events, blocked_ips
-- =================================================================

CREATE TABLE IF NOT EXISTS public.security_threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type TEXT NOT NULL, -- 'honeypot_trap', 'sqli_probe', 'xss_probe', 'privilege_escalation', 'auth_brute_force', 'idor_tampering', 'path_traversal'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  ip_address TEXT NOT NULL,
  country_code TEXT,
  city TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  target_path TEXT NOT NULL,
  http_method TEXT NOT NULL DEFAULT 'GET',
  payload_preview JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'detected', -- 'detected', 'mitigated', 'blocked', 'resolved', 'ignored'
  resolved_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_threat_events_ip ON public.security_threat_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_threat_events_created_at ON public.security_threat_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON public.security_threat_events(severity);
CREATE INDEX IF NOT EXISTS idx_threat_events_status ON public.security_threat_events(status);
CREATE INDEX IF NOT EXISTS idx_threat_events_threat_type ON public.security_threat_events(threat_type);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  threat_event_id UUID REFERENCES public.security_threat_events(id) ON DELETE SET NULL,
  blocked_by UUID REFERENCES public.player_profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ, -- NULL for permanent block
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address);

-- Enable RLS
ALTER TABLE public.security_threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Developers and Admins can view and manage threat events
DROP POLICY IF EXISTS "dev_threats_select" ON public.security_threat_events;
CREATE POLICY "dev_threats_select" ON public.security_threat_events FOR SELECT 
USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "dev_threats_insert" ON public.security_threat_events;
CREATE POLICY "dev_threats_insert" ON public.security_threat_events FOR INSERT 
WITH CHECK (true); -- Allow system/service logging from edge

DROP POLICY IF EXISTS "dev_threats_update" ON public.security_threat_events;
CREATE POLICY "dev_threats_update" ON public.security_threat_events FOR UPDATE 
USING (public.is_dev() OR public.is_admin());

DROP POLICY IF EXISTS "blocked_ips_all" ON public.blocked_ips;
CREATE POLICY "blocked_ips_all" ON public.blocked_ips FOR ALL 
USING (public.is_dev() OR public.is_admin());
