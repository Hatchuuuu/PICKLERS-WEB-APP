-- =====================================================================
-- ENHANCED DEMO SEED SCRIPT v2
-- =====================================================================
-- Run this AFTER setup_all.sql.
-- Requires: demoaccount@gmail.com account to exist in auth.users
--           (created manually in Supabase Auth Dashboard).
-- All data tagged: is_demo=true, is_seed=false
-- Re-runnable: deletes & re-inserts all demo data on each run.
-- =====================================================================

DO $$
DECLARE
  -- Deterministic mock player UUIDs
  mock_u1    uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  mock_u2    uuid := '22222222-2222-2222-2222-222222222222'::uuid;
  mock_u3    uuid := '33333333-3333-3333-3333-333333333333'::uuid;
  mock_u4    uuid := '44444444-4444-4444-4444-444444444444'::uuid;
  mock_u5    uuid := '55555555-5555-5555-5555-555555555555'::uuid;
  mock_u6    uuid := '66666666-6666-6666-6666-666666666666'::uuid;
  mock_owner uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  demo_uid   uuid;

  -- Facility IDs
  f1_id  int; f2_id  int; f3_id  int; f4_id  int; f5_id  int;
  f6_id  int; f7_id  int; f8_id  int; f9_id  int; f10_id int;

  -- Post IDs for comments
  post1_id uuid; post2_id uuid; post3_id uuid; post4_id uuid; post5_id uuid;
  club1_id uuid; club2_id uuid; club3_id uuid;

