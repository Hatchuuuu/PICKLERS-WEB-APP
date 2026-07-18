-- =====================================================================
-- SCRIPT: SEED DEMO ACCOUNT DATA (HIGH ACTIVITY SIMULATION)
-- Purpose: Inserts a massive amount of mock facilities, courts, open 
--          plays, bookings, tournaments, and notifications to simulate
--          a highly popular, widely-used app.
-- =====================================================================

-- INSTRUCTIONS:
-- Run this entire script in the Supabase SQL Editor.
-- Make sure you have already signed up the "Demo" account via your app.
-- Change the email below to exactly match the demo account's email.

DO $$
DECLARE
  v_demo_user_id UUID := '3bc2beb5-d8e3-481a-9075-43e1e8723edb'; -- Using your exact UUID
  v_sm_id INTEGER;
  v_bgc_id INTEGER;
  v_makati_id INTEGER;
  v_cebu_id INTEGER;
  v_qc_id INTEGER;
  v_silliman_id INTEGER;
  v_dumaguete_id INTEGER;
  v_rizal_id INTEGER;
  v_negros_id INTEGER;
  v_valencia_id INTEGER;
  v_facility_names text[] := ARRAY[
    'Silliman Park Pickleball', 'Dumaguete Boulevard Courts', 'Rizal Boulevard Paddles', 'Negros Oriental Sports Hub', 
    'Valencia Hills Pickleball', 'Sibulan Coastal Courts', 'Bacong Arena', 'Dauin Beachfront Pickleball', 
    'Zamboanguita Paddles', 'Amlan Recreation Center', 'Tanjay City Pickleball Club', 'Bais City Courts', 
    'Mabinay Springs Pickleball', 'Manjuyod Sandbar Paddles', 'Apo Island Resort Courts'
  ];
