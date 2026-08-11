import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib/requireAdmin';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 25;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('admin_audit_logs')
      .select(`
        *,
        admin:player_profiles!admin_id (
          id,
          name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[API/admin/audit-log] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit
    }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/audit-log] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
