# Picklers Console Separation & Security Architecture

## Overview
The Picklers platform implements an enterprise-grade **dual-console architecture** that strictly separates **Business Operations (Admin Console)** from **Technical Engineering (Developer Console)**.

```
                                  ┌───────────────────┐
                                  │   Player Portal   │
                                  │       /app        │
                                  └─────────┬─────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
        ┌─────────────────────────┐                   ┌─────────────────────────┐
        │  Business Admin Console │                   │ Developer Control Center│
        │       /app/admin        │                   │        /app/dev         │
        └────────────┬────────────┘                   └────────────┬────────────┘
                     │                                             │
                     ▼                                             ▼
         AdminGate / requireAdmin                     DevGate / requireDeveloper
                     │                                             │
                     ▼                                             ▼
          createAdminSupabase()                         createDevServiceSupabase()
        (Service Role Privileges)                     (Scoped Developer Client)
```

---

## 1. Domain Separation Principles

| Dimension | Business Admin Console (`/app/admin`) | Developer Control Center (`/app/dev`) |
| :--- | :--- | :--- |
| **Target Persona** | Operations Team, Finance Managers, Content Moderators, Support | Platform Engineers, SRE/DevOps, Security Engineers, Full-Stack Devs |
| **Primary Focus** | Business KPIs, court bookings, payouts, partner verifications | API telemetry, runtime logs, database schemas, feature flag targeting |
| **Role Column** | `player_profiles.admin_role` | `player_profiles.dev_role` |
| **Console Array** | `console_access: ['admin']` | `console_access: ['dev']` |
| **Access Gate** | `<AdminGate>` + `requireAdmin()` | `<DevGate>` + `requireDeveloper()` |
| **Visual Aesthetic** | Emerald / Slate Modern Glassmorphism | Cyan / Dark Slate High-Density Monospace |

---

## 2. Security & Privilege Escalation Defenses

### A. Service-Role Isolation
All elevated account mutations (e.g. promoting users to admin or granting developer privileges) are executed on the backend via dedicated service-role helper routines:
- `createAdminSupabase()` in `src/app/api/admin/_lib/createAdminSupabase.ts`
- `createDevServiceSupabase()` in `src/app/api/dev/_lib/createDevServiceSupabase.ts`

Client-side anon keys are strictly prohibited from bypassing Row Level Security (RLS) policies.

### B. Last Super Admin / Developer Safeguard
Both consoles enforce automated checks preventing the demotion or revocation of the last active `super_admin` or `super_developer`.

### C. Multi-Hop Rate Limiting
All administrative and developer API endpoints route through IP-aware sliding window rate limiters (`src/app/api/admin/_lib/rateLimit.ts`) with automatic memory cache garbage collection.

---

## 3. Telemetry & Observability Pipeline

Engineering tables persisted in Supabase:
- `developer_errors`: Unhandled runtime exceptions, stack traces, and manual incident reports.
- `developer_audit_logs`: Developer-initiated actions (flag toggles, diagnostic queries, environment overrides).
- `admin_audit_logs`: Administrative actions (refunds, role changes, verification decisions).
- `webhook_events`: Inbound and outbound webhook delivery logs with latency tracking.
- `feature_flags`: Dynamic flag rules with percentage rollouts and targeting filters.