BEGIN

  -- 1. CLEANUP PREVIOUS MOCK DATA (prevents duplicates on re-run)
  DELETE FROM public.facilities WHERE name IN ('Makati Prime Pickleball', 'BGC Pickleball Hub', 'SM Southmall Picklepark', 'Ayala Center Cebu Courts', 'QC Memorial Circle Pickle Club');
  DELETE FROM public.facilities WHERE name = ANY(v_facility_names);
  DELETE FROM public.tournaments WHERE name IN ('Manila Grand Slam 2026', 'BGC Amateur Open', 'Philippine National Championship', 'Cebu Summer Classic (Completed)');

  -- 2. MASSIVE WALLET & VIP STATUS
  UPDATE public.wallets SET balance = 150000 WHERE user_id = v_demo_user_id;
  UPDATE public.player_profiles SET role = 'owner', level = '5.0', gold_medals = 12, silver_medals = 4, bronze_medals = 2, verification_status = 'verified' WHERE id = v_demo_user_id;

  -- 3. PREMIUM FACILITIES (Exactly 10 Facilities Total)
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('SM Southmall Picklepark', 'Las Piñas City', 'Indoor', 4.9, 500, '6am – 10pm', '2.1 km', '8 min', '15 min', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format', true, v_demo_user_id) RETURNING id INTO v_sm_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('BGC Pickleball Hub', 'Bonifacio Global City, Taguig', 'Outdoor', 4.8, 400, '5am – 11pm', '5.4 km', '18 min', '30 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', true, v_demo_user_id) RETURNING id INTO v_bgc_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Ayala Center Cebu Courts', 'Cebu City, Cebu', 'Indoor/Outdoor', 4.7, 350, '7am – 9pm', '1.2 km', '5 min', '10 min', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_cebu_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('QC Memorial Circle Pickle Club', 'Quezon City', 'Outdoor', 4.6, 200, '5am – 9pm', '12 km', '30 min', '45 min', 'https://images.unsplash.com/photo-1599474924156-f567b4c6e395?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_qc_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Makati Prime Pickleball', 'Makati City', 'Indoor', 5.0, 800, '24 Hours', '8 km', '20 min', '35 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', true, v_demo_user_id) RETURNING id INTO v_makati_id;

  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Silliman Park Pickleball', 'Silliman Avenue, Dumaguete', 'Outdoor', 4.1, 310, '6am – 10pm', '5 km', '10 min', '20 min', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_silliman_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Dumaguete Boulevard Courts', 'Rizal Boulevard, Dumaguete', 'Indoor', 4.2, 320, '6am – 10pm', '6 km', '15 min', '25 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_dumaguete_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Rizal Boulevard Paddles', 'Dumaguete Coastal Road', 'Outdoor', 4.3, 330, '6am – 10pm', '7 km', '20 min', '30 min', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_rizal_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Negros Oriental Sports Hub', 'Capitol Area, Dumaguete', 'Indoor', 4.4, 340, '6am – 10pm', '8 km', '25 min', '35 min', 'https://images.unsplash.com/photo-1599474924156-f567b4c6e395?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_negros_id;
  
  INSERT INTO public.facilities (name, location, type, rating, price, hours, distance, moto, car, image, favorited, owner_id) VALUES
  ('Valencia Hills Pickleball', 'Valencia, Negros Oriental', 'Outdoor', 4.5, 350, '6am – 10pm', '9 km', '30 min', '40 min', 'https://images.unsplash.com/photo-1622279486466-1e9b7c60d7c1?w=600&h=400&fit=crop&auto=format', false, v_demo_user_id) RETURNING id INTO v_valencia_id;

  -- 4. COURT INVENTORY (Each facility has at least 4 courts)
  -- Makati Prime (8 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status, occupied_by, occupied_until) VALUES
  (v_makati_id, 'Court 1 (Championship)', 'Hardwood', 'Indoor', 1000, 'occupied', 'John Doe', TO_CHAR(NOW() - INTERVAL '5 minutes', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
  (v_makati_id, 'Court 2', 'Hardwood', 'Indoor', 800, 'occupied', 'Jane Smith', TO_CHAR(NOW() + INTERVAL '6 seconds', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
  (v_makati_id, 'Court 3', 'Hardwood', 'Indoor', 800, 'occupied', 'Mike T.', TO_CHAR(NOW() + INTERVAL '51 seconds', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
  (v_makati_id, 'Court 4', 'Hardwood', 'Indoor', 800, 'available', null, null),
  (v_makati_id, 'VIP Glass Court 1', 'Acrylic', 'Indoor', 1200, 'available', null, null),
  (v_makati_id, 'VIP Glass Court 2', 'Acrylic', 'Indoor', 1200, 'maintenance', null, null),
  (v_makati_id, 'VIP Glass Court 3', 'Acrylic', 'Indoor', 1200, 'occupied', 'Sarah J.', TO_CHAR(NOW() + INTERVAL '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
  (v_makati_id, 'VIP Glass Court 4', 'Acrylic', 'Indoor', 1200, 'available', null, null);

  -- SM Southmall (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_sm_id, 'Court 1', 'Hardwood', 'Indoor', 500, 'available'),
  (v_sm_id, 'Court 2', 'Hardwood', 'Indoor', 500, 'occupied'),
  (v_sm_id, 'Court 3', 'Hardwood', 'Indoor', 500, 'available'),
  (v_sm_id, 'Court 4', 'Hardwood', 'Indoor', 500, 'maintenance');

  -- BGC Pickleball Hub (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_bgc_id, 'Alpha Court', 'Acrylic', 'Outdoor', 400, 'available'),
  (v_bgc_id, 'Beta Court', 'Acrylic', 'Outdoor', 400, 'available'),
  (v_bgc_id, 'Gamma Court', 'Acrylic', 'Outdoor', 400, 'occupied'),
  (v_bgc_id, 'Delta Court', 'Acrylic', 'Outdoor', 400, 'available');

  -- Ayala Center Cebu (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_cebu_id, 'Center Court 1', 'Hardwood', 'Indoor', 350, 'available'),
  (v_cebu_id, 'Center Court 2', 'Hardwood', 'Indoor', 350, 'available'),
  (v_cebu_id, 'Center Court 3', 'Hardwood', 'Indoor', 350, 'occupied'),
  (v_cebu_id, 'Center Court 4', 'Hardwood', 'Indoor', 350, 'available');

  -- QC Memorial Circle (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_qc_id, 'Public Court A', 'Concrete', 'Outdoor', 200, 'occupied'),
  (v_qc_id, 'Public Court B', 'Concrete', 'Outdoor', 200, 'available'),
  (v_qc_id, 'Public Court C', 'Concrete', 'Outdoor', 200, 'available'),
  (v_qc_id, 'Public Court D', 'Concrete', 'Outdoor', 200, 'maintenance');

  -- Silliman Park (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_silliman_id, 'Court 1', 'Concrete', 'Outdoor', 310, 'available'),
  (v_silliman_id, 'Court 2', 'Concrete', 'Outdoor', 310, 'occupied'),
  (v_silliman_id, 'Court 3', 'Concrete', 'Outdoor', 310, 'available'),
  (v_silliman_id, 'Court 4', 'Concrete', 'Outdoor', 310, 'available');

  -- Dumaguete Boulevard (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_dumaguete_id, 'Court 1', 'Hardwood', 'Indoor', 320, 'available'),
  (v_dumaguete_id, 'Court 2', 'Hardwood', 'Indoor', 320, 'available'),
  (v_dumaguete_id, 'Court 3', 'Hardwood', 'Indoor', 320, 'occupied'),
  (v_dumaguete_id, 'Court 4', 'Hardwood', 'Indoor', 320, 'available');

  -- Rizal Boulevard Paddles (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_rizal_id, 'Paddles 1', 'Concrete', 'Outdoor', 330, 'available'),
  (v_rizal_id, 'Paddles 2', 'Concrete', 'Outdoor', 330, 'available'),
  (v_rizal_id, 'Paddles 3', 'Concrete', 'Outdoor', 330, 'maintenance'),
  (v_rizal_id, 'Paddles 4', 'Concrete', 'Outdoor', 330, 'available');

  -- Negros Oriental Sports Hub (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_negros_id, 'Hub Court 1', 'Hardwood', 'Indoor', 340, 'available'),
  (v_negros_id, 'Hub Court 2', 'Hardwood', 'Indoor', 340, 'occupied'),
  (v_negros_id, 'Hub Court 3', 'Hardwood', 'Indoor', 340, 'available'),
  (v_negros_id, 'Hub Court 4', 'Hardwood', 'Indoor', 340, 'available');

  -- Valencia Hills (4 courts)
  INSERT INTO public.courts (facility_id, name, surface, type, price, status) VALUES
  (v_valencia_id, 'Hills 1', 'Concrete', 'Outdoor', 350, 'available'),
  (v_valencia_id, 'Hills 2', 'Concrete', 'Outdoor', 350, 'available'),
  (v_valencia_id, 'Hills 3', 'Concrete', 'Outdoor', 350, 'available'),
  (v_valencia_id, 'Hills 4', 'Concrete', 'Outdoor', 350, 'occupied');


  -- 5. HIGH-TRAFFIC OPEN PLAY MATCHES
  INSERT INTO public.matches (title, type, status, date, time, location, price, level, participants, max_participants, facility, court, players, created_by, facility_id) VALUES
  ('Friday Night Smash (Pros Only)', 'Competitive', 'full', '2026-07-24', '7:00 PM - 9:00 PM', 'Makati City', 800, '5.0', 4, 4, 'Makati Prime Pickleball', 'VIP Glass Court 1', '[{"name": "Demo User", "level": "5.0"}, {"name": "Carlos M.", "level": "5.0"}, {"name": "Sarah J.", "level": "4.5"}, {"name": "Mike T.", "level": "5.0"}]'::jsonb, v_demo_user_id, v_makati_id),
  ('Weekend Casual Play', 'Casual', 'open', '2026-07-25', '8:00 AM - 10:00 AM', 'Bonifacio Global City', 150, '2.5', 2, 8, 'BGC Pickleball Hub', 'Alpha Court', '[{"name": "Demo User", "level": "5.0"}, {"name": "Newbie Rob", "level": "2.0"}]'::jsonb, v_demo_user_id, v_bgc_id),
  ('Midnight Madness Drilling', 'Drills', 'open', '2026-07-26', '12:00 AM - 2:00 AM', 'Las Piñas City', 200, 'All Levels', 6, 12, 'SM Southmall Picklepark', 'Court 2', '[{"name": "Demo User", "level": "5.0"}, {"name": "NightOwl99", "level": "3.5"}]'::jsonb, v_demo_user_id, v_sm_id),
  ('Singles Showdown', 'Competitive', 'in_progress', '2026-07-18', '2:00 PM - 4:00 PM', 'Makati City', 1000, '4.5', 2, 2, 'Makati Prime Pickleball', 'VIP Glass Court 2', '[{"name": "Demo User", "level": "5.0"}, {"name": "Rival", "level": "4.5"}]'::jsonb, v_demo_user_id, v_makati_id);

  -- 6. BUSY BOOKING SCHEDULE
  INSERT INTO public.bookings (user_id, facility_id, court_name, date, time, duration, price, status) VALUES
  (v_demo_user_id, v_sm_id, 'Court 1 (Championship)', '2026-07-26', '5:00 PM - 7:00 PM', '2h', 1200, 'upcoming'),
  (v_demo_user_id, v_bgc_id, 'Alpha Court', '2026-07-28', '6:00 AM - 8:00 AM', '2h', 800, 'upcoming'),
  (v_demo_user_id, v_sm_id, 'Court 3', '2026-07-10', '10:00 AM - 12:00 PM', '2h', 1000, 'completed'),
  (v_demo_user_id, v_bgc_id, 'Beta Court', '2026-07-12', '4:00 PM - 6:00 PM', '2h', 800, 'completed'),
  (v_demo_user_id, v_sm_id, 'Court 4', '2026-07-15', '1:00 PM - 3:00 PM', '2h', 1000, 'cancelled');

  -- 7. PENDING BOOKING REQUESTS
  INSERT INTO public.booking_requests (user_id, player_name, facility_id, court_name, date, time, total, status) VALUES
  (NULL, 'John Doe (Pro Player)', v_makati_id, 'VIP Glass Court 1', '2026-08-01', '6:00 PM - 8:00 PM', 2000, 'pending'),
  (NULL, 'Corporate Team Building', v_makati_id, 'VIP Glass Court 1 & 2', '2026-08-05', '1:00 PM - 5:00 PM', 8000, 'pending');

  -- 8. NATIONWIDE TOURNAMENTS
  INSERT INTO public.tournaments (name, type, match_format, date, participants, status, players, owner_id) VALUES
  ('Manila Grand Slam 2026', 'Open', 'Double Elimination', '2026-08-15', 32, 'registration_open', '[]'::jsonb, v_demo_user_id),
  ('BGC Amateur Open', 'Amateur', 'Round Robin', '2026-09-01', 16, 'in_progress', '[]'::jsonb, v_demo_user_id),
  ('Philippine National Championship', 'Pro', 'Double Elimination', '2026-12-10', 64, 'registration_closed', '[]'::jsonb, v_demo_user_id),
  ('Cebu Summer Classic (Completed)', 'Intermediate', 'Single Elimination', '2026-04-15', 32, 'completed', '[]'::jsonb, v_demo_user_id);

  -- 9. ACTIVE NOTIFICATION INBOX
  INSERT INTO public.notifications (user_id, title, body, type, read) VALUES
  (v_demo_user_id, 'Welcome to Picklers MVP Edition!', 'Your Demo account is fully populated with massive amounts of data. Explore facilities, tournaments, and open plays!', 'system', false),
  (v_demo_user_id, 'Booking Confirmed', 'Your court booking at SM Southmall Picklepark for July 26 is confirmed.', 'booking', false),
  (v_demo_user_id, 'New Booking Request', 'John Doe requested VIP Glass Court 1 at Makati Prime Pickleball for Aug 1. Please review.', 'system', false),
  (v_demo_user_id, 'Tournament Almost Full', 'Manila Grand Slam 2026 has 28/32 slots filled. Registration closes soon.', 'community', true),
  (v_demo_user_id, 'Wallet Top Up Successful', '50,000 Pickles Coins have been added to your wallet via Promo Code: VIP-DEMO', 'system', true);

END $$;
