-- =====================================================================
-- PICKLERS — SEED ADMIN, DEV & DEMO ACCOUNTS
-- Copy and paste this script into the Supabase SQL Editor and click Run.
-- =====================================================================

DO $$
DECLARE
  admin_uid UUID := '88888888-8888-8888-8888-888888888888'::uuid;
  dev_uid   UUID := '99999999-9999-9999-9999-999999999999'::uuid;
  demo_uid  UUID := '77777777-7777-7777-7777-777777777777'::uuid;
BEGIN
  -- 1. Super Admin account in auth.users
  INSERT INTO auth.users (
    id, instance_id, email, raw_user_meta_data, encrypted_password,
    email_confirmed_at, role, aud, created_at, updated_at
  )
  VALUES (
    admin_uid,
    '00000000-0000-0000-0000-000000000000',
    'admin@picklers.com',
    '{"full_name":"Super Admin"}',
    '$2a$10$e.x/J9.V6Yl5aJz5c4/Bf.8w0d.OaXN.aJ0/5w3a.3/4/5',
    NOW(), 'authenticated', 'authenticated', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Super Admin profile in player_profiles
  INSERT INTO public.player_profiles (
    id, name, role, is_admin, admin_role, verification_status, is_demo, is_seed
  )
  VALUES (
    admin_uid, 'Super Admin', 'admin', TRUE, 'super_admin', 'verified', FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = TRUE, admin_role = 'super_admin', role = 'admin', verification_status = 'verified';

  -- 3. Developer account in auth.users
  INSERT INTO auth.users (
    id, instance_id, email, raw_user_meta_data, encrypted_password,
    email_confirmed_at, role, aud, created_at, updated_at
  )
  VALUES (
    dev_uid,
    '00000000-0000-0000-0000-000000000000',
    'dev@picklers.com',
    '{"full_name":"Lead Developer"}',
    '$2a$10$e.x/J9.V6Yl5aJz5c4/Bf.8w0d.OaXN.aJ0/5w3a.3/4/5',
    NOW(), 'authenticated', 'authenticated', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 4. Developer profile in player_profiles (role='dev', is_admin=TRUE)
  INSERT INTO public.player_profiles (
    id, name, role, is_admin, admin_role, verification_status, is_demo, is_seed
  )
  VALUES (
    dev_uid, 'Lead Developer', 'dev', TRUE, 'super_admin', 'verified', FALSE, FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = TRUE, admin_role = 'super_admin', role = 'dev', verification_status = 'verified';

  -- 5. Demo Player account in auth.users
  INSERT INTO auth.users (
    id, instance_id, email, raw_user_meta_data, encrypted_password,
    email_confirmed_at, role, aud, created_at, updated_at
  )
  VALUES (
    demo_uid,
    '00000000-0000-0000-0000-000000000000',
    'demoaccount@gmail.com',
    '{"full_name":"Demo Player"}',
    '$2a$10$e.x/J9.V6Yl5aJz5c4/Bf.8w0d.OaXN.aJ0/5w3a.3/4/5',
    NOW(), 'authenticated', 'authenticated', NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 6. Demo Player profile in player_profiles
  INSERT INTO public.player_profiles (
    id, name, level, role, is_demo, verification_status, avatar_url
  )
  VALUES (
    demo_uid, 'Demo Player', '3.5', 'demo', TRUE, 'verified', 'https://i.pravatar.cc/150?img=5'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'demo', is_demo = TRUE, verification_status = 'verified';

END $$;
