import { NextResponse, type NextRequest } from 'next/server';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { createDevSupabase } from '../../_lib/createDevSupabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createDevSupabase();
    const authResult = await requireDeveloper(supabase, 'threats.mitigate');
    if (authResult instanceof NextResponse) return authResult;

    const { developerId } = authResult;
    const body = await request.json();
    const { ip_address, reason, threat_event_id, quarantine_user_id } = body;

    if (!ip_address || typeof ip_address !== 'string') {
      return NextResponse.json({ error: 'Valid ip_address is required' }, { status: 400 });
    }

    // Insert IP into blocked_ips
    const { error: blockErr } = await supabase
      .from('blocked_ips')
      .upsert(
        {
          ip_address: ip_address.trim(),
          reason: reason || 'Malicious penetration or scanner activity detected via Dev IDS',
          threat_event_id: threat_event_id || null,
          blocked_by: developerId,
        },
        { onConflict: 'ip_address' }
      );

    if (blockErr) {
      console.error('[API/dev/threats/block-ip] Error blocking IP:', blockErr);
      return NextResponse.json({ error: blockErr.message }, { status: 500 });
    }

    // If threat_event_id provided, mark that event as blocked
    if (threat_event_id) {
      await supabase
        .from('security_threat_events')
        .update({
          status: 'blocked',
          resolved_by: developerId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', threat_event_id);
    }

    // If quarantine_user_id provided, suspend the associated user account
    if (quarantine_user_id) {
      await supabase
        .from('player_profiles')
        .update({
          account_status: 'suspended',
          is_banned: true,
          banned_reason: `Security quarantine: Malicious intrusion activity from IP ${ip_address}`,
          banned_at: new Date().toISOString(),
        })
        .eq('id', quarantine_user_id);
    }

    // Record developer audit log
    await supabase.from('developer_audit_logs').insert({
      developer_id: developerId,
      action: 'BLOCK_MALICIOUS_IP',
      category: 'system',
      environment: 'production',
      target_type: 'ip_address',
      target_id: ip_address,
      details: {
        reason: reason || 'Intrusion defense',
        threat_event_id: threat_event_id || null,
        quarantined_user_id: quarantine_user_id || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip_address} has been blocked and quarantined successfully`,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/dev/threats/block-ip] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createDevSupabase();
    const authResult = await requireDeveloper(supabase, 'threats.mitigate');
    if (authResult instanceof NextResponse) return authResult;

    const { developerId } = authResult;
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ error: 'ip parameter is required' }, { status: 400 });
    }

    const { error: unblockErr } = await supabase
      .from('blocked_ips')
      .delete()
      .eq('ip_address', ip);

    if (unblockErr) {
      return NextResponse.json({ error: unblockErr.message }, { status: 500 });
    }

    await supabase.from('developer_audit_logs').insert({
      developer_id: developerId,
      action: 'UNBLOCK_IP',
      category: 'system',
      environment: 'production',
      target_type: 'ip_address',
      target_id: ip,
      details: { unblocked_ip: ip },
    });

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been unblocked`,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/dev/threats/block-ip] DELETE Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
