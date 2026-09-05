import { NextResponse, type NextRequest } from 'next/server';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { createDevSupabase } from '../../_lib/createDevSupabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createDevSupabase();
    const authResult = await requireDeveloper(supabase, 'threats.mitigate');
    if (authResult instanceof NextResponse) return authResult;

    const { developerId } = authResult;
    const resolvedParams = await Promise.resolve(params);
    const eventId = resolvedParams.id;
    const body = await request.json();
    const { status, note } = body;

    if (!['mitigated', 'resolved', 'ignored', 'detected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status parameter' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('security_threat_events')
      .update({
        status,
        resolved_by: developerId,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await supabase.from('developer_audit_logs').insert({
      developer_id: developerId,
      action: 'UPDATE_THREAT_STATUS',
      category: 'system',
      environment: 'production',
      target_type: 'security_threat_event',
      target_id: eventId,
      details: { new_status: status, note: note || null },
    });

    return NextResponse.json({ success: true, status }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/dev/threats/[id]] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
