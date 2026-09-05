import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../_lib/rateLimit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // 1. Rate limiting security guard
    const rateLimitError = checkAdminRateLimit(request, 'admin_user_mutation', 20, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId, role: actingAdminRole } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams.id;
    const body = await request.json();
    const { action, reason, admin_role } = body;

    if (adminId === targetUserId) {
      return NextResponse.json({ error: 'Self-action on your own admin account is forbidden' }, { status: 400 });
    }

    if (!['ban', 'unban', 'promote_admin', 'demote_admin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    // Role promotion restriction
    if (action === 'promote_admin') {
      const allowedAdminRoles = ['super_admin', 'platform_admin', 'operations_admin', 'finance_admin', 'moderator'];
      const targetRole = admin_role || 'moderator';
      if (!allowedAdminRoles.includes(targetRole)) {
        return NextResponse.json({ error: `Invalid admin_role: ${targetRole}` }, { status: 400 });
      }
      if (targetRole === 'super_admin' && actingAdminRole !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden: Only Super Admins can promote users to Super Admin' }, { status: 403 });
      }
    }

    const { data: userProfile, error: fetchErr } = await supabase
      .from('player_profiles')
      .select('name, is_admin, is_banned, console_access, admin_role')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    let auditAction = '';
    const currentConsoleAccess: string[] = Array.isArray(userProfile.console_access) ? userProfile.console_access : ['player'];

    if (action === 'ban') {
      updatePayload.is_banned = true;
      updatePayload.banned_reason = reason || 'Violation of terms of service';
      updatePayload.banned_at = new Date().toISOString();
      auditAction = 'BAN_USER';
    } else if (action === 'unban') {
      updatePayload.is_banned = false;
      updatePayload.banned_reason = null;
      updatePayload.banned_at = null;
      auditAction = 'UNBAN_USER';
    } else if (action === 'promote_admin') {
      const updatedAccess = Array.from(new Set([...currentConsoleAccess, 'admin', 'player']));
      updatePayload.is_admin = true;
      updatePayload.admin_role = admin_role || 'moderator';
      updatePayload.console_access = updatedAccess;
      auditAction = 'PROMOTE_ADMIN';
    } else if (action === 'demote_admin') {
      // Protection check: Cannot demote the last remaining super_admin
      if (userProfile.admin_role === 'super_admin') {
        const { count } = await supabase
          .from('player_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('admin_role', 'super_admin')
          .eq('is_admin', true);

        if (count && count <= 1) {
          return NextResponse.json({ error: 'Forbidden: Cannot revoke Admin access from the last remaining Super Admin' }, { status: 403 });
        }
      }

      const updatedAccess = currentConsoleAccess.filter((c) => c !== 'admin');
      if (!updatedAccess.includes('player')) updatedAccess.push('player');

      updatePayload.is_admin = false;
      updatePayload.admin_role = null;
      updatePayload.console_access = updatedAccess;
      auditAction = 'DEMOTE_ADMIN';
    }

    const { error: updateErr } = await supabase
      .from('player_profiles')
      .update(updatePayload)
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('[API/admin/users/[id]] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: auditAction,
      target_type: 'user',
      target_id: targetUserId,
      metadata: {
        user_name: userProfile.name,
        reason: reason || null,
        admin_role: admin_role || null
      },
      ip_address: ipAddress
    });

    return NextResponse.json({ success: true, action }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/users/[id]] PATCH Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
