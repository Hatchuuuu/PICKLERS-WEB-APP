import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { createAdminSupabase } from '../../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../../_lib/rateLimit';

const ALLOWED_ADMIN_ROLES = [
  'super_admin',
  'platform_admin',
  'operations_admin',
  'finance_admin',
  'moderator',
  'content_manager',
  'analytics_viewer',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_promote_user', 10, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase, 'users.promote');
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId, role: actingAdminRole } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams.id;
    const body = await request.json();
    const { adminRole = 'moderator', reason } = body;

    if (adminId === targetUserId) {
      return NextResponse.json({ error: 'Self-promotion is prohibited' }, { status: 400 });
    }

    if (!ALLOWED_ADMIN_ROLES.includes(adminRole)) {
      return NextResponse.json({ error: `Invalid admin role. Allowed: ${ALLOWED_ADMIN_ROLES.join(', ')}` }, { status: 400 });
    }

    if (adminRole === 'super_admin' && actingAdminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can promote users to Super Admin' }, { status: 403 });
    }

    const { data: userProfile, error: fetchErr } = await supabase
      .from('player_profiles')
      .select('name, is_admin, is_banned, console_access, admin_role')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentAccess: string[] = Array.isArray(userProfile.console_access) ? userProfile.console_access : ['player'];
    const updatedAccess = Array.from(new Set([...currentAccess, 'admin', 'player']));

    const { error: updateErr } = await supabase
      .from('player_profiles')
      .update({
        is_admin: true,
        admin_role: adminRole,
        console_access: updatedAccess,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('[API/admin/users/[id]/promote] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'PROMOTE_ADMIN',
      target_type: 'user',
      target_id: targetUserId,
      metadata: {
        user_name: userProfile.name,
        admin_role: adminRole,
        reason: reason || 'Assigned via Admin Console',
      },
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully promoted ${userProfile.name} to ${adminRole}`,
      adminRole,
    });
  } catch (err: unknown) {
    console.error('[API/admin/users/[id]/promote] Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
