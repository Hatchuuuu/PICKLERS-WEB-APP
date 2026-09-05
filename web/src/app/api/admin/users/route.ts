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
    const search = searchParams.get('search')?.trim() ?? '';
    const role = searchParams.get('role') ?? 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('admin-users', `${search}-${role}-${page}-${limit}`);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour)
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
      .from('player_profiles')
      .select('id, name, email, avatar_url, role, is_admin, admin_role, dev_role, account_status, is_banned, created_at, console_access, permissions', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (role && role !== 'all') {
      if (role === 'admin') {
        query = query.eq('is_admin', true);
      } else {
        query = query.eq('role', role);
      }
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[API/admin/users] Error fetching users:', error);

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

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responseData = {
      data: data || [],
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
  } catch (err: unknown) {
    console.error('[API/admin/users] Exception:', err);

    // Try to return cached data on error
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const role = searchParams.get('role') ?? 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const cacheKey = generateCacheKey('admin-users', `${search}-${role}-${page}-${limit}`);

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

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
