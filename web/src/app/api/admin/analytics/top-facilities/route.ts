import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    // Create a normalized cache key (no parameters for this endpoint)
    const cacheKey = generateCacheKey('top-facilities');

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for top facilities - changes infrequently)
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
    // Fetch facilities with owner details
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('id, name, address, owner_id, court_count, rating, created_at')
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(10);

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

      console.error('[API/admin/analytics/top-facilities] Error:', error);
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Enrich with owner profiles if available
    const ownerIds = Array.from(new Set((facilities || []).map(f => f.owner_id).filter(Boolean)));
    const ownerMap: Record<string, string> = {};

    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from('player_profiles')
        .select('id, name')
        .in('id', ownerIds);

      if (owners) {
        owners.forEach(o => { ownerMap[o.id] = o.name; });
      }
    }

    // Query real booking metrics per facility
    const facilityIds = (facilities || []).map(f => f.id);
    const bookingStatsMap: Record<string | number, { count: number; gmv: number }> = {};

    if (facilityIds.length > 0) {
      try {
        const { data: bookingRows } = await supabase
          .from('bookings')
          .select('facility_id, price')
          .in('facility_id', facilityIds);

        if (bookingRows && Array.isArray(bookingRows)) {
          bookingRows.forEach((b: any) => {
            if (b.facility_id) {
              if (!bookingStatsMap[b.facility_id]) {
                bookingStatsMap[b.facility_id] = { count: 0, gmv: 0 };
              }
              bookingStatsMap[b.facility_id].count += 1;
              bookingStatsMap[b.facility_id].gmv += Number(b.price || 0);
            }
          });
        }
      } catch {
        // Fallback gracefully if bookings table query fails
      }
    }

    const formattedFacilities = (facilities || []).map((f, idx) => {
      const stats = bookingStatsMap[f.id] || { count: 0, gmv: 0 };
      return {
        rank: idx + 1,
        id: f.id,
        name: f.name || 'Unnamed Facility',
        owner: ownerMap[f.owner_id] || 'Verified Owner',
        bookings: stats.count,
        gmv: `₱${stats.gmv.toLocaleString()}`,
        rating: f.rating || 4.8
      };
    });

    const responseData = {
      data: formattedFacilities,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const cacheKey = generateCacheKey('top-facilities');
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
      console.error('[API/admin/analytics/top-facilities] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/analytics/top-facilities] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
