-- =====================================================================
-- COLD-START SEED SCRIPT
-- =====================================================================
-- Run ONCE on initial production deployment.
-- Populates the app with realistic content for real users on launch day.
-- All rows tagged: is_seed=true, is_demo=false
--
-- These rows are AUTOMATICALLY PURGED by the pg_cron job
-- (check_and_purge_seed_data) once real user/facility thresholds are met:
--   > 20 real players/owners  OR  > 5 real facilities
--
-- NOTE: The seed player_profiles reference real auth.users entries
-- that cannot actually log in (dummy passwords). They are visible
-- in Community/Feed tabs to make the app feel alive on launch day.
-- =====================================================================

DO $$
DECLARE
  -- Seed player UUIDs (deterministic, internal accounts only)
  s_u1    uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  s_u2    uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;
  s_u3    uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid;
  s_u4    uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid;
  s_u5    uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid;
  s_u6    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;
  s_u7    uuid := '11111111-aaaa-bbbb-cccc-dddddddddddd'::uuid;
  s_u8    uuid := '22222222-aaaa-bbbb-cccc-dddddddddddd'::uuid;
  s_owner uuid := '99999999-aaaa-bbbb-cccc-dddddddddddd'::uuid;

  sf1_id int; sf2_id int; sf3_id int; sf4_id int; sf5_id int;
  sc1_id uuid; sc2_id uuid;
  sp1_id uuid; sp2_id uuid; sp3_id uuid;

