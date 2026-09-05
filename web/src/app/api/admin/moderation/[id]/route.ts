import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.id;
    const body = await request.json();
    const { action, note } = body;

    if (!['approve', 'remove', 'flag'].includes(action)) {
      return NextResponse.json({ error: 'Invalid moderation action' }, { status: 400 });
    }

    let auditAction = '';
    const updatePayload: Record<string, unknown> = {
      moderated_by: adminId,
      moderated_at: new Date().toISOString(),
    };

    if (note) updatePayload.moderation_note = note;

    if (action === 'approve') {
      updatePayload.is_flagged = false;
      updatePayload.is_removed = false;
      auditAction = 'APPROVE_FEED_POST';
    } else if (action === 'flag') {
      updatePayload.is_flagged = true;
      auditAction = 'FLAG_FEED_POST';
    } else if (action === 'remove') {
      updatePayload.is_removed = true;
      updatePayload.is_flagged = false;
      auditAction = 'REMOVE_FEED_POST';
    }

    // Try updating feed_posts table
    const { error: updateErr } = await supabase
      .from('feed_posts')
      .update(updatePayload)
      .eq('id', postId);

    if (updateErr) {
      console.error('[API/admin/moderation/[id]] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log to admin_audit_logs
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: auditAction,
      target_type: 'feed_post',
      target_id: postId,
      metadata: { action, note: note || null },
      ip_address: ipAddress,
    });

    return NextResponse.json({ success: true, action }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/moderation/[id]] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
