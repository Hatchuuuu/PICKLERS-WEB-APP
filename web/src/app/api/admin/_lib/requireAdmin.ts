import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasConsoleAccess, hasPermission, type AdminPermissionScope } from '@/types/permissions';

export interface AdminSession {
  adminId: string;
  role: string;
  adminRole?: string;
  email?: string;
}

export async function requireAdmin(
  supabase: SupabaseClient,
  requiredPermission?: AdminPermissionScope
): Promise<AdminSession | NextResponse> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Session missing or invalid' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('player_profiles')
    .select('id, is_admin, role, admin_role, dev_role, account_status, console_access, permissions')
    .eq('id', user.id)
    .maybeSingle();

  const userWithProfile = { ...(profile || {}), id: user.id, email: user.email };
  const isAuthorizedAdmin = hasConsoleAccess(userWithProfile, 'admin');

  if (!isAuthorizedAdmin) {
    return NextResponse.json({ error: 'Forbidden: Business Admin console access required' }, { status: 403 });
  }

  if (requiredPermission && !hasPermission(userWithProfile, requiredPermission)) {
    return NextResponse.json({ error: `Forbidden: Missing required permission [${requiredPermission}]` }, { status: 403 });
  }

  return {
    adminId: user.id,
    role: profile?.admin_role || profile?.role || 'admin',
    adminRole: profile?.admin_role || 'platform_admin',
    email: user.email,
  };
}
