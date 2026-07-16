-- Add role to player_profiles
ALTER TABLE public.player_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';
