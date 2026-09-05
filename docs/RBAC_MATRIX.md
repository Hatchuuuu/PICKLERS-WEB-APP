# Picklers Role-Based Access Control (RBAC) Matrix

## Overview
Picklers enforces strict role-based access across both the Business Admin Console and the Developer Control Center.

---

## 1. Business Admin Console Roles (`admin_role`)

| Role | Console Access | Key Permissions | Allowed API Scopes |
| :--- | :--- | :--- | :--- |
| **`super_admin`** | Full Admin Console | All business actions, promote/demote admins, settings, payouts, overrides | `*` |
| **`platform_admin`** | Full Admin Console | Manage facilities, promo codes, users, moderation, analytics | `facilities.*`, `users.*`, `promotions.*`, `analytics.view` |
| **`operations_admin`**| Operations & Facilities | Partner application approvals, court verification, booking management | `applications.*`, `facilities.*`, `bookings.*` |
| **`finance_admin`** | Finance & Reporting | Financial ledger, refund approvals, payout marking, promo code audit | `finance.*`, `bookings.refund`, `analytics.view` |
| **`moderator`** | Content & Users | Post moderation, chat review, user warnings, temporary bans | `moderation.*`, `users.view`, `users.ban` |

---

## 2. Developer Control Center Roles (`dev_role`)

| Role | Console Access | Key Permissions | Allowed API Scopes |
| :--- | :--- | :--- | :--- |
| **`super_developer`** | Full Dev Console | All engineering tools, promote/demote devs, raw diagnostics, flag mutations | `dev.*` |
| **`platform_engineer`**| Full Dev Console | Feature flags, environment config, webhook management, API explorer | `flags.*`, `webhooks.*`, `api_explorer.*` |
| **`sre_devops`** | Observability & Ops | Health telemetry, application logs, error management, incident logger | `health.*`, `logs.*`, `errors.*` |
| **`backend_engineer`** | APIs & Logs | API Explorer, DB inspector, error logs, user diagnostics | `logs.*`, `errors.*`, `api_explorer.*`, `inspector.*` |
| **`frontend_engineer`** | Observability & Flags | Error logs, feature flag viewer, user diagnostics | `logs.view`, `flags.view`, `errors.view` |
| **`security_engineer`** | Audit & Roles | Audit trail inspection, access reviews, role inspection | `audit.*`, `accounts.view` |
| **`developer_viewer`** | Read-Only Dev Console | Read-only access to health, logs, and public telemetry | `*.view` |

---

## 3. Database Representation

In Supabase `player_profiles`:
```sql
ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS console_access TEXT[] DEFAULT ARRAY['player']::TEXT[],
  ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dev_role TEXT DEFAULT NULL;
```
