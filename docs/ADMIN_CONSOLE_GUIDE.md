# Picklers Business Admin Console — Operational Guide

## Overview
The **Business Admin Console** (`/app/admin`) gives operational leaders and customer support managers full control over daily operations, court partners, bookings, users, and financial records.

---

## Key Modules & Workflows

### 1. Control Center (`/app/admin`)
- Real-time business KPI cards (Gross Revenue, Active Courts, Confirmed Bookings, Player Growth).
- Live activity feed showing partner applications and high-value reservations.

### 2. Partner Applications (`/app/admin/applications`)
- **Inspection**: View applicant details, business permit documents, and government IDs in the side drawer.
- **Actions**: Approve, Reject, or Request Revision with custom feedback notes.
- **Internal Staff Notes**: Record private staff verification notes and background checks.
- **Bulk Operations**: Multi-select pending applications to batch-approve or batch-reject in one action.

### 3. Bookings & Reservations (`/app/admin/bookings`)
- View booking status across all facilities.
- **Administrative Override**: Cancel reservations due to weather closures or maintenance.
- **Administrative Refunds**: Issue immediate full refunds with recorded audit reason and Supabase ledger synchronization.

### 4. User Directory & Roles (`/app/admin/users`)
- Search by player name, email, or user ID.
- **Account Moderation**: Ban or unban bad actors.
- **Role Assignment**: Grant specific Admin roles (`moderator`, `operations_admin`, `finance_admin`, `platform_admin`, `super_admin`) directly from the user drawer.
- **CSV Data Export**: Generate and download filtered user reports.

### 5. Financial Ledger & Payouts (`/app/admin/finance`)
- Track daily transactions, platform commission fees (10%), and court owner balances.
- Mark facility payouts as paid with reference IDs.

### 6. Promo Codes (`/app/admin/promotions`)
- Create percentage or fixed-amount discounts with usage limits and expiration dates.

### 7. Analytics BI (`/app/admin/analytics`)
- Aggregated platform analytics: 30-day revenue trends, peak booking hours, top performing sports clubs.

### 8. Business Audit Trail (`/app/admin/audit-log`)
- Complete immutable log of administrative actions, timestamps, and staff accounts.
