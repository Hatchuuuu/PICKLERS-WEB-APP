import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasConsoleAccess, hasPermission, type DevPermissionScope } from '@/types/permissions';

export interface DeveloperSession {
  developerId: string;
  role: string;
  isAdmin: boolean;
  email?: string;
  name?: string;
}

export async function requireDeveloper(
  supabase: SupabaseClient,
  requiredPermission?: DevPermissionScope
): Promise<DeveloperSession | NextResponse> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized: Session missing or invalid' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('player_profiles')
    .select('id, name, is_admin, role, admin_role, dev_role, account_status, console_access, permissions')
    .eq('id', user.id)
    .maybeSingle();

  const userWithProfile = { ...(profile || {}), id: user.id, email: user.email };
  const isAuthorizedDev = hasConsoleAccess(userWithProfile, 'dev');

  if (!isAuthorizedDev) {
    return NextResponse.json(
      { error: 'Forbidden: Developer authorization required for technical control center access' },
      { status: 403 }
    );
  }

  if (requiredPermission && !hasPermission(userWithProfile, requiredPermission)) {
    return NextResponse.json(
      { error: `Forbidden: Missing required developer permission [${requiredPermission}]` },
      { status: 403 }
    );
  }

  return {
    developerId: user.id,
    role: profile?.dev_role || profile?.role || 'dev',
    isAdmin: Boolean(profile?.is_admin || isAuthorizedDev),
    email: user.email,
    name: profile?.name || user.email?.split('@')[0] || 'Developer',
  };
}

