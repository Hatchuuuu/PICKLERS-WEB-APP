-- Ensure dev_role constraint supports all engineering roles
ALTER TABLE public.player_profiles DROP CONSTRAINT IF EXISTS player_profiles_dev_role_check;
ALTER TABLE public.player_profiles ADD CONSTRAINT player_profiles_dev_role_check
  CHECK (dev_role IS NULL OR dev_role IN (
    'super_developer', 'lead_dev', 'lead_architect', 'platform_engineer', 
    'sre_devops', 'backend_engineer', 'frontend_engineer', 'security_engineer', 
    'developer_viewer', 'developer', 'senior_dev', 'qa_engineer'
  ));

-- Auto-elevate developer and administrator accounts in player_profiles
UPDATE public.player_profiles
SET 
  is_admin = TRUE,
  role = 'dev',
  admin_role = 'super_admin',
  dev_role = 'super_developer',
  verification_status = 'verified',
  console_access = ARRAY['player', 'admin', 'dev']
WHERE 
  id IN (
    SELECT id FROM auth.users 
    WHERE LOWER(email) LIKE '%picklersdev%' 
       OR LOWER(email) LIKE '%admin@picklers.com%' 
       OR LOWER(email) LIKE '%dev@picklers.com%'
       OR LOWER(email) LIKE '%@picklers.com%'
  );
