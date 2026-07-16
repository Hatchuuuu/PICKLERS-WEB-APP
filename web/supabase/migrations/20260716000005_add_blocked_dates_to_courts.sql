ALTER TABLE public.courts
ADD COLUMN IF NOT EXISTS blocked_dates jsonb DEFAULT '[]'::jsonb;