BEGIN
  -- ---------------------------------------------------------------
  -- 1. RESOLVE DEMO USER UUID
  -- ---------------------------------------------------------------
  SELECT id INTO demo_uid
  FROM auth.users
  WHERE email = 'demoaccount@gmail.com'
  LIMIT 1;

  IF demo_uid IS NULL THEN
    demo_uid := '77777777-7777-7777-7777-777777777777'::uuid;
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
    VALUES (demo_uid, '00000000-0000-0000-0000-000000000000', 'demoaccount@gmail.com', '{"full_name":"Demo Player"}', '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ---------------------------------------------------------------
  -- 2. INSERT MOCK AUTH USERS (idempotent)
  -- ---------------------------------------------------------------
  INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES
    (mock_u1,    '00000000-0000-0000-0000-000000000000', 'alex.johnson@demo.internal',    '{"full_name":"Alex Johnson"}',         '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'30 days', now()),
    (mock_u2,    '00000000-0000-0000-0000-000000000000', 'sarah.williams@demo.internal',  '{"full_name":"Sarah Williams"}',       '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'25 days', now()),
    (mock_u3,    '00000000-0000-0000-0000-000000000000', 'michael.chen@demo.internal',    '{"full_name":"Michael Chen"}',         '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'20 days', now()),
    (mock_u4,    '00000000-0000-0000-0000-000000000000', 'jessica.davis@demo.internal',   '{"full_name":"Jessica Davis"}',        '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'15 days', now()),
    (mock_u5,    '00000000-0000-0000-0000-000000000000', 'marco.reyes@demo.internal',     '{"full_name":"Marco Reyes"}',          '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'10 days', now()),
    (mock_u6,    '00000000-0000-0000-0000-000000000000', 'nina.santos@demo.internal',     '{"full_name":"Nina Santos"}',          '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'5  days', now()),
    (mock_owner, '00000000-0000-0000-0000-000000000000', 'owner@demo.internal',           '{"full_name":"Elite Court Owner"}',    '$2a$10$demoXXXXXXXXXXXXXXXXXX', now(), 'authenticated', 'authenticated', now()-interval'60 days', now())
  ON CONFLICT (id) DO NOTHING;

  -- ---------------------------------------------------------------
  -- 3. PLAYER PROFILES
  -- ---------------------------------------------------------------
  -- Demo user profile: role='demo', is_demo=true, auto-verified
  INSERT INTO public.player_profiles (id, name, level, role, is_demo, is_seed, verification_status, avatar_url)
  VALUES (demo_uid, 'Demo Player', '3.5', 'demo', true, false, 'verified', 'https://i.pravatar.cc/150?img=5')
  ON CONFLICT (id) DO UPDATE
    SET role='demo', is_demo=true, is_seed=false, verification_status='verified', level='3.5', avatar_url='https://i.pravatar.cc/150?img=5';

  -- Mock player profiles
  INSERT INTO public.player_profiles (id, name, level, gold_medals, silver_medals, bronze_medals, online, role, is_demo, is_seed, verification_status, avatar_url)
  VALUES
    (mock_u1,    'Alex Johnson',         '3.5', 12, 5,  3,  true,  'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=11'),
    (mock_u2,    'Sarah Williams',       '4.0', 24, 12, 8,  false, 'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=12'),
    (mock_u3,    'Michael Chen',         '3.0', 2,  4,  1,  true,  'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=13'),
    (mock_u4,    'Jessica Davis',        '4.5', 8,  10, 2,  true,  'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=14'),
    (mock_u5,    'Marco Reyes',          '2.5', 0,  2,  4,  false, 'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=15'),
    (mock_u6,    'Nina Santos',          '5.0', 31, 18, 10, true,  'player', true, false, 'verified', 'https://i.pravatar.cc/150?img=16'),
    (mock_owner, 'Elite Court Owner',    '5.5+',0,  0,  0,  true,  'owner',  true, false, 'verified', 'https://i.pravatar.cc/150?img=20')
  ON CONFLICT (id) DO UPDATE
    SET name=EXCLUDED.name, level=EXCLUDED.level, gold_medals=EXCLUDED.gold_medals,
        silver_medals=EXCLUDED.silver_medals, bronze_medals=EXCLUDED.bronze_medals,
        online=EXCLUDED.online, role=EXCLUDED.role, is_demo=EXCLUDED.is_demo,
        is_seed=EXCLUDED.is_seed, verification_status=EXCLUDED.verification_status,
        avatar_url=EXCLUDED.avatar_url;

  -- ---------------------------------------------------------------
  -- 4. WALLETS
  -- ---------------------------------------------------------------
  INSERT INTO public.wallets (user_id, balance)
  VALUES
    (demo_uid,   5000),
    (mock_u1,    3200),
    (mock_u2,    8500),
    (mock_u3,    1200),
    (mock_u4,    4700),
    (mock_u5,     900),
    (mock_u6,   12000),
    (mock_owner,50000)
  ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;

  -- ---------------------------------------------------------------
  -- 5. CLEANUP OLD DEMO DATA (re-run safety — wipe & reinsert)
  -- ---------------------------------------------------------------
  DELETE FROM public.feed_likes     WHERE is_demo = true;
  DELETE FROM public.feed_comments  WHERE is_demo = true;
  DELETE FROM public.feed_posts     WHERE is_demo = true;
  DELETE FROM public.club_members   WHERE is_demo = true;
  DELETE FROM public.clubs          WHERE is_demo = true;
  DELETE FROM public.direct_messages
    WHERE sender_id   IN (mock_u1,mock_u2,mock_u3,mock_u4,mock_u5,mock_u6,mock_owner,demo_uid)
       OR receiver_id IN (mock_u1,mock_u2,mock_u3,mock_u4,mock_u5,mock_u6,mock_owner,demo_uid);
  DELETE FROM public.bookings       WHERE is_demo = true;
  DELETE FROM public.matches        WHERE is_demo = true;
  DELETE FROM public.courts         WHERE is_demo = true;
  DELETE FROM public.facilities     WHERE is_demo = true;

  -- ---------------------------------------------------------------
  -- 6. 10 FACILITIES (all owned by mock_owner, is_demo=true)
  -- ---------------------------------------------------------------
  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Metro Smashers Hub','BGC, Taguig','Indoor','1.2 km','5 min','15 min','6am – 10pm',400,4.8,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f1_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Green Valley Courts','Quezon City','Outdoor','5.1 km','25 min','45 min','5am – 9pm',300,4.5,'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f2_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Elite Pickleball Center','Makati City','Indoor','8.2 km','35 min','1 hr','24 Hours',600,4.9,'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f3_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Sunrise Pickle Club','Pasig City','Outdoor','3.5 km','10 min','25 min','6am – 8pm',250,4.3,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f4_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'The Dink Lounge','Alabang, Muntinlupa','Indoor','15.0 km','40 min','50 min','8am – 12am',500,4.7,'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f5_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Riverfront Courts','Marikina','Outdoor','9.0 km','25 min','40 min','6am – 6pm',200,4.1,'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f6_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Bayview Pickleball','Pasay City','Indoor','6.5 km','20 min','35 min','6am – 10pm',450,4.6,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f7_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Ortigas Paddle Club','Ortigas Center','Indoor','4.0 km','15 min','30 min','7am – 11pm',550,4.8,'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f8_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'Southside Smash','Paranaque','Outdoor','12.0 km','30 min','45 min','5am – 9pm',300,4.4,'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f9_id;

  INSERT INTO public.facilities (owner_id, name, location, type, distance, moto, car, hours, price, rating, image, is_demo, is_seed)
  VALUES (mock_owner,'San Juan Dinkers','San Juan City','Indoor','3.0 km','10 min','20 min','6am – 10pm',350,4.5,'https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=2940&auto=format&fit=crop',true,false)
  RETURNING id INTO f10_id;

  -- ---------------------------------------------------------------
  -- 7. 3 COURTS PER FACILITY = 30 courts total
  -- ---------------------------------------------------------------
  INSERT INTO public.courts (facility_id, name, surface, type, price, status, is_demo, is_seed)
  SELECT id, 'Court 1 – Championship', 'Hard', 'Indoor', 200, 'available', true, false
  FROM public.facilities WHERE owner_id = mock_owner AND is_demo = true;

  INSERT INTO public.courts (facility_id, name, surface, type, price, status, occupied_from, occupied_until, occupied_by, is_demo, is_seed)
  SELECT id, 'Court 2 – Standard', 'Hard', 'Indoor', 150, 'occupied', '08:00 AM', '10:00 AM', 'Alex Johnson', true, false
  FROM public.facilities WHERE owner_id = mock_owner AND is_demo = true;

  INSERT INTO public.courts (facility_id, name, surface, type, price, status, is_demo, is_seed)
  SELECT id, 'Court 3 – Outdoor Clay', 'Clay', 'Outdoor', 120, 'available', true, false
  FROM public.facilities WHERE owner_id = mock_owner AND is_demo = true;

  -- ---------------------------------------------------------------
  -- 8. 12 OPEN PLAY SESSIONS
  -- ---------------------------------------------------------------
  INSERT INTO public.matches (title, type, status, date, time, location, price, level, participants, max_participants, facility, court, players, created_by, is_demo, is_seed)
  VALUES
    ('Saturday Morning Doubles',    'Doubles','open', (CURRENT_DATE+7)::text,  '08:00 AM','Metro Smashers Hub',     250,'Intermediate',2, 4,  'Metro Smashers Hub',    'Court 1',jsonb_build_array(jsonb_build_object('id',mock_u1::text,'name','Alex Johnson',  'level','Intermediate','avatar','')),mock_u1,   true,false),
    ('Beginners Open Play',         'Doubles','open', (CURRENT_DATE+8)::text,  '10:00 AM','Green Valley Courts',    150,'Beginner',    3, 8,  'Green Valley Courts',   'Court 2',jsonb_build_array(jsonb_build_object('id',mock_u3::text,'name','Michael Chen', 'level','Intermediate','avatar','')),mock_u3,   true,false),
    ('Competitive Singles Ladder',  'Singles','open', (CURRENT_DATE+10)::text, '06:00 PM','Elite Pickleball Center',300,'Advanced',    1, 8,  'Elite Pickleball Center','Court 1',jsonb_build_array(jsonb_build_object('id',mock_u2::text,'name','Sarah Williams','level','Advanced','avatar','')),mock_u2,   true,false),
    ('After-work Dink Session',     'Doubles','full', (CURRENT_DATE+3)::text,  '07:00 PM','Ortigas Paddle Club',    200,'All Levels',  4, 4,  'Ortigas Paddle Club',   'Court 4',jsonb_build_array(jsonb_build_object('id',mock_u4::text,'name','Jessica Davis','level','Advanced','avatar','')),mock_u4,   true,false),
    ('BGC Night Smash',             'Doubles','open', (CURRENT_DATE+5)::text,  '09:00 PM','Metro Smashers Hub',     400,'Advanced',    2, 12, 'Metro Smashers Hub',    'Court 2',jsonb_build_array(jsonb_build_object('id',mock_u1::text,'name','Alex Johnson',  'level','Intermediate','avatar','')),mock_u1,   true,false),
    ('Mixed Doubles Tournament Prep','Doubles','open',(CURRENT_DATE+12)::text, '07:30 AM','The Dink Lounge',        350,'Intermediate',3, 8,  'The Dink Lounge',       'Court 1',jsonb_build_array(jsonb_build_object('id',mock_u5::text,'name','Marco Reyes',  'level','Beginner','avatar','')),mock_u5,   true,false),
    ('Pro Level Clinic',            'Singles','open', (CURRENT_DATE+14)::text, '05:00 PM','Elite Pickleball Center',600,'Advanced',    1, 6,  'Elite Pickleball Center','Court 3',jsonb_build_array(jsonb_build_object('id',mock_u6::text,'name','Nina Santos',  'level','Advanced','avatar','')),mock_u6,   true,false),
    ('Bayview Sunset Social',       'Doubles','open', (CURRENT_DATE+6)::text,  '05:30 PM','Bayview Pickleball',     200,'All Levels',  2, 16, 'Bayview Pickleball',    'Court 1',jsonb_build_array(jsonb_build_object('id',mock_u2::text,'name','Sarah Williams','level','Advanced','avatar','')),mock_u2,   true,false),
    ('Weekend Warriors Open',       'Doubles','open', (CURRENT_DATE+9)::text,  '09:00 AM','Southside Smash',        180,'Beginner',    4, 8,  'Southside Smash',       'Court 2',jsonb_build_array(jsonb_build_object('id',mock_u3::text,'name','Michael Chen', 'level','Intermediate','avatar','')),mock_u3,   true,false),
    ('Lunchtime Quick Smash',       'Doubles','open', (CURRENT_DATE+4)::text,  '12:00 PM','Riverfront Courts',      150,'All Levels',  1, 4,  'Riverfront Courts',     'Court 1',jsonb_build_array(jsonb_build_object('id',mock_u4::text,'name','Jessica Davis','level','Advanced','avatar','')),mock_u4,   true,false),
    ('Sunrise Rally Fitness',       'Singles','open', (CURRENT_DATE+11)::text, '06:00 AM','Sunrise Pickle Club',    100,'Beginner',    0, 4,  'Sunrise Pickle Club',   'Court 3','[]'::jsonb,                                                                                                mock_u5,   true,false),
    ('San Juan Friday Night',       'Doubles','open', (CURRENT_DATE+13)::text, '08:00 PM','San Juan Dinkers',       300,'Advanced',    2, 8,  'San Juan Dinkers',      'Court 1',jsonb_build_array(jsonb_build_object('id',mock_u6::text,'name','Nina Santos',  'level','Advanced','avatar','')),mock_u6,   true,false);

  -- ---------------------------------------------------------------
  -- 9. 3 CLUBS
  -- ---------------------------------------------------------------
  INSERT INTO public.clubs (name, description, member_count, admin_id, is_demo, is_seed)
  VALUES ('Metro Smashers','The most active pickleball club in Metro Manila. Weekly round-robins every Saturday.',128,mock_u1,true,false)
  RETURNING id INTO club1_id;

  INSERT INTO public.clubs (name, description, member_count, admin_id, is_demo, is_seed)
  VALUES ('Elite Dinkers','Competitive club for 4.0+ rated players. Monthly ladder tournaments.',45,mock_u2,true,false)
  RETURNING id INTO club2_id;

  INSERT INTO public.clubs (name, description, member_count, admin_id, is_demo, is_seed)
  VALUES ('Weekend Warriors','Casual weekend games, social events, and coaching sessions for beginners.',312,mock_u3,true,false)
  RETURNING id INTO club3_id;

  -- ---------------------------------------------------------------
  -- 10. 5 FEED POSTS WITH COMMENTS & LIKES
  -- ---------------------------------------------------------------
  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (mock_u2,'Just hit my first 4.5 rating! The grind was worth it. Thanks to everyone who played with me this past month 🏓🔥',NULL,14,3,true,false)
  RETURNING id INTO post1_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (mock_u1,'Metro Smashers Hub just upgraded their courts — brand new hard surface on all 3 courts. Must visit! 💚','https://images.unsplash.com/photo-1622228399564-946d849b28b7?q=80&w=800&auto=format&fit=crop',22,5,true,false)
  RETURNING id INTO post2_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (mock_u6,'Looking for doubles partners for the BGC Night Smash next Saturday. 4.5+ only, serious players please! DM me 🤙',NULL,8,2,true,false)
  RETURNING id INTO post3_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (mock_u4,'Pro tip: Your third shot drop is everything. Spent 2 hours drilling it at Elite Pickleball Center today. The courts are impeccable.',NULL,31,7,true,false)
  RETURNING id INTO post4_id;

  INSERT INTO public.feed_posts (author_id, content, image_url, like_count, comment_count, is_demo, is_seed)
  VALUES (mock_u3,'Just joined the Weekend Warriors club and already made 5 new friends. This community is amazing ❤️',NULL,17,4,true,false)
  RETURNING id INTO post5_id;

  -- Comments
  INSERT INTO public.feed_comments (post_id, author_id, content, is_demo, is_seed) VALUES
    (post1_id, mock_u1, 'Congrats Sarah! You deserved it, your dink game improved so much!',               true,false),
    (post1_id, mock_u4, 'Amazing! Let''s celebrate with a match this weekend 🎉',                         true,false),
    (post1_id, mock_u6, 'Next milestone: 5.0! You''re on track 💪',                                       true,false),
    (post2_id, mock_u3, 'I was there last week — those courts are absolutely premium!',                   true,false),
    (post2_id, mock_u2, 'Booked for Saturday already. See you there!',                                    true,false),
    (post3_id, mock_u4, 'Sending you a DM now, I''m 4.5 rated!',                                         true,false),
    (post4_id, mock_u1, 'This is the advice I needed. Going to drill tomorrow morning!',                  true,false),
    (post4_id, mock_u5, 'Can we book a session together to work on this?',                               true,false),
    (post5_id, mock_u6, 'Welcome! You''re going to love this community!',                                 true,false);

  -- ---------------------------------------------------------------
  -- 11. DIRECT MESSAGES — 4 Rich Conversations for Inbox
  -- ---------------------------------------------------------------
  -- Conversation 1: Alex Johnson ↔ Demo User
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read, created_at) VALUES
    (mock_u1, demo_uid, 'Hey! Are you joining the Saturday morning doubles?',                       true,  now()-interval'2 days'),
    (demo_uid, mock_u1, 'Absolutely! What time are you getting there?',                             true,  now()-interval'2 days 23 hours 55 minutes'),
    (mock_u1, demo_uid, 'Planning to arrive at 7:45 to warm up 🏓',                                true,  now()-interval'2 days 23 hours 52 minutes'),
    (demo_uid, mock_u1, 'Perfect, see you then!',                                                   true,  now()-interval'2 days 23 hours 50 minutes'),
    (mock_u1, demo_uid, 'Great game yesterday by the way, that dink rally was 🔥',                 false, now()-interval'10 minutes');

  -- Conversation 2: Sarah Williams ↔ Demo User
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read, created_at) VALUES
    (mock_u2, demo_uid, 'Rematch? I want to even the score from last week 😄',                     true,  now()-interval'1 day'),
    (demo_uid, mock_u2, 'Anytime! Elite Pickleball Center, Thursday evening?',                     true,  now()-interval'23 hours 45 minutes'),
    (mock_u2, demo_uid, 'Thursday works. I''ll book Court 1.',                                     true,  now()-interval'23 hours'),
    (mock_u2, demo_uid, 'Booked ✅ See you at 6 PM!',                                              false, now()-interval'30 minutes');

  -- Conversation 3: Jessica Davis ↔ Demo User
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read, created_at) VALUES
    (mock_u4, demo_uid, 'Your footwork during the BGC night game was incredible. What drills do you do?',        true,  now()-interval'3 days'),
    (demo_uid, mock_u4, 'Thank you! Mostly ladder drills and shadow movement. I can send you a routine!',        true,  now()-interval'2 days 23 hours 40 minutes'),
    (mock_u4, demo_uid, 'Please do! I really want to level up before the tournament.',                           true,  now()-interval'2 days 23 hours 30 minutes'),
    (mock_u4, demo_uid, 'Also, want to join our Weekend Warriors session this Sunday?',                          false, now()-interval'1 hour');

  -- Conversation 4: Nina Santos ↔ Demo User
  INSERT INTO public.direct_messages (sender_id, receiver_id, content, read, created_at) VALUES
    (mock_u6, demo_uid, 'I watched your match last Saturday. You have real potential — ever considered competitive play?', true,  now()-interval'5 days'),
    (demo_uid, mock_u6, 'Wow, that means a lot coming from you! I''d love some coaching tips.',                           true,  now()-interval'4 days 23 hours'),
    (mock_u6, demo_uid, 'Let''s set up a session at Elite Pickleball. I coach there Tuesdays and Fridays.',               true,  now()-interval'4 days'),
    (demo_uid, mock_u6, 'Friday at 5 PM would be perfect!',                                                               true,  now()-interval'3 days 23 hours 50 minutes'),
    (mock_u6, demo_uid, 'Done! I''ll have the court reserved. Bring your A-game 💪',                                      false, now()-interval'2 hours');

  RAISE NOTICE 'Demo seed completed successfully. demoaccount@gmail.com (%) is ready.', demo_uid;
END $$;