BEGIN
  -- ---------------------------------------------------------------
  -- 1. SEED AUTH USERS (cannot actually log in — for display only)
  -- ---------------------------------------------------------------
  INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES
    (s_u1,    '00000000-0000-0000-0000-000000000000', 'carlo.reyes@seed.internal',   '{"full_name":"Carlo Reyes"}',          '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'90 days', now()),
    (s_u2,    '00000000-0000-0000-0000-000000000000', 'mia.santos@seed.internal',    '{"full_name":"Mia Santos"}',           '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'80 days', now()),
    (s_u3,    '00000000-0000-0000-0000-000000000000', 'james.lim@seed.internal',     '{"full_name":"James Lim"}',            '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'70 days', now()),
    (s_u4,    '00000000-0000-0000-0000-000000000000', 'anna.garcia@seed.internal',   '{"full_name":"Anna Garcia"}',          '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'60 days', now()),
    (s_u5,    '00000000-0000-0000-0000-000000000000', 'ben.tan@seed.internal',       '{"full_name":"Ben Tan"}',              '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'50 days', now()),
    (s_u6,    '00000000-0000-0000-0000-000000000000', 'lisa.vega@seed.internal',     '{"full_name":"Lisa Vega"}',            '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'40 days', now()),
    (s_u7,    '00000000-0000-0000-0000-000000000000', 'ryan.co@seed.internal',       '{"full_name":"Ryan Co"}',              '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'30 days', now()),
    (s_u8,    '00000000-0000-0000-0000-000000000000', 'grace.ong@seed.internal',     '{"full_name":"Grace Ong"}',            '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'20 days', now()),
    (s_owner, '00000000-0000-0000-0000-000000000000', 'seedowner@seed.internal',     '{"full_name":"Seed Facility Owner"}',  '$2a$10$seedXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'120 days', now())
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------
  -- 2. SEED PLAYER PROFILES (is_seed=true, is_demo=false)
  -- ---------------------------------------------------------------
  INSERT INTO public.player_profiles (id, name, level, gold_medals, silver_medals, bronze_medals, online, role, is_demo, is_seed, verification_status, avatar_url)
  VALUES
    (s_u1,    'Carlo Reyes',          '3.0', 3,  1,  5,  true,  'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=30'),
    (s_u2,    'Mia Santos',           '3.5', 7,  3,  2,  false, 'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=31'),
    (s_u3,    'James Lim',            '4.0', 11, 6,  4,  true,  'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=32'),
    (s_u4,    'Anna Garcia',          '2.5', 0,  0,  2,  true,  'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=33'),
    (s_u5,    'Ben Tan',              '3.5', 5,  8,  3,  false, 'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=34'),
    (s_u6,    'Lisa Vega',            '4.5', 20, 9,  7,  true,  'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=35'),
    (s_u7,    'Ryan Co',              '2.0', 0,  1,  0,  false, 'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=36'),
    (s_u8,    'Grace Ong',            '3.0', 4,  2,  6,  true,  'player', false, true, 'verified', 'https://i.pravatar.cc/150?img=37'),
    (s_owner, 'Seed Facility Owner',  '2.5', 0,  0,  0,  false, 'owner',  false, true, 'verified', 'https://i.pravatar.cc/150?img=38')
  ON CONFLICT (id) DO UPDATE
    SET name=EXCLUDED.name, level=EXCLUDED.level, gold_medals=EXCLUDED.gold_medals,
        silver_medals=EXCLUDED.silver_medals, bronze_medals=EXCLUDED.bronze_medals,
        online=EXCLUDED.online, is_seed=EXCLUDED.is_seed, avatar_url=EXCLUDED.avatar_url;

  -- ---------------------------------------------------------------
  -- 3. CLEANUP EXISTING SEED DATA (safe re-run)
  -- ---------------------------------------------------------------
  DELETE FROM public.feed_comments WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.feed_posts    WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.club_members  WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.clubs         WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.bookings      WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.matches       WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.courts        WHERE is_seed = true AND is_demo = false;
  DELETE FROM public.facilities    WHERE is_seed = true AND is_demo = false;

  -- ---------------------------------------------------------------
  -- 4. 5 SEED FACILITIES
  -- ---------------------------------------------------------------
  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (s_owner,'Central Pickleball Hub','Makati CBD','Indoor','2.1 km','8 min','20 min','6am – 10pm',350,4.7,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',false,true)
  RETURNING id INTO sf1_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (s_owner,'Open Air Courts Marikina','Marikina City','Outdoor','6.4 km','20 min','35 min','5am – 8pm',200,4.3,'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2940&auto=format&fit=crop',false,true)
  RETURNING id INTO sf2_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (s_owner,'BGC Smash Arena','Bonifacio Global City','Indoor','1.8 km','7 min','18 min','24 Hours',500,4.9,'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=2940&auto=format&fit=crop',false,true)
  RETURNING id INTO sf3_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (s_owner,'Eastside Courts QC','Quezon City','Outdoor','8.0 km','25 min','40 min','6am – 9pm',250,4.4,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',false,true)
  RETURNING id INTO sf4_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (s_owner,'South Metro Dinkers','Alabang','Indoor','14.0 km','35 min','50 min','7am – 11pm',450,4.6,'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2940&auto=format&fit=crop',false,true)
  RETURNING id INTO sf5_id;

  -- ---------------------------------------------------------------
  -- 5. 3 COURTS PER SEED FACILITY = 15 courts
  -- ---------------------------------------------------------------
  INSERT INTO public.courts (facility_id, name, surface, type, price, status, is_demo, is_seed)
  SELECT id, 'Court 1', 'Hard', 'Indoor', 180, 'available', false, true
  FROM public.facilities WHERE is_seed = true AND is_demo = false;

  INSERT INTO public.courts (facility_id, name, surface, type, price, status, is_demo, is_seed)
  SELECT id, 'Court 2', 'Hard', 'Indoor', 180, 'available', false, true
  FROM public.facilities WHERE is_seed = true AND is_demo = false;

  INSERT INTO public.courts (facility_id, name, surface, type, price, status, occupied_from, occupied_until, occupied_by, is_demo, is_seed)
  SELECT id, 'Court 3', 'Clay', 'Outdoor', 140, 'occupied', '09:00 AM', '11:00 AM', 'Marco V.', false, true
  FROM public.facilities WHERE is_seed = true AND is_demo = false;

  -- ---------------------------------------------------------------
  -- 6. 5 OPEN PLAY SESSIONS
  -- ---------------------------------------------------------------
  INSERT INTO public.matches (title, type, status, date, time, location, price, level, participants, max_participants, facility, court, players, created_by, is_demo, is_seed)
  VALUES
    ('Morning Doubles at BGC',        'Doubles','open',(CURRENT_DATE+5)::text, '07:30 AM','BGC Smash Arena',         350,'Intermediate',2,4, 'BGC Smash Arena',        'Court 1',jsonb_build_array(jsonb_build_object('id',s_u3::text,'name','James Lim',  'level','Intermediate','avatar','')),s_u3,false,true),
    ('All-Levels Social Play',         'Doubles','open',(CURRENT_DATE+7)::text, '10:00 AM','Open Air Courts Marikina',150,'All Levels',3,8, 'Open Air Courts Marikina','Court 2',jsonb_build_array(jsonb_build_object('id',s_u1::text,'name','Carlo Reyes','level','Intermediate','avatar','')),s_u1,false,true),
    ('Competitive Practice',           'Singles','open',(CURRENT_DATE+9)::text, '05:30 PM','Central Pickleball Hub', 300,'Advanced',    1,6, 'Central Pickleball Hub', 'Court 1',jsonb_build_array(jsonb_build_object('id',s_u6::text,'name','Lisa Vega',  'level','Advanced','avatar','')),s_u6,false,true),
    ('Beginners Welcome Play',         'Doubles','open',(CURRENT_DATE+6)::text, '09:00 AM','Eastside Courts QC',      120,'Beginner',    2,8, 'Eastside Courts QC',    'Court 2',jsonb_build_array(jsonb_build_object('id',s_u7::text,'name','Ryan Co',    'level','Beginner','avatar','')),s_u7,false,true),
    ('Evening Dink & Drink',           'Doubles','open',(CURRENT_DATE+8)::text, '07:00 PM','South Metro Dinkers',    250,'Intermediate',3,12,'South Metro Dinkers',   'Court 1',jsonb_build_array(jsonb_build_object('id',s_u5::text,'name','Ben Tan',    'level','Intermediate','avatar','')),s_u5,false,true);

  -- ---------------------------------------------------------------
  -- 7. 2 SEED CLUBS
  -- ---------------------------------------------------------------
  INSERT INTO public.clubs (name, description, member_count, admin_id, is_demo, is_seed)
  VALUES ('Metro Manila Picklers','The largest pickleball community in Metro Manila. Join us for weekly games and events!',87,s_u2,false,true)
  RETURNING id INTO sc1_id;

  INSERT INTO public.clubs (name, description, member_count, admin_id, is_demo, is_seed)
  VALUES ('Competitive Dribblers PH','Serious players, serious games. 3.5+ rating required to join.',34,s_u6,false,true)
  RETURNING id INTO sc2_id;

  -- ---------------------------------------------------------------
  -- 8. 3 SEED FEED POSTS WITH COMMENTS
  -- ---------------------------------------------------------------
  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (s_u2,'Welcome to Picklers! 🎉 Just booked my first court at Central Pickleball Hub and the experience was seamless. See you on the courts!',NULL,9,2,false,true)
  RETURNING id INTO sp1_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (s_u6,'Just finished a 2-hour session at BGC Smash Arena with the Competitive Dribblers crew. What a workout! The facilities are top-tier 💚','https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=800&auto=format&fit=crop',17,4,false,true)
  RETURNING id INTO sp2_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (s_u3,'Quick tip for beginners: focus on your soft game first. The dink rally wins matches, not the power shots. Happy playing everyone! 🏓',NULL,23,6,false,true)
  RETURNING id INTO sp3_id;

  -- Seed comments
  INSERT INTO public.feed_comments (post_id, author_id, content, is_demo, is_seed) VALUES
    (sp1_id, s_u3, 'Welcome! BGC Smash Arena is amazing too. Check it out next time!',          false, true),
    (sp1_id, s_u4, 'This app made booking so easy. Already loving it here!',                   false, true),
    (sp2_id, s_u1, 'Competitive Dribblers is the best club in PH — highly recommend!',         false, true),
    (sp2_id, s_u5, 'That session looked amazing! Can I join next time?',                       false, true),
    (sp3_id, s_u4, 'This is exactly what I needed to hear as a beginner. Thank you!',          false, true),
    (sp3_id, s_u7, 'Great tip! My third shot drop is definitely my biggest weakness too.',     false, true);

  RAISE NOTICE 'Cold-start seed data loaded successfully. % facilities, % courts, % matches, % clubs, % posts.',
    (SELECT COUNT(*) FROM public.facilities WHERE is_seed=true AND is_demo=false),
    (SELECT COUNT(*) FROM public.courts    WHERE is_seed=true AND is_demo=false),
    (SELECT COUNT(*) FROM public.matches   WHERE is_seed=true AND is_demo=false),
    (SELECT COUNT(*) FROM public.clubs     WHERE is_seed=true AND is_demo=false),
    (SELECT COUNT(*) FROM public.feed_posts WHERE is_seed=true AND is_demo=false);
END $$;
