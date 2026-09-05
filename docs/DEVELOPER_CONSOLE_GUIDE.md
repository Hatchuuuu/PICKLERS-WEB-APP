# Picklers Developer Control Center — Engineering Guide

## Overview
The **Developer Control Center** (`/app/dev`) provides engineering teams, DevOps, SREs, and backend developers with runtime observability, diagnostics, and integration management tools.

---

## Core Engineering Modules

### 1. Control Center (`/app/dev`)
- Cluster and service health indicators.
- API traffic rates, p95 latencies, error velocity gauges.
- Fast links to critical diagnostic tools.

### 2. System Health (`/app/dev/health`)
- Direct health checks against Supabase Database, Auth Services, Storage Buckets, and External Gateways.
- Service uptime statistics and incident timelines.

### 3. Application Logs (`/app/dev/logs`)
- Live streaming log viewer with severity level filtering (`info`, `warn`, `error`, `debug`).
- Service tag filtering (`auth`, `database`, `realtime`, `payment`, `worker`).
- Full-text regex search and timestamp pinning.

### 4. Error Intelligence & Incidents (`/app/dev/errors`)
- Grouped error stack traces, occurrence counters, and first/last seen timestamps.
- Status management (`unresolved`, `investigating`, `resolved`).
- Incident report logger.

### 5. API Explorer (`/app/dev/api-explorer`)
- Interactive REST request playground for testing platform routes.
- Automatic Authorization Bearer token header injection from active session.
- Response viewer with JSON syntax formatting and latency benchmarks.

### 6. Webhook Logs (`/app/dev/webhooks`)
- Audit incoming and outgoing webhook delivery payloads.
- Status code inspection and retry dispatch triggers.

### 7. Feature Flags (`/app/dev/flags`)
- Real-time feature toggle switches with mandatory audit reason prompts.
- Gradual percentage rollout slider (0% to 100%).
- Targeted rules and environment scoping (`production`, `staging`, `development`).

### 8. Entity & User Diagnostics (`/app/dev/entity-inspector` & `user-diagnostics`)
- Live database table schema inspection and row counters.
- User profile debugging: deep JSON view of session tokens, permissions, and booking history.

### 9. Account Roles & Access (`/app/dev/accounts`)
- Developer and engineering team privilege manager.
- Promote/demote developer roles (`platform_engineer`, `sre_devops`, `super_developer`).
