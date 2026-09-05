import type { SupabaseClient } from '@supabase/supabase-js';
import type { ThreatType, ThreatSeverity } from '@/types/developer';

export interface ThreatDetectionResult {
  isThreat: boolean;
  threatType?: ThreatType;
  severity?: ThreatSeverity;
  reason?: string;
  matchedPattern?: string;
}

// Common scanner and attacker honeypot routes
export const HONEYPOT_PATHS = [
  '/.env',
  '/.env.local',
  '/.env.production',
  '/.git/config',
  '/.git/HEAD',
  '/wp-admin',
  '/wp-login.php',
  '/xmlrpc.php',
  '/phpmyadmin',
  '/pma',
  '/actuator',
  '/actuator/health',
  '/api/v1/internal-debug',
  '/api/v1/debug',
  '/eval-stdin',
  '/solr',
  '/console',
  '/autodiscover/autodiscover.json',
  '/config.json',
  '/backup.sql',
  '/dump.sql',
];

// SQL Injection heuristics
const SQLI_PATTERNS = [
  /(\b(union\s+select|union\s+all\s+select)\b)/i,
  /(\b(select\s+.+\s+from\s+information_schema)\b)/i,
  /((%27)|('))(\s*)(or|and)(\s*)(\d+|\w+)(\s*)(=|<|>)/i,
  /(\b(sleep\s*\(|benchmark\s*\(|waitfor\s+delay)\b)/i,
  /(\b(drop\s+table|truncate\s+table|alter\s+table)\b)/i,
  /(\bexec(\s|\+)+(s|x)p\w+)/i,
];

// XSS heuristics
const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /javascript:[^\n]*/i,
  /\bonerror\s*=\s*['"][^'"]*['"]/i,
  /\bonload\s*=\s*['"][^'"]*['"]/i,
  /\beval\s*\([^)]*\)/i,
  /<iframe\b[^>]*>/i,
  /document\.cookie/i,
];

// Path traversal heuristics
const PATH_TRAVERSAL_PATTERNS = [
  /(\.\.\/|\.\.\\)/,
  /(%2e%2e%2f|%2e%2e\/|\.\.%2f)/i,
  /(%252e%252e%252f)/i,
  /(\/etc\/passwd|\/windows\/system32)/i,
];

/**
 * Inspects a path and optional payload (query string, body) for intrusion patterns.
 */
export function inspectRequest(
  path: string,
  payloadStr: string = ''
): ThreatDetectionResult {
  const normalizedPath = path.toLowerCase().split('?')[0];

  // 1. Honeypot check (Instant True Positive)
  if (HONEYPOT_PATHS.some((hp) => normalizedPath === hp || normalizedPath.startsWith(`${hp}/`))) {
    return {
      isThreat: true,
      threatType: 'honeypot_trap',
      severity: 'critical',
      reason: `Attacker probed decoy honeypot endpoint [${path}]`,
      matchedPattern: path,
    };
  }

  const combinedTarget = `${path} ${payloadStr}`;

  // 2. Path Traversal check
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(combinedTarget)) {
      return {
        isThreat: true,
        threatType: 'path_traversal',
        severity: 'high',
        reason: 'Path traversal / arbitrary file read sequence detected',
        matchedPattern: pattern.source,
      };
    }
  }

  // 3. SQL Injection check
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(combinedTarget)) {
      return {
        isThreat: true,
        threatType: 'sqli_probe',
        severity: 'high',
        reason: 'SQL Injection / query tampering payload signature detected',
        matchedPattern: pattern.source,
      };
    }
  }

  // 4. XSS Injection check
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(combinedTarget)) {
      return {
        isThreat: true,
        threatType: 'xss_probe',
        severity: 'medium',
        reason: 'Cross-Site Scripting (XSS) payload signature detected',
        matchedPattern: pattern.source,
      };
    }
  }

  return { isThreat: false };
}

/**
 * Records a security threat event to the database.
 */
export async function recordThreatEvent(
  supabase: SupabaseClient,
  data: {
    threat_type: ThreatType;
    severity: ThreatSeverity;
    ip_address: string;
    target_path: string;
    http_method?: string;
    user_agent?: string;
    user_id?: string;
    payload_preview?: Record<string, unknown> | string;
    country_code?: string;
    city?: string;
  }
) {
  try {
    const { error } = await supabase.from('security_threat_events').insert({
      threat_type: data.threat_type,
      severity: data.severity,
      ip_address: data.ip_address,
      target_path: data.target_path,
      http_method: data.http_method || 'GET',
      user_agent: data.user_agent || null,
      user_id: data.user_id || null,
      payload_preview: typeof data.payload_preview === 'string'
        ? { raw: data.payload_preview }
        : (data.payload_preview || {}),
      country_code: data.country_code || null,
      city: data.city || null,
      status: 'detected',
    });

    if (error) {
      console.error('[ThreatDetector] Error recording security threat event:', error);
    }
  } catch (err) {
    console.error('[ThreatDetector] Unexpected exception recording threat:', err);
  }
}
