import { NextResponse, type NextRequest } from 'next/server';
import { requireDeveloper } from '../_lib/requireDeveloper';
import { createDevSupabase } from '../_lib/createDevSupabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createDevSupabase();
    const authResult = await requireDeveloper(supabase, 'threats.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const severity = searchParams.get('severity');
    const threatType = searchParams.get('type');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('security_threat_events')
      .select('*, user:player_profiles(id, name, avatar_url)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`ip_address.ilike.%${search}%,target_path.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity);
    }

    if (threatType && threatType !== 'all') {
      query = query.eq('threat_type', threatType);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: events, count, error } = await query;

    if (error) {
      // Graceful fallback if table is not yet migrated in Supabase SQL editor
      if (error.code === 'PGRST204' || error.code === '42P01' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          pending_migration: true,
          message: 'Table security_threat_events pending migration in Supabase SQL editor',
        }, { status: 200 });
      }

      console.error('[API/dev/threats] Error fetching security threats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch list of currently blocked IPs to decorate the events
    const { data: blockedList } = await supabase
      .from('blocked_ips')
      .select('ip_address');

    const blockedSet = new Set((blockedList || []).map((b: { ip_address: string }) => b.ip_address));

    const decorated = (events || []).map((ev: { ip_address: string; status: string }) => ({
      ...ev,
      is_ip_blocked: blockedSet.has(ev.ip_address),
    }));

    return NextResponse.json({
      data: decorated,
      total: count || 0,
      page,
      limit,
    }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/dev/threats] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
