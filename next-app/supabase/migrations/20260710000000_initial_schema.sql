-- ====================================================================
-- 1. EXTENSIONS & ENUMS
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE booking_status AS ENUM ('upcoming', 'completed', 'cancelled', 'pending_payment');
CREATE TYPE payment_method AS ENUM ('Credit Card', 'GCash', 'Pickle Credits', 'Cash on Site');
CREATE TYPE match_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Open');

-- ====================================================================
-- 2. TABLES
-- ====================================================================

-- PROFILES (Linked to Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'player' CHECK (role IN ('player', 'owner', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FACILITIES
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 5.0,
    base_price NUMERIC(10, 2) NOT NULL,
    operating_hours TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURTS (Belong to a Facility)
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    surface TEXT NOT NULL,
    type TEXT NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS (Prevents double booking via Exclusion Constraint)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status booking_status DEFAULT 'upcoming',
    payment_type payment_method,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    CONSTRAINT prevent_double_booking EXCLUDE USING gist (
        court_id WITH =,
        tsrange(start_time, end_time) WITH &&
    )
);

-- OPEN MATCHES (Social Play)
CREATE TABLE open_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    level match_level NOT NULL,
    total_slots INTEGER NOT NULL,
    available_slots INTEGER NOT NULL,
    price_per_player NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT available_slots_check CHECK (available_slots >= 0)
);

-- ====================================================================
-- 3. INDEXES (For 100k User Scale)
-- ====================================================================

CREATE INDEX idx_facilities_location ON facilities(location);
CREATE INDEX idx_courts_facility_id ON courts(facility_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_time_range ON bookings USING gist (tsrange(start_time, end_time));
CREATE INDEX idx_open_matches_facility ON open_matches(facility_id);

-- ====================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_matches ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles (for social features), but only update their own.
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ====================================================================
-- SECURE BOOKING RPC
-- ====================================================================
-- Users cannot directly INSERT into the bookings table to prevent price spoofing.
-- They must call this RPC, which fetches the immutable base_price from the facility.

CREATE OR REPLACE FUNCTION create_secure_booking(
  p_court_id UUID, 
  p_time_range tsrange
) RETURNS UUID AS $$
DECLARE
  v_base_price NUMERIC;
  v_duration_hours NUMERIC;
  v_total_amount NUMERIC;
  v_booking_id UUID;
BEGIN
  -- Fetch the real base_price from the facility
  SELECT f.base_price INTO v_base_price 
  FROM courts c JOIN facilities f ON c.facility_id = f.id 
  WHERE c.id = p_court_id;

  IF v_base_price IS NULL THEN
    RAISE EXCEPTION 'Invalid court or facility not found';
  END IF;

  -- Calculate precise hours from tsrange
  v_duration_hours := EXTRACT(EPOCH FROM upper(p_time_range) - lower(p_time_range)) / 3600;
  v_total_amount := v_base_price * v_duration_hours;

  -- Safely insert the booking
  INSERT INTO bookings (user_id, court_id, start_time, end_time, total_amount, status)
  VALUES (auth.uid(), p_court_id, lower(p_time_range), upper(p_time_range), v_total_amount, 'upcoming')
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Facilities: Anyone can view, only Owners can insert/update.
CREATE POLICY "Facilities are viewable by everyone" ON facilities FOR SELECT USING (true);
CREATE POLICY "Owners can manage their facilities" ON facilities FOR ALL USING (auth.uid() = owner_id);

-- Courts: Anyone can view, only Facility Owners can manage.
CREATE POLICY "Courts are viewable by everyone" ON courts FOR SELECT USING (true);
CREATE POLICY "Owners can manage their courts" ON courts FOR ALL USING (
    EXISTS (SELECT 1 FROM facilities WHERE id = courts.facility_id AND owner_id = auth.uid())
);

-- Bookings: Users can view and manage their own bookings. Facilities can see bookings for their courts.
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can view bookings for their facilities" ON bookings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM courts c
        JOIN facilities f ON c.facility_id = f.id
        WHERE c.id = bookings.court_id AND f.owner_id = auth.uid()
    )
);
-- INSERT access removed for direct queries to prevent price spoofing. Bookings MUST go through `create_secure_booking` RPC.
CREATE POLICY "Users can only cancel upcoming bookings" ON bookings FOR UPDATE 
USING (auth.uid() = user_id AND status = 'upcoming') 
WITH CHECK (status = 'cancelled');

-- Open Matches: Viewable by all, manageable by host.
CREATE POLICY "Open matches are viewable by everyone" ON open_matches FOR SELECT USING (true);
CREATE POLICY "Hosts can manage their open matches" ON open_matches FOR ALL USING (auth.uid() = host_id);

-- ====================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ====================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_modtime BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courts_modtime BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_modtime BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_open_matches_modtime BEFORE UPDATE ON open_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create profile on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
