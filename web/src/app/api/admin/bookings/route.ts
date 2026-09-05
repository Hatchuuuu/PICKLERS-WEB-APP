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
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('admin-bookings', `${search}-${status}-${page}-${limit}`);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 30 minutes for bookings data)
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

    // 2. Try to get from API cache (shorter TTL: 5 minutes)
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
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('court_name', `%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: bookingsData, count, error } = await query;

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

      console.error('[API/admin/bookings] Error fetching bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Batch enrich player profiles & facilities
    const userIds = Array.from(new Set((bookingsData || []).map(b => b.user_id).filter(Boolean)));
    const facilityIds = Array.from(new Set((bookingsData || []).map(b => b.facility_id).filter(Boolean)));

    const [playersRes, facilitiesRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('player_profiles').select('id, name, avatar_url').in('id', userIds) : Promise.resolve({ data: [] }),
      facilityIds.length > 0 ? supabase.from('facilities').select('id, name, location').in('id', facilityIds) : Promise.resolve({ data: [] }),
    ]);

    const playerMap = new Map((playersRes.data || []).map((p: any) => [p.id, p]));
    const facilityMap = new Map((facilitiesRes.data || []).map((f: any) => [f.id, f]));

    const enrichedBookings = (bookingsData || []).map((b: any) => ({
      ...b,
      player: playerMap.get(b.user_id) || { id: b.user_id, name: 'Player', avatar_url: null },
      facility: facilityMap.get(b.facility_id) || { id: b.facility_id, name: 'Facility' },
    }));

    const responseData = {
      data: enrichedBookings,
      total: count || 0,
      page,
      limit,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 30 minutes = 1800 seconds)
    await setCache(cacheKey, responseData, 1800);

    // Store in API cache (TTL: 5 minutes = 300 seconds)
    await setCache(`${cacheKey}:api`, responseData, 300);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    // Try to return cached data on error
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search')?.trim();
      const status = searchParams.get('status');
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = 20;
      const cacheKey = generateCacheKey('admin-bookings', `${search}-${status}-${page}-${limit}`);

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
      console.error('[API/admin/bookings] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/bookings] Exception:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
