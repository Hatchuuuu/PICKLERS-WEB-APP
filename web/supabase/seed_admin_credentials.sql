-- =====================================================================
-- PICKLERS — SEED ADMIN, DEV & DEMO ACCOUNTS WITH SET PASSWORDS
-- Copy and paste this script into the Supabase SQL Editor and click Run.
-- Password for all accounts: password123
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure dev_role constraint supports all engineering roles
ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_dev_role_check;
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_dev_role_check
  CHECK (dev_role IS NULL OR dev_role IN (
    'super_developer', 'lead_dev', 'lead_architect', 'platform_engineer', 
    'sre_devops', 'backend_engineer', 'frontend_engineer', 'security_engineer', 
    'developer_viewer', 'developer', 'senior_dev', 'qa_engineer'
  ));

DO $$
DECLARE
  v_dev_uid   UUID;
  v_admin_uid UUID;
  v_demo_uid  UUID;
  v_pwd_hash  TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  -- 1. Resolve or Insert Developer account (dev@picklers.com / password123)
  SELECT id INTO v_dev_uid FROM auth.users WHERE email = 'dev@picklers.com' LIMIT 1;
  IF v_dev_uid IS NULL THEN
    v_dev_uid := '99999999-9999-9999-9999-999999999999'::uuid;
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
    VALUES (v_dev_uid, '00000000-0000-0000-0000-000000000000', 'dev@picklers.com', '{"full_name":"Lead Developer"}', v_pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW());
  ELSE
    UPDATE auth.users 
    SET encrypted_password = v_pwd_hash, email_confirmed_at = NOW(), raw_user_meta_data = '{"full_name":"Lead Developer"}'
    WHERE id = v_dev_uid;
  END IF;

  INSERT INTO public.player_profiles (id, name, role, is_admin, admin_role, dev_role, console_access, verification_status)
  VALUES (v_dev_uid, 'Lead Developer', 'dev', TRUE, 'super_admin', 'super_developer', ARRAY['player', 'admin', 'dev'], 'verified')
  ON CONFLICT (id) DO UPDATE SET 
    is_admin = TRUE, 
    admin_role = 'super_admin', 
    dev_role = 'super_developer', 
    console_access = ARRAY['player', 'admin', 'dev'], 
    role = 'dev', 
    verification_status = 'verified';

  -- 2. Resolve or Insert Super Admin account (admin@picklers.com / password123)
  SELECT id INTO v_admin_uid FROM auth.users WHERE email = 'admin@picklers.com' LIMIT 1;
  IF v_admin_uid IS NULL THEN
    v_admin_uid := '88888888-8888-8888-8888-888888888888'::uuid;
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
    VALUES (v_admin_uid, '00000000-0000-0000-0000-000000000000', 'admin@picklers.com', '{"full_name":"Super Admin"}', v_pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW());
  ELSE
    UPDATE auth.users 
    SET encrypted_password = v_pwd_hash, email_confirmed_at = NOW(), raw_user_meta_data = '{"full_name":"Super Admin"}'
    WHERE id = v_admin_uid;
  END IF;

  INSERT INTO public.player_profiles (id, name, role, is_admin, admin_role, dev_role, console_access, verification_status)
  VALUES (v_admin_uid, 'Super Admin', 'admin', TRUE, 'super_admin', 'super_developer', ARRAY['player', 'admin', 'dev'], 'verified')
  ON CONFLICT (id) DO UPDATE SET 
    is_admin = TRUE, 
    admin_role = 'super_admin', 
    dev_role = 'super_developer', 
    console_access = ARRAY['player', 'admin', 'dev'], 
    role = 'admin', 
    verification_status = 'verified';

  -- 3. Resolve or Insert Demo Player account (demoaccount@gmail.com / password123)
  SELECT id INTO v_demo_uid FROM auth.users WHERE email = 'demoaccount@gmail.com' LIMIT 1;
  IF v_demo_uid IS NULL THEN
    v_demo_uid := '77777777-7777-7777-7777-777777777777'::uuid;
    INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
    VALUES (v_demo_uid, '00000000-0000-0000-0000-000000000000', 'demoaccount@gmail.com', '{"full_name":"Demo Player"}', v_pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW());
  ELSE
    UPDATE auth.users 
    SET encrypted_password = v_pwd_hash, email_confirmed_at = NOW(), raw_user_meta_data = '{"full_name":"Demo Player"}'
    WHERE id = v_demo_uid;
  END IF;

  INSERT INTO public.player_profiles (id, name, level, role, is_demo, verification_status, avatar_url, console_access)
  VALUES (v_demo_uid, 'Demo Player', '3.5', 'demo', TRUE, 'verified', 'https://i.pravatar.cc/150?img=5', ARRAY['player', 'admin', 'dev'])
  ON CONFLICT (id) DO UPDATE SET 
    role = 'demo', 
    is_demo = TRUE, 
    verification_status = 'verified', 
    console_access = ARRAY['player', 'admin', 'dev'];

  -- 4. Auto-elevate picklersdev and ricdarrylzernacielo if exist
  UPDATE public.player_profiles
  SET 
    is_admin = TRUE,
    role = 'dev',
    admin_role = 'super_admin',
    dev_role = 'super_developer',
    console_access = ARRAY['player', 'admin', 'dev'],
    verification_status = 'verified'
  WHERE 
    id IN (
      SELECT id FROM auth.users 
      WHERE LOWER(email) LIKE '%picklersdev%'
         OR LOWER(email) LIKE '%ricdarrylzernacielo%'
         OR LOWER(email) LIKE '%admin@picklers.com%'
         OR LOWER(email) LIKE '%dev@picklers.com%'
    );

END $$;
