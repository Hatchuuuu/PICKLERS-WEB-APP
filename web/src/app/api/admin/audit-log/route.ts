import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'all';
    const search = searchParams.get('search')?.trim() ?? '';
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 25;

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('admin-audit-log', `${action}-${search}-${startDate}-${endDate}-${page}-${limit}`);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for audit logs - historical data changes infrequently)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        data: cachedHeuristic.data,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      }, { status: 200 });
    }

    // 2. Try to get from API cache (shorter TTL: 10 minutes)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        data: cachedAPI.data,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      }, { status: 200 });
    }

    // If not in cache, proceed with database queries
    let query = supabase
      .from('admin_audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    if (search) {
      query = query.or(`action.ilike.%${search}%,target_type.ilike.%${search}%,target_id.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      // Try to return cached data on error (fallback to stale cache)
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }

      console.error('[API/admin/audit-log] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const adminIds = Array.from(new Set((logs || []).map((l: { admin_id?: string }) => l.admin_id).filter(Boolean)));
    const profilesRes = adminIds.length > 0
      ? await supabase.from('player_profiles').select('id, name, avatar_url').in('id', adminIds)
      : { data: [] };
    const profileMap = new Map((profilesRes.data || []).map((p: { id: string }) => [p.id, p]));

    const enrichedLogs = (logs || []).map((l: any) => ({
      ...l,
      admin: (l.admin_id ? profileMap.get(l.admin_id) : null) || { id: l.admin_id, name: 'System Admin' },
    }));

    const responseData = {
      data: enrichedLogs,
      total: count || 0,
      page,
      limit,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    // Try to return cached data on error
    try {
      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action') ?? 'all';
      const search = searchParams.get('search')?.trim() ?? '';
      const startDate = searchParams.get('startDate') ?? '';
      const endDate = searchParams.get('endDate') ?? '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = 25;
      const cacheKey = generateCacheKey('admin-audit-log', `${action}-${search}-${startDate}-${endDate}-${page}-${limit}`);

      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }
    } catch (cacheError) {
      console.error('[API/admin/audit-log] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/audit-log] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
