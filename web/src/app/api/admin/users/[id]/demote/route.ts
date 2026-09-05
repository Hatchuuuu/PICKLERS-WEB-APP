import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { createAdminSupabase } from '../../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../../_lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_demote_user', 10, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase, 'users.promote');
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const targetUserId = resolvedParams.id;
    const body = await request.json();
    const { reason } = body;

    if (adminId === targetUserId) {
      return NextResponse.json({ error: 'Self-demotion is prohibited' }, { status: 400 });
    }

    const { data: userProfile, error: fetchErr } = await supabase
      .from('player_profiles')
      .select('name, is_admin, admin_role, console_access')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    const currentAccess: string[] = Array.isArray(userProfile.console_access) ? userProfile.console_access : ['player'];
    const updatedAccess = currentAccess.filter((c) => c !== 'admin');
    if (!updatedAccess.includes('player')) updatedAccess.push('player');

    const { error: updateErr } = await supabase
      .from('player_profiles')
      .update({
        is_admin: false,
        admin_role: null,
        console_access: updatedAccess,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('[API/admin/users/[id]/demote] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'DEMOTE_ADMIN',
      target_type: 'user',
      target_id: targetUserId,
      metadata: {
        user_name: userProfile.name,
        previous_role: userProfile.admin_role,
        reason: reason || 'Revoked via Admin Console',
      },
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully revoked admin access from ${userProfile.name}`,
    });
  } catch (err: unknown) {
    console.error('[API/admin/users/[id]/demote] Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
