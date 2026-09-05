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
    const type = searchParams.get('type') ?? 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('facilities', `${search}-${type}-${page}-${limit}`);

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
      .from('facilities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: facilitiesData, count, error } = await query;

    if (error) {
      console.error('[API/admin/facilities] Error fetching facilities:', error);

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

    // Enrich owners
    const ownerIds = Array.from(new Set((facilitiesData || []).map(f => f.owner_id).filter(Boolean)));
    const ownersRes = ownerIds.length > 0
      ? await supabase.from('player_profiles').select('id, name, avatar_url').in('id', ownerIds)
      : { data: [] };
    const ownerMap = new Map((ownersRes.data || []).map((o: any) => [o.id, o]));

    const enrichedFacilities = (facilitiesData || []).map((f: any) => ({
      ...f,
      owner: ownerMap.get(f.owner_id) || { id: f.owner_id, name: 'Facility Owner', avatar_url: null },
    }));

    const responseData = {
      data: enrichedFacilities,
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
    console.error('[API/admin/facilities] Exception:', err);

    // Try to return cached data on error
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() ?? '';
    const type = searchParams.get('type') ?? 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 20;
    const cacheKey = generateCacheKey('facilities', `${search}-${type}-${page}-${limit}`);

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

    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
