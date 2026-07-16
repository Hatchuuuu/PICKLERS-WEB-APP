-- =====================================================================
-- MIGRATION: 20260716000010_delete_policies.sql
-- Description: Implement missing FOR DELETE RLS policies across the 
--              entire database to enable proper CRUD functionality.
-- =====================================================================

-- ---------------------------------------------------------
-- 1. Core Platform (Facilities & Courts)
-- ---------------------------------------------------------
-- Facilities: Owners can delete their own facilities
DROP POLICY IF EXISTS "Owners can delete their own facilities" ON public.facilities;
CREATE POLICY "Owners can delete their own facilities" ON public.facilities FOR DELETE USING (auth.uid() = owner_id);

-- Courts: Facility owners can delete their courts
DROP POLICY IF EXISTS "Facility owners can delete courts" ON public.courts;
CREATE POLICY "Facility owners can delete courts" ON public.courts FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 2. Bookings & Requests
-- ---------------------------------------------------------
-- Booking Requests: Users can delete their own requests (withdraw), Facility owners can delete requests
DROP POLICY IF EXISTS "Users and facility owners can delete booking requests" ON public.booking_requests;
CREATE POLICY "Users and facility owners can delete booking requests" ON public.booking_requests FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- Bookings: Users can delete their own bookings (cancel), Facility owners can delete bookings
DROP POLICY IF EXISTS "Users and facility owners can delete bookings" ON public.bookings;
CREATE POLICY "Users and facility owners can delete bookings" ON public.bookings FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.facilities f WHERE f.id = facility_id AND f.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 3. Tournaments & Matches
-- ---------------------------------------------------------
-- Tournaments: Owners can delete their own tournaments
DROP POLICY IF EXISTS "Owners can delete their own tournaments" ON public.tournaments;
CREATE POLICY "Owners can delete their own tournaments" ON public.tournaments FOR DELETE USING (auth.uid() = owner_id);

-- Tournament Teams: Team captain (player1) can withdraw, or tournament owner can remove
DROP POLICY IF EXISTS "Captains and owners can delete tournament teams" ON public.tournament_teams;
CREATE POLICY "Captains and owners can delete tournament teams" ON public.tournament_teams FOR DELETE USING (
    player1_id = auth.uid() OR EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- Tournament Matches: Tournament owner can delete
DROP POLICY IF EXISTS "Owners can delete tournament matches" ON public.tournament_matches;
CREATE POLICY "Owners can delete tournament matches" ON public.tournament_matches FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- Match Games: Tournament owner can delete
DROP POLICY IF EXISTS "Owners can delete match games" ON public.match_games;
CREATE POLICY "Owners can delete match games" ON public.match_games FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.tournament_matches tm
        JOIN public.tournaments t ON t.id = tm.tournament_id
        WHERE tm.id = match_id AND t.owner_id = auth.uid()
    )
);

-- Matches: Owners can delete matches
DROP POLICY IF EXISTS "Owners can delete matches" ON public.matches;
CREATE POLICY "Owners can delete matches" ON public.matches FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.owner_id = auth.uid())
);

-- ---------------------------------------------------------
-- 4. Social & Profile
-- ---------------------------------------------------------
-- Notifications: Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Facility Applications: Users can delete their own applications
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.facility_applications;
CREATE POLICY "Users can delete their own applications" ON public.facility_applications FOR DELETE USING (auth.uid() = user_id);
