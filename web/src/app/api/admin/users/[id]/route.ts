import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdmin } from '../../_lib/requireAdmin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const targetUserId = params.id;
    const body = await request.json();
    const { action, reason, admin_role } = body;

    if (!['ban', 'unban', 'promote_admin', 'demote_admin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    const { data: userProfile, error: fetchErr } = await supabase
      .from('player_profiles')
      .select('name, is_admin, is_banned')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {};
    let auditAction = '';

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
      updatePayload.is_admin = true;
      updatePayload.admin_role = admin_role || 'moderator';
      auditAction = 'PROMOTE_ADMIN';
    } else if (action === 'demote_admin') {
      updatePayload.is_admin = false;
      updatePayload.admin_role = null;
      updatePayload.admin_permissions = [];
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
  } catch (err: any) {
    console.error('[API/admin/users/[id]] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
