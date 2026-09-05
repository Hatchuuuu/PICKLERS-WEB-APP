import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    // Create a normalized cache key based on booking ID
    const cacheKey = generateCacheKey('admin-booking', bookingId);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for booking details - rarely change after confirmation)
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

    // If not in cache, proceed with database query
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
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

      return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
    }

    // Safely hydrate player and facility info
    let player = null;
    let facility = null;

    if (booking.user_id) {
      const { data: profileData } = await supabase
        .from('player_profiles')
        .select('id, name, email, phone, avatar_url')
        .eq('id', booking.user_id)
        .maybeSingle();
      player = profileData;
    }

    if (booking.facility_id) {
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('id, name, location')
        .eq('id', booking.facility_id)
        .maybeSingle();
      facility = facilityData;
    }

    const enrichedBooking = {
      ...booking,
      player: player || { id: booking.user_id, name: 'Player' },
      facility: facility || { id: booking.facility_id, name: 'Facility' },
    };

    const responseData = {
      data: enrichedBooking,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const resolvedParams = await Promise.resolve(params);
      const bookingId = resolvedParams.id;
      const cacheKey = generateCacheKey('admin-booking', bookingId);
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
      console.error('[API/admin/bookings/[id]] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/bookings/[id]] GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ error: 'Unsupported booking action' }, { status: 400 });
    }

    const { data: currentBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchErr || !currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateErr) {
      console.error('[API/admin/bookings/[id]] Cancel error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Write to audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'CANCEL_BOOKING_OVERRIDE',
      target_type: 'booking',
      target_id: String(bookingId),
      metadata: {
        reason: reason || 'Administrative cancellation override',
        original_price: currentBooking.price,
      },
      ip_address: ipAddress,
    });

    return NextResponse.json({ success: true, status: 'cancelled' }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/bookings/[id]] PATCH Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
