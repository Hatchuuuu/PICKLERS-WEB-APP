import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey, CACHE_TTL } from '@/lib/cacheUtils';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('from') ?? '';
    const endDateParam = searchParams.get('to') ?? '';

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('analytics', `${startDateParam}-${endDateParam}`);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL)
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

    // 2. Try to get from API cache (shorter TTL)
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
    const [
      totalUsersRes,
      totalOwnersRes,
      pendingAppsRes,
      activeFacilitiesRes,
      activePromosRes
    ] = await Promise.all([
      supabase.from('player_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('player_profiles').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
      supabase.from('owner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('facilities').select('*', { count: 'exact', head: true }),
      supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const totalUsers = totalUsersRes.count ?? 0;
    const totalOwners = totalOwnersRes.count ?? 0;
    const pendingApps = pendingAppsRes.count ?? 0;
    const activeFacilities = activeFacilitiesRes.count ?? 0;
    const activePromos = activePromosRes.count ?? 0;

    let totalRevenue = 0;
    let bookingsToday = 0;
    let bookingsThisMonth = 0;
    const timeSeriesData: Array<{ date: string; gmv: number; bookings: number; users: number }> = [];

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      let query = supabase.from('bookings').select('price, created_at');

      if (startDateParam) {
        query = query.gte('created_at', startDateParam);
      }
      if (endDateParam) {
        query = query.lte('created_at', endDateParam);
      }

      const { data: bookingsData } = await query;

      if (bookingsData && Array.isArray(bookingsData)) {
        totalRevenue = bookingsData.reduce((acc, b: { price?: number }) => acc + (Number(b.price) || 0), 0);
        bookingsToday = bookingsData.filter((b: { created_at?: string }) => b.created_at && new Date(b.created_at) >= todayStart).length;
        bookingsThisMonth = bookingsData.filter((b: { created_at?: string }) => b.created_at && new Date(b.created_at) >= monthStart).length;
      }

      // Generate 14-day telemetry trend for charts
      const daysCount = 14;
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const displayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

        const dayBookings = (bookingsData || []).filter((b: { created_at?: string }) => b.created_at && b.created_at.startsWith(dateStr));
        const dayRevenue = dayBookings.reduce((sum: number, b: { price?: number }) => sum + (Number(b.price) || 0), 0);

        timeSeriesData.push({
          date: displayLabel,
          gmv: dayRevenue,
          bookings: dayBookings.length,
          users: 0,
        });
      }
    } catch (bookingErr) {
      console.warn('[API/admin/analytics] Bookings calculation warning:', bookingErr);
    }

    const stats = {
      total_users: totalUsers || 0,
      total_owners: totalOwners || 0,
      active_facilities: activeFacilities || 0,
      pending_applications: pendingApps || 0,
      total_revenue: totalRevenue,
      bookings_today: bookingsToday,
      bookings_this_month: bookingsThisMonth,
      active_promos: activePromos || 0,
      time_series: timeSeriesData,
    };

    const responseData = {
      data: stats,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (long TTL)
    await setCache(cacheKey, responseData, CACHE_TTL.HEURISTIC);

    // Store in API cache (medium TTL)
    await setCache(`${cacheKey}:api`, responseData, CACHE_TTL.API);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/analytics] Exception:', err);

    // Try to return cached data on error (negative caching concept)
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('from') ?? '';
    const endDateParam = searchParams.get('to') ?? '';
    const cacheKey = generateCacheKey('analytics', `${startDateParam}-${endDateParam}`);

    // Try to get stale cached data as fallback
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
