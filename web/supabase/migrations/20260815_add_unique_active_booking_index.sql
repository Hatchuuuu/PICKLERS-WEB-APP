-- =================================================================
-- Migration: Add Partial Unique Index for Booking Concurrency Protection
-- Prevents double booking on the same court, date, and time slot
-- =================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_booking
ON public.bookings (facility_id, court_name, date, time)
WHERE status IN ('pending', 'upcoming', 'active', 'confirmed');
