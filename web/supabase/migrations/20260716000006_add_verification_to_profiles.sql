ALTER TABLE public.player_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified';
