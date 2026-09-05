import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    // Create a normalized cache key (no parameters for this endpoint)
    const cacheKey = generateCacheKey('admin-finance');

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 30 minutes for financial aggregates)
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
    // Aggregate overall financial KPIs from wallets, bookings, and payout_batches
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance');

    const totalBalance = (walletData || []).reduce((acc: number, curr: { balance: number }) => acc + (curr.balance || 0), 0);

    // Only non-cancelled bookings contribute to platform GMV
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('price')
      .in('status', ['completed', 'active', 'upcoming']);

    const totalGMV = (bookingData || []).reduce((acc: number, curr: { price: number }) => acc + (curr.price || 0), 0);

    const { data: batches } = await supabase
      .from('payout_batches')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(10);

    const pendingBatches = (batches || []).filter((b: { status: string }) => b.status === 'queued' || b.status === 'processing').length;

    const responseData = {
      data: {
        total_gmv: totalGMV,
        platform_revenue: Math.round(totalGMV * 0.1), // 10% platform fee
        escrow_balance: totalBalance,
        active_payouts_pending: pendingBatches,
        batches: batches || [],
      }
    };

    // Store in heuristic cache (TTL: 30 minutes = 1800 seconds)
    await setCache(cacheKey, responseData, 1800);

    // Store in API cache (TTL: 5 minutes = 300 seconds)
    await setCache(`${cacheKey}:api`, responseData, 300);

    return NextResponse.json({
      data: responseData.data,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    }, { status: 200 });
  } catch (err: unknown) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const cacheKey = generateCacheKey('admin-finance');
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
      console.error('[API/admin/finance] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/finance] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
