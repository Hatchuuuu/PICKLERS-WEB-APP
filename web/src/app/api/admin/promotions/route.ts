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

    // Create a normalized cache key based on search parameter
    const cacheKey = generateCacheKey('admin-promotions', search ?? 'all');

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for promotions data)
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
    let query = supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

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

      console.error('[API/admin/promotions] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const responseData = {
      data: data || [],
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    // Try to return cached data on error
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search')?.trim();
      const cacheKey = generateCacheKey('admin-promotions', search ?? 'all');

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
      console.error('[API/admin/promotions] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/promotions] GET Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_booking_amount,
      max_uses,
      applicable_to,
      starts_at,
      expires_at
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Missing required promo fields' }, { status: 400 });
    }

    const formattedCode = String(code).trim().toUpperCase();

    const { data: promoData, error: insertErr } = await supabase
      .from('promotions')
      .insert({
        code: formattedCode,
        description: description || null,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_booking_amount: min_booking_amount ? parseFloat(min_booking_amount) : 0,
        max_uses: max_uses ? parseInt(max_uses, 10) : null,
        applicable_to: applicable_to || 'all',
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        created_by: adminId,
        is_active: true
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[API/admin/promotions] POST insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'CREATE_PROMO',
      target_type: 'promotion',
      target_id: promoData.id,
      metadata: {
        code: formattedCode,
        discount_type,
        discount_value
      },
      ip_address: ipAddress
    });

    return NextResponse.json({ success: true, data: promoData }, { status: 201 });
  } catch (err: unknown) {
    console.error('[API/admin/promotions] POST Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
