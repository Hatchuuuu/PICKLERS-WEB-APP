CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  match_format text NOT NULL,
  date text NOT NULL,
  participants integer NOT NULL,
  status text NOT NULL,
  players jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tournaments are viewable by everyone." ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own tournaments." ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own tournaments." ON public.tournaments FOR UPDATE USING (auth.uid() = owner_id);
