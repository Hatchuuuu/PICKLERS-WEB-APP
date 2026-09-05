import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('feed_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === 'flagged') {
      query = query.eq('is_flagged', true);
    } else if (filter === 'clean') {
      query = query.eq('is_flagged', false).eq('is_removed', false);
    }

    const { data: posts, count: totalPosts, error } = await query;

    if (error) {
      console.error('[API/admin/moderation] Error fetching feed posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich author profiles
    const authorIds = Array.from(new Set((posts || []).map(p => p.author_id).filter(Boolean)));
    const authorsRes = authorIds.length > 0
      ? await supabase.from('player_profiles').select('id, name, avatar_url').in('id', authorIds)
      : { data: [] };
    const authorMap = new Map((authorsRes.data || []).map((a: any) => [a.id, a]));

    const enrichedPosts = (posts || []).map((p: any) => ({
      ...p,
      author: authorMap.get(p.author_id) || { id: p.author_id, name: 'User', avatar_url: null },
    }));

    // Count flagged posts pending moderation
    const { count: flaggedCount } = await supabase
      .from('feed_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_flagged', true);

    return NextResponse.json({
      data: enrichedPosts,
      total: totalPosts || 0,
      page,
      limit,
      flagged_count: flaggedCount || 0,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/moderation] Exception:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
