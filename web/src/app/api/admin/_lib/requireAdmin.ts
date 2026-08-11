import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function requireAdmin(supabase: SupabaseClient): Promise<{ adminId: string } | NextResponse> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('player_profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single();

  const isAdminOrDev = Boolean(profile?.is_admin) || profile?.role === 'admin' || profile?.role === 'dev';

  if (profileError || !isAdminOrDev) {
    return NextResponse.json({ error: 'Forbidden: Admin or Developer access required' }, { status: 403 });
  }

  return { adminId: user.id };
}
