-- =====================================================================
-- PICKLERS — SEED ADMIN, DEV & DEMO ACCOUNTS WITH SET PASSWORDS
-- Copy and paste this script into the Supabase SQL Editor and click Run.
-- Password for all accounts: password123
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_uid UUID := '88888888-8888-8888-8888-888888888888'::uuid;
  dev_uid   UUID := '99999999-9999-9999-9999-999999999999'::uuid;
  demo_uid  UUID := '77777777-7777-7777-7777-777777777777'::uuid;
  pwd_hash  TEXT := crypt('password123', gen_salt('bf'));
BEGIN
  -- 1. Developer account (dev@picklers.com / password123)
  INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES (dev_uid, '00000000-0000-0000-0000-000000000000', 'dev@picklers.com', '{"full_name":"Lead Developer"}', pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET encrypted_password = pwd_hash, email_confirmed_at = NOW();

  INSERT INTO public.player_profiles (id, name, role, is_admin, admin_role, verification_status)
  VALUES (dev_uid, 'Lead Developer', 'dev', TRUE, 'super_admin', 'verified')
  ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, admin_role = 'super_admin', role = 'dev', verification_status = 'verified';

  -- 2. Super Admin account (admin@picklers.com / password123)
  INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES (admin_uid, '00000000-0000-0000-0000-000000000000', 'admin@picklers.com', '{"full_name":"Super Admin"}', pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET encrypted_password = pwd_hash, email_confirmed_at = NOW();

  INSERT INTO public.player_profiles (id, name, role, is_admin, admin_role, verification_status)
  VALUES (admin_uid, 'Super Admin', 'admin', TRUE, 'super_admin', 'verified')
  ON CONFLICT (id) DO UPDATE SET is_admin = TRUE, admin_role = 'super_admin', role = 'admin', verification_status = 'verified';

  -- 3. Demo Player account (demoaccount@gmail.com / password123)
  INSERT INTO auth.users (id, instance_id, email, raw_user_meta_data, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
  VALUES (demo_uid, '00000000-0000-0000-0000-000000000000', 'demoaccount@gmail.com', '{"full_name":"Demo Player"}', pwd_hash, NOW(), 'authenticated', 'authenticated', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET encrypted_password = pwd_hash, email_confirmed_at = NOW();

  INSERT INTO public.player_profiles (id, name, level, role, is_demo, verification_status, avatar_url)
  VALUES (demo_uid, 'Demo Player', '3.5', 'demo', TRUE, 'verified', 'https://i.pravatar.cc/150?img=5')
  ON CONFLICT (id) DO UPDATE SET role = 'demo', is_demo = TRUE, verification_status = 'verified';

END $$;
