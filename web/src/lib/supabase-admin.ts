import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'missing_service_key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
