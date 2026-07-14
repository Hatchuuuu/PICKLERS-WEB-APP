import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xyz.supabase.co', 'ey...');
console.log('resetPasswordForPhone exists:', typeof supabase.auth.resetPasswordForPhone);
