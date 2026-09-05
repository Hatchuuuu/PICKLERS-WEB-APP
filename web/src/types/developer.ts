export type DeveloperRole =
  | 'super_developer'
  | 'platform_engineer'
  | 'sre_devops'
  | 'backend_engineer'
  | 'frontend_engineer'
  | 'security_engineer'
  | 'developer_viewer';

export type Environment = 'development' | 'staging' | 'production' | 'sandbox';

export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface DependencyTelemetry {
  id: string;
  service: string;
  category: string;
  status: 'operational' | 'degraded' | 'outage';
  latency_ms: number;
  uptime_30d: string;
  last_check: string;
  details: string;
}

export interface SystemServiceHealth {
  id: string;
  name: string;
  category: 'core' | 'database' | 'auth' | 'payments' | 'notifications' | 'storage' | 'third_party';
  status: ServiceStatus;
  latency_ms: number;
  uptime_percentage: number;
  last_checked_at: string;
  details?: string;
}

export interface ApplicationLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: Environment;
  message: string;
  request_id?: string;
  trace_id?: string;
  user_id?: string;
  endpoint?: string;
  status_code?: number;
  metadata?: Record<string, unknown>;
}

export interface GroupedError {
  id: string;
  error_type: string;
  message: string;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  affected_endpoint?: string;
  affected_service: string;
  environment: Environment;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  stack_trace?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  event: string;
  destination_url: string;
  timestamp: string;
  attempt: number;
  max_attempts: number;
  status_code: number;
  response_time_ms: number;
  response_body?: string;
  status: 'delivered' | 'failed' | 'pending' | 'retrying';
  payload?: Record<string, unknown>;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  environment: Environment;
  rollout_percentage: number;
  targeting_rules?: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeveloperAuditLog {
  id: string;
  developer_id: string;
  action: string;
  category: 'system' | 'auth' | 'production_action' | 'feature_flag' | 'webhook' | 'database' | 'api_key';
  environment: Environment;
  target_type?: string;
  target_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  developer?: { name: string; email?: string; avatar_url?: string };
}

export type ThreatType =
  | 'honeypot_trap'
  | 'sqli_probe'
  | 'xss_probe'
  | 'privilege_escalation'
  | 'auth_brute_force'
  | 'idor_tampering'
  | 'path_traversal'
  | 'rate_limit_flood';

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ThreatStatus = 'detected' | 'mitigated' | 'blocked' | 'resolved' | 'ignored';

export interface ThreatEvent {
  id: string;
  threat_type: ThreatType;
  severity: ThreatSeverity;
  ip_address: string;
  country_code?: string;
  city?: string;
  user_agent?: string;
  user_id?: string;
  target_path: string;
  http_method: string;
  payload_preview?: Record<string, unknown> | string;
  status: ThreatStatus;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  user?: { id: string; name: string; avatar_url?: string };
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  threat_event_id?: string;
  blocked_by?: string;
  expires_at?: string;
  created_at: string;
}

export interface ThreatStats {
  defcon_level: 1 | 2 | 3 | 4 | 5;
  defcon_label: string;
  total_threats_24h: number;
  active_threats: number;
  blocked_ips_count: number;
  top_attack_vector: string;
  top_vectors: Array<{ type: string; count: number }>;
  timeline: Array<{ hour: string; count: number; critical: number }>;
  recent_countries: Array<{ country: string; count: number }>;
}
