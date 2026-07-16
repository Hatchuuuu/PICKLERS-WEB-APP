-- =====================================================================
-- MIGRATION: 20260716000009_multi_tenant_architecture.sql
-- Description: Multi-tenant facility isolation, booking request tracking, 
--              and type mismatch resolution.
-- =====================================================================

-- ---------------------------------------------------------
-- 1. Resolve Type Mismatch
-- ---------------------------------------------------------
-- Downcast booking_requests.facility_id from BIGINT to INTEGER to match facilities.id
ALTER TABLE public.booking_requests ALTER COLUMN facility_id TYPE INTEGER USING facility_id::INTEGER;

-- ---------------------------------------------------------
-- 2. Multi-Tenant Facility Isolation
-- ---------------------------------------------------------
-- Add owner_id to facilities
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON public.facilities(owner_id);

-- Rewrite Facility RLS to strictly check owner_id instead of generic role='owner'
DROP POLICY IF EXISTS "Allow owner insert on facilities" ON public.facilities;
DROP POLICY IF EXISTS "Allow owner update on facilities" ON public.facilities;

CREATE POLICY "Owners can insert their own facilities" ON public.facilities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own facilities" ON public.facilities FOR UPDATE USING (auth.uid() = owner_id);

-- Rewrite Courts RLS to ensure court modifiers own the parent facility
DROP POLICY IF EXISTS "Allow owner insert on courts" ON public.courts;
DROP POLICY IF EXISTS "Allow owner update on courts" ON public.courts;

CREATE POLICY "Facility owners can insert courts" ON public.courts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);
CREATE POLICY "Facility owners can update courts" ON public.courts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- Rewrite Booking Requests RLS for owners
DROP POLICY IF EXISTS "Booking requests are viewable by facility owners." ON public.booking_requests;
DROP POLICY IF EXISTS "Owners can update booking requests." ON public.booking_requests;

CREATE POLICY "Facility owners can view booking requests" ON public.booking_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);
CREATE POLICY "Facility owners can update booking requests" ON public.booking_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 3. Player Booking Request Tracking
-- ---------------------------------------------------------
-- Add user_id to booking requests
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_booking_requests_user_id ON public.booking_requests(user_id);

-- Ensure users can insert requests tied to their own ID and view their own requests
DROP POLICY IF EXISTS "Authenticated users can insert booking requests." ON public.booking_requests;

CREATE POLICY "Users can insert own booking requests" ON public.booking_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own booking requests" ON public.booking_requests FOR SELECT USING (auth.uid() = user_id);
