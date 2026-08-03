-- Facility Applications Table
CREATE TABLE IF NOT EXISTS public.facility_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_name TEXT NOT NULL,
    address TEXT NOT NULL,
    courts_count INTEGER DEFAULT 1 NOT NULL,
    surface_type TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_permit_url TEXT,
    proof_of_identity_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.facility_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own applications" ON public.facility_applications;
CREATE POLICY "Users can insert own applications" ON public.facility_applications FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view own applications" ON public.facility_applications;
CREATE POLICY "Users can view own applications" ON public.facility_applications FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'admin');
