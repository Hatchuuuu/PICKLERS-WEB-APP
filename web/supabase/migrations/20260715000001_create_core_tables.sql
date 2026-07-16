-- Create Facilities table
CREATE TABLE IF NOT EXISTS public.facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    rating NUMERIC(3, 1),
    price INTEGER NOT NULL,
    hours TEXT,
    distance TEXT,
    moto TEXT,
    car TEXT,
    image TEXT,
    favorited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Courts table
CREATE TABLE IF NOT EXISTS public.courts (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surface TEXT NOT NULL,
    type TEXT NOT NULL,
    price INTEGER NOT NULL,
    status TEXT DEFAULT 'available',
    occupied_until TEXT,
    occupied_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- Enable RLS
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read for MVP)
CREATE POLICY "Allow public read access on facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Allow public read access on courts" ON public.courts FOR SELECT USING (true);

-- Allow owners to insert/update
CREATE POLICY "Allow owner insert on facilities" ON public.facilities FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner update on facilities" ON public.facilities FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner insert on courts" ON public.courts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));
CREATE POLICY "Allow owner update on courts" ON public.courts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.player_profiles WHERE id = auth.uid() AND role = 'owner'));

-- Insert Seed Data for Facilities
INSERT INTO public.facilities (id, name, location, type, rating, price, hours, distance, moto, car, image, favorited) VALUES
(1, 'SM Southmall Picklepark', 'Las Piñas City', 'Indoor', 4.9, 500, '6am – 10pm', '2.1 km', '8 min', '15 min', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format', false),
(2, 'BGC Pickleball Hub', 'Bonifacio Global City, Taguig', 'Outdoor', 4.8, 400, '5am – 11pm', '5.4 km', '18 min', '30 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', true),
(3, 'Ayala Center Cebu Courts', 'Cebu City, Cebu', 'Indoor/Outdoor', 4.7, 350, '7am – 9pm', '1.2 km', '5 min', '10 min', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format', false);

-- Note: We reset the serial sequences based on the hardcoded IDs we just inserted.
SELECT setval('facilities_id_seq', (SELECT MAX(id) FROM facilities));
