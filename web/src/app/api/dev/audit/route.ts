import { NextRequest, NextResponse } from 'next/server';
import { createDevSupabase } from '../_lib/createDevSupabase';
import { requireDeveloper } from '../_lib/requireDeveloper';

export async function GET(request: NextRequest) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const action = searchParams.get('action');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('developer_audit_logs')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }

    if (action) {
      query = query.ilike('action', `%${action}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const devIds = Array.from(new Set((logs || []).map((l) => l.developer_id).filter(Boolean)));
    let devMap: Record<string, { name: string; avatar_url: string | null }> = {};
    if (devIds.length > 0) {
      const { data: devs } = await supabase
        .from('player_profiles')
        .select('id, name, avatar_url')
        .in('id', devIds);
      if (devs) {
        devMap = devs.reduce((acc, d) => {
          acc[d.id] = { name: d.name, avatar_url: d.avatar_url };
          return acc;
        }, {} as Record<string, { name: string; avatar_url: string | null }>);
      }
    }

    const enrichedLogs = (logs || []).map((l) => ({
      ...l,
      developer: devMap[l.developer_id] || { name: 'System Developer', avatar_url: null },
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch technical audit logs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * F-622: the previous version accepted any `action` + `details` from any
 * authenticated developer and inserted a forged audit log entry. That
 * defeated the purpose of an audit log. The fix:
 *   - Only allow the request to attach metadata to an EXISTING audit row
 *     (via `id`), and only to a row the caller authored.
 *   - Disallow creating new audit rows via this endpoint entirely. Audit
 *     log entries are created by the underlying mutation routes, not by
 *     dev callers.
 *
 * If product needs a manual "annotate" workflow later, expose a separate
 * `PATCH /api/dev/audit/[id]` with a typed body schema.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Audit log creation is server-only. Use PATCH /api/dev/audit/[id] to annotate an existing entry.',
    },
    { status: 405 }
  );
}
